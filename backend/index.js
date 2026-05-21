const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());


const crypto = require("crypto");
const bcrypt = require("bcrypt"); // sau require("bcryptjs") în funcție de ce apare în package.json

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


// =========================================================================
// 1. ENDPOINT UNIFICAT: AUTENTIFICARE CU BCYCRYPT ȘI EMITERE SEED UNIC
// =========================================================================
app.post("/api/mobile/login-secure", async (req, res) => {
  try {
    const { email, password, platform, deviceIdentifier } = req.body;

    // Validare primară a inputului
    if (!email || !password || !deviceIdentifier) {
      return res.status(400).json({ 
        success: false, 
        message: "Toate câmpurile (email, password, deviceIdentifier) sunt obligatorii!" 
      });
    }

    console.log(`[🔐 LOGIN INTENT] Încercare de autentificare pentru: ${email}`);

    // Pasul A: Căutăm contul în tabela redenumită 'accounts' și tragem datele angajatului activ
    const accountQuery = `
      SELECT a.account_id, a.email, a.password_hash, a.role, a.is_active, a.employee_id,
             e.first_name, e.last_name, e.is_active as employee_active
      FROM accounts a
      INNER JOIN employees e ON a.employee_id = e.employee_id
      WHERE a.email = $1
    `;
    const accountResult = await pool.query(accountQuery, [email]);
    const accountData = accountResult.rows[0];

    // Dacă e-mailul nu există în baza de date
    if (!accountData) {
      return res.status(401).json({ success: false, message: "E-mailul sau parola este incorectă." });
    }

    // Verificăm dacă contul sau angajatul au fost dezactivați din panoul de administrare
    if (!accountData.is_active || !accountData.employee_active) {
      return res.status(403).json({ success: false, message: "Acest cont sau accesul angajatului a fost dezactivat." });
    }

    // Pasul B: Verificarea Criptografică a parolei folosind BCrypt
    // Comparam parola introdusă în text clar cu hash-ul din baza de date ($2b$10$...)
    const isPasswordCorrect = await bcrypt.compare(password, accountData.password_hash);

    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: "E-mailul sau parola este incorectă." });
    }

    // Extragem ID-ul real al angajatului identificat cu succes
    const realEmployeeId = accountData.employee_id;

    // Pasul C: GARANTAREA UNICITĂȚII SESIUNII (Mecanism anti-clonare)
    // Ștergem instant orice sesiune veche a acestui angajat sau orice alt telefon înregistrat cu acest ID hardware
    await pool.query(`
      DELETE FROM smartphones 
      WHERE employee_id = $1 OR device_identifier = $2
    `, [realEmployeeId, deviceIdentifier]);

    // Pasul D: Generarea criptografică a noului access_seed opac (64 caractere)
    const noulSeedSesiune = crypto.randomBytes(32).toString("hex").toUpperCase();

    // Pasul E: Salvarea noii sesiuni fizice unice în baza de date pe Render
    const insertQuery = `
      INSERT INTO smartphones (employee_id, platform, device_identifier, access_seed, is_trusted)
      VALUES ($1, $2, $3, $4, true)
      RETURNING access_seed
    `;
    await pool.query(insertQuery, [realEmployeeId, platform || 'iOS', deviceIdentifier, noulSeedSesiune]);

    console.log(`[🎯 SESSION GENERATED] ${accountData.first_name} ${accountData.last_name} s-a autentificat. Seed generat.`);

    // Returnăm răspunsul de succes și seed-ul către telefon
    return res.json({
      success: true,
      message: "Autentificare reușită și sesiune unică activată.",
      accessSeed: noulSeedSesiune,
      user: {
        name: `${accountData.first_name} ${accountData.last_name}`,
        role: accountData.role
      }
    });

  } catch (err) {
    console.error("❌ Eroare critică la login mobile:", err.message);
    res.status(500).json({ success: false, message: "Eroare internă de server la procesarea bazei de date." });
  }
});


// =========================================================================
// 2. ENDPOINT VALIDARE ACCES: VERIFICAREA SEED-ULUI PENTRU DESCHIDEREA PORȚII
// =========================================================================
app.post("/api/validate-access", async (req, res) => {
  try {
    const { accessSeed } = req.body;

    if (!accessSeed) {
      return res.status(400).json({ authorized: false, message: "Lipsește jetonul de sesiune (accessSeed)." });
    }

    // Interogăm baza de date pentru a vedea dacă acest seed unic corespunde unei sesiuni active și valide
    const deviceQuery = `
      SELECT s.smartphone_id, s.device_identifier, s.is_trusted, 
             e.employee_id, e.first_name, e.last_name, e.is_active
      FROM smartphones s
      INNER JOIN employees e ON e.employee_id = s.employee_id
      WHERE s.access_seed = $1
    `;
    const deviceResult = await pool.query(deviceQuery, [accessSeed]);
    const deviceData = deviceResult.rows[0];

    // Dacă seed-ul a fost revocat, înlocuit prin alt login sau nu există
    if (!deviceData) {
      return res.status(403).json({ authorized: false, message: "Sesiune invalidă sau expirată! Reautentificați-vă." });
    }

    if (!deviceData.is_trusted) {
      return res.status(403).json({ authorized: false, message: "Dispozitivul a fost marcat ca nesigur de către administrator." });
    }

    if (!deviceData.is_active) {
      return res.status(403).json({ authorized: false, message: "Accesul fizic pentru acest angajat este suspendat." });
    }

    console.log(`[🔓 ACCES PERMIS] Poarta principală deblocată pentru: ${deviceData.first_name} ${deviceData.last_name}`);

    // Salvăm evenimentul în tabela oficială de audit (access_events) pentru rapoarte
    await pool.query(`
      INSERT INTO access_events (employee_id, smartphone_id, event_type, event_status, gate_code, source, notes)
      VALUES ($1, $2, 'ENTRY', 'ALLOWED', 'GATE_MAIN', 'MOBILE_APP', 'Acces validat prin sesiune unică criptografică')
    `, [deviceData.employee_id, deviceData.smartphone_id]);

    // Deschidem poarta în simulatorul local (dacă există logica cu setTimeout)
    if (typeof setGateTemporarilyOpen === "function") {
      setGateTemporarilyOpen();
    }
    
    return res.json({ 
      authorized: true, 
      name: `${deviceData.first_name} ${deviceData.last_name}` 
    });

  } catch (err) {
    console.error("❌ Eroare la validarea accesului:", err.message);
    res.status(500).json({ authorized: false, message: "Eroare la verificarea drepturilor de acces." });
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
    




app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend ParkSecured sincronizat cu Git pe portul ${PORT}`);
});

