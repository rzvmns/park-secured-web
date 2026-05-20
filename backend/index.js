const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- CONECTARE POSTGRESQL (RENDER) ---
// --- CONECTARE POSTGRESQL (RENDER) REALĂ ---
const DATABASE_URL = "postgresql://parksecure_db_user:IXxd7rbgbi76Y48ba6HvcJVumIQpkVNs@dpg-d867hqn7f7vs739oi4e0-a.frankfurt-postgres.render.com/parksecure_db";
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error("❌ Eroare la conectarea cu PostgreSQL de pe Render:", err.stack);
  }
  console.log("🐘 Conectat cu succes la baza de date PostgreSQL de pe Render!");
  release();
});

// Starea porții pentru modulul hardware/mobil
const gateStatus = {
  state: "Inchisa",
  activeLed: "Galben",
  esp32: "Conectat",
  lastSync: new Date().toISOString()
};

const updateGate = (state, led) => {
  gateStatus.state = state;
  gateStatus.activeLed = led;
  gateStatus.lastSync = new Date().toISOString();
};

function setGateTemporarilyOpen() {
  updateGate("Deschisa", "Verde");
  setTimeout(() => updateGate("Inchisa", "Galben"), 5000);
}

// --- RUTE COMPATIBILE CU PARTEA COLEGII TALE ---

app.get("/api/status", (req, res) => {
  res.json({ status: "online", mode: "production", database: "postgresql", timestamp: new Date().toISOString() });
});

app.get("/api/gate/status", (req, res) => res.json(gateStatus));

// --- LOGICA DE VALIDARE ADAPTATĂ PENTRU REȚEAUA EI DIN GIT ---
app.post("/api/validate-access", async (req, res) => {
  try {
    const { deviceIdentifier } = req.body; // Prindem identificatorul trimis automat de iPhone

    if (!deviceIdentifier) {
      return res.status(400).json({ authorized: false, message: "Identificator dispozitiv lipsa." });
    }

    // 1. Verificam in Render daca acest dispozitiv este inregistrat si de incredere
    const deviceQuery = `
      SELECT s.*, e.first_name, e.last_name, e.is_active, e.cnp
      FROM smartphones s
      INNER JOIN employees e ON e.employee_id = s.employee_id
      WHERE s.device_identifier = $1
    `;
    const deviceResult = await pool.query(deviceQuery, [deviceIdentifier]);
    const deviceData = deviceResult.rows[0];

    // 2. Daca telefonul nu exista in baza de date sau a fost blocat de admin (is_trusted = false)
    if (!deviceData) {
      return res.status(403).json({ authorized: false, message: "Dispozitiv mobil neinregistrat in sistem!" });
    }
    if (!deviceData.is_trusted) {
      return res.status(403).json({ authorized: false, message: "Acest dispozitiv a fost blocat de administrator." });
    }
    if (!deviceData.is_active) {
      return res.status(403).json({ authorized: false, message: "Contul angajatului asociat este inactiv." });
    }

    // 3. Generam token-ul securizat pe baza Seed-ului (folosim CNP-ul ca Seed fix) si a timpului
    const minutCurent = new Date().getMinutes();
    const stringPentruAmestec = deviceData.cnp + minutCurent;
    let codCalculatPeServer = 0;
    for (let i = 0; i < stringPentruAmestec.length; i++) {
      codCalculatPeServer += stringPentruAmestec.charCodeAt(i);
    }
    codCalculatPeServer = (codCalculatPeServer * 17) % 10000;

    console.log(`[TRUSTED DEVICE] Telefon detectat: ${deviceIdentifier} | Angajat: ${deviceData.first_name} | OTP calculat: ${codCalculatPeServer}`);

    // 4. Inseram evenimentul in tabelul oficial access_events
    const logQuery = `
      INSERT INTO access_events (employee_id, smartphone_id, event_type, event_status, gate_code, source, notes)
      VALUES ($1, $2, 'ENTRY', 'ALLOWED', 'GATE_PIETONAL', 'MOBILE_TRUSTED', 'Acces permis prin dispozitiv asociat securizat')
    `;
    await pool.query(logQuery, [deviceData.employee_id, deviceData.smartphone_id]);

    setGateTemporarilyOpen();
    
    return res.json({ 
      authorized: true, 
      name: `${deviceData.first_name} ${deviceData.last_name}`, 
      action: "OPEN_GATE" 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- RUTĂ PENTRU EXPORT CSV - FIX TIMESTAMPS ---
app.get("/api/export-csv", async (req, res) => {
  try {
    // Luăm tot din tabel FĂRĂ să mai facem sortare pe o coloană fixă (evită eroarea created_at)
    const result = await pool.query("SELECT * FROM access_events");

    if (result.rows.length === 0) {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=raport_gol.csv");
      return res.status(200).send("Baza de date nu contine niciun eveniment de acces in acest moment.");
    }

    // 1. GENERARE DINAMICĂ HEADER
    const columnNames = Object.keys(result.rows[0]);
    let csvContent = columnNames.join(",") + "\n";

    // 2. GENERARE DINAMICĂ RÂNDURI
    result.rows.forEach(row => {
      const rowValues = columnNames.map(colName => {
        let value = row[colName];
        
        if (value === null || value === undefined) {
          return "";
        }
        
        // Verificăm inteligent dacă valoarea este o dată, fără să ne pese cum se numește coloana
        if (value instanceof Date || (typeof value === "string" && value.includes("T") && !isNaN(Date.parse(value)))) {
          try {
            return new Date(value).toISOString().replace("T", " ").substring(0, 19);
          } catch (e) {
            return String(value); // Dacă eșuează formatarea, o lăsăm ca text brut
          }
        }

        let stringValue = String(value);
        if (stringValue.includes(",")) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
      });

      csvContent += rowValues.join(",") + "\n";
    });

    // 3. Header-e descărcare
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=raport_accesari_parksecured.csv");
    
    return res.status(200).send(csvContent);

  } catch (err) {
    console.error("Eroare la generare CSV:", err);
    res.status(500).json({ 
      error: "Nu s-a putut genera raportul CSV.", 
      detalii_tehnice: err.message 
    });
  }
});
    
// Rută temporară care repară datele lui Sorin în Render
app.get("/api/test-db", async (req, res) => {
  try {
    // 1. Ne asiguram ca Sorin are codul 7777
    await pool.query(`UPDATE employees SET badge_code = '7777' WHERE employee_id = 1`);
    
    // 2. Stergem o eventuala inregistrare veche ca sa nu avem eroare de cheie unica
    await pool.query(`DELETE FROM smartphones WHERE device_identifier = 'iphone-teodora'`);

    // 3. Inregistram telefonul tau si il legam de Sorin (employee_id = 1)
    await pool.query(`
      INSERT INTO smartphones (employee_id, platform, device_identifier, is_trusted)
      VALUES (1, 'iOS', 'iphone-teodora', true)
    `);

    // Citim datele ca sa confirmam asocierea
    const result = await pool.query(`
      SELECT e.first_name, e.last_name, s.device_identifier, s.is_trusted 
      FROM smartphones s
      INNER JOIN employees e ON e.employee_id = s.employee_id
      WHERE s.device_identifier = 'iphone-teodora'
    `);
    
    res.json({
      mesaj: "Dispozitiv mobil asociat cu succes in Cloud!",
      asociere: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ eroare: err.message });
  }
});
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend ParkSecured sincronizat cu Git pe portul ${PORT}`);
});

