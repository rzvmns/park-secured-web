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
const bcrypt = require("bcrypt");

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
// 1. ENDPOINT UNIFICAT: AUTENTIFICARE SECURIZATĂ (STRICT 1 CONT = 1 HARDWARE)
// =========================================================================
app.post("/api/mobile/login-secure", async (req, res) => {
  try {
    const { email, password, platform, deviceIdentifier } = req.body;

    if (!email || !password || !deviceIdentifier) {
      return res.status(400).json({ 
        success: false, 
        message: "Toate câmpurile sunt obligatorii!" 
      });
    }

    console.log(`[🔐 LOGIN INTENT] Încercare de autentificare pentru: ${email}`);

    const accountQuery = `
      SELECT a.account_id, a.email, a.password_hash, a.role, a.is_active, a.employee_id,
            e.first_name, e.last_name, e.is_active as employee_active,
            e.access_start_time, e.access_end_time
      FROM accounts a
      INNER JOIN employees e ON a.employee_id = e.employee_id
      WHERE a.email = $1
    `;
    const accountResult = await pool.query(accountQuery, [email]);
    const accountData = accountResult.rows[0];

    if (!accountData) {
      return res.status(401).json({ success: false, message: "E-mailul sau parola este incorectă." });
    }

    if (!accountData.is_active || !accountData.employee_active) {
      return res.status(403).json({ success: false, message: "Acest cont sau accesul angajatului a fost dezactivat." });
    }

    const isPasswordCorrect = await bcrypt.compare(password, accountData.password_hash);
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: "E-mailul sau parola este incorectă." });
    }

    const realEmployeeId = accountData.employee_id;

    const noulSeedSesiune = crypto.randomBytes(32).toString("hex").toUpperCase();

    await pool.query(
      `DELETE FROM smartphones WHERE employee_id = $1 OR device_identifier = $2`,
      [realEmployeeId, deviceIdentifier]
    );

    await pool.query(
      `INSERT INTO smartphones (employee_id, platform, device_identifier, access_seed, is_trusted)
       VALUES ($1, $2, $3, $4, true)`,
      [realEmployeeId, platform || 'iOS', deviceIdentifier, noulSeedSesiune]
    );

    console.log(`[📱 LOGIN] Dispozitiv asociat pentru: ${accountData.first_name} ${accountData.last_name}`);

    return res.json({
      success: true,
      message: "Autentificare reușită.",
      accessSeed: noulSeedSesiune,
      user: {
        name: `${accountData.first_name} ${accountData.last_name}`,
        role: accountData.role,
        accessStartTime: accountData.access_start_time, 
        accessEndTime: accountData.access_end_time, 
      }
    });

  } catch (err) {
    console.error("❌ Eroare critică la login mobile:", err.message);
    res.status(500).json({ success: false, message: "Eroare internă de server la procesarea bazei de date." });
  }
});

// =========================================================================
// 2. ENDPOINT VALIDARE ACCES MODIFICAT (COPIAZĂ PESTE CEL VECHI DIN BACKEND)
// =========================================================================
app.post("/api/validate-access", async (req, res) => {
  try {
    const { accessSeed, direction } = req.body; // 🎯 Preluăm direcția: ENTRY sau EXIT

    if (!accessSeed) {
      return res.status(400).json({ authorized: false, message: "Lipsește jetonul de sesiune (accessSeed)." });
    }

    // Stabilim tipul de eveniment implicit dacă mobilul nu trimite nimic din greșeală
    const tipEvenimentFinal = direction === 'EXIT' ? 'EXIT' : 'ENTRY';

    const deviceQuery = `
      SELECT s.smartphone_id, s.device_identifier, s.is_trusted,
             e.employee_id, e.first_name, e.last_name, e.is_active,
             e.access_start_time, e.access_end_time
      FROM smartphones s
      INNER JOIN employees e ON e.employee_id = s.employee_id
      WHERE s.access_seed = $1
    `;
    const deviceResult = await pool.query(deviceQuery, [accessSeed]);
    const deviceData = deviceResult.rows[0];

    if (!deviceData) {
      return res.status(403).json({ authorized: false, message: "Sesiune invalidă sau expirată! Reautentificați-vă." });
    }

    if (!deviceData.is_trusted) {
      return res.status(403).json({ authorized: false, message: "Dispozitivul a fost marcat ca nesigur." });
    }

    if (!deviceData.is_active) {
      return res.status(403).json({ authorized: false, message: "Accesul fizic pentru acest angajat este suspendat." });
    }
    console.log("access_start_time:", deviceData.access_start_time);
    console.log("access_end_time:", deviceData.access_end_time);
    console.log("server time now:", new Date().toISOString());
    console.log("isInTimeWindow:", isInTimeWindow);
    // Verificare interval orar
    const isInTimeWindow = (() => {
      const { access_start_time: start, access_end_time: end } = deviceData;
      if (!start || !end) return true;
      const now = new Date();
      const cur = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const toSec = (t) => { const [h, m, s = 0] = String(t).split(':').map(Number); return h * 3600 + m * 60 + s; };
      const s = toSec(start), e = toSec(end);
      return s <= e ? cur >= s && cur <= e : cur >= s || cur <= e;
    })();

    if (!isInTimeWindow) {
      const { access_start_time: start, access_end_time: end } = deviceData;
      const note = `Access outside allowed interval (${start} - ${end})`;
      const insertResult = await pool.query(`
        INSERT INTO access_events (employee_id, smartphone_id, event_type, event_status, gate_code, source, notes)
        VALUES ($1, $2, $3, 'PENDING', 'GATE_MAIN', 'MOBILE_APP', $4)
        RETURNING event_id
      `, [deviceData.employee_id, deviceData.smartphone_id, tipEvenimentFinal, note]);

      console.log(`[⏳ PENDING] ${deviceData.first_name} ${deviceData.last_name} - în afara orarului (${start} - ${end})`);

      return res.json({
        authorized: false,
        status: 'PENDING',
        eventId: insertResult.rows[0].event_id,
        message: `Intrare în afara orarului permis (${String(start).slice(0,5)} - ${String(end).slice(0,5)}). Aștept răspunsul portarului.`
      });
    }

    const mesajNote = tipEvenimentFinal === 'ENTRY' ? 'Acces validat prin sesiune unică' : 'Părăsire incintă confirmată';

    console.log(`[🔓 ACCES ACTIONAT - ${tipEvenimentFinal}] Poarta deschisă pentru: ${deviceData.first_name} ${deviceData.last_name}`);

    await pool.query(`
      INSERT INTO access_events (employee_id, smartphone_id, event_type, event_status, gate_code, source, notes)
      VALUES ($1, $2, $3, 'ALLOWED', 'GATE_MAIN', 'MOBILE_APP', $4)
    `, [deviceData.employee_id, deviceData.smartphone_id, tipEvenimentFinal, mesajNote]);

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
// --- RUTĂ PENTRU EXPORT CSV ---
app.get("/api/export-csv", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM access_events");

    if (result.rows.length === 0) {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=raport_gol.csv");
      return res.status(200).send("Baza de date nu contine niciun eveniment de acces in acest moment.");
    }

    const columnNames = Object.keys(result.rows[0]);
    let csvContent = columnNames.join(",") + "\n";

    result.rows.forEach(row => {
      const rowValues = columnNames.map(colName => {
        let value = row[colName];
        if (value === null || value === undefined) return "";
        
        if (value instanceof Date || (typeof value === "string" && value.includes("T") && !isNaN(Date.parse(value)))) {
          try {
            return new Date(value).toISOString().replace("T", " ").substring(0, 19);
          } catch (e) {
            return String(value);
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

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=raport_accesari_parksecured.csv");
    return res.status(200).send(csvContent);

  } catch (err) {
    console.error("Eroare la generare CSV:", err);
    res.status(500).json({ error: "Nu s-a putut genera raportul CSV.", detalii_tehnice: err.message });
  }
});

// =========================================================================
// 🎛️ ENDPOINT-URI EXCLUSIVE PENTRU MODULUL HARDWARE ESP32
// =========================================================================

// 1. ESP32 cere starea barierii și verifică dacă s-a aprobat o deschidere de la poartă / mobil
app.get("/api/hardware/gate-status", (req, res) => {
  // Sincronizăm starea cu memoria backend-ului
  return res.json({
    state: gateStatus.state,         // "Inchisa", "Deschisa", "In curs de deschidere", etc.
    activeLed: gateStatus.activeLed, // "Galben", "Verde", "Rosu", "Albastru"
    commandOpen: gateStatus.state === "Deschisa" // Flag simplu de tip true/false pentru motor
  });
});

// 2. ESP32 anunță serverul când starea fizică s-a schimbat (Senzori / Limitatori cursă / Bariere IR)
app.post("/api/hardware/update-status", async (req, res) => {
  try {
    const { hardwareState, hardwareLed, eventType, employeeId } = req.body;

    // Actualizăm starea globală a porții (pe care interfața Portarului o citește live)
    updateGate(hardwareState, hardwareLed);
    console.log(`[🎛️ ESP32 SYNC] Starea porții a devenit: ${hardwareState} (LED: ${hardwareLed})`);

    // Dacă mașina a trecut complet și s-a generat un eveniment fizic de trecere
    if (eventType && employeeId) {
      await pool.query(`
        INSERT INTO access_events (employee_id, event_type, event_status, gate_code, source, notes)
        VALUES ($1, $2, 'ALLOWED', 'GATE_MAIN', 'ESP32_HARDWARE', 'Trecere completă detectată de barierele de lumină IR')
      `, [employeeId, eventType]);
      console.log(`[💾 BD AUDIT] Eveniment ${eventType} salvat automat de la distanță via ESP32.`);
    }

    return res.json({ success: true, message: "Backend sincronizat cu succes cu hardware-ul fizic." });
  } catch (err) {
    console.error("❌ Eroare la sincronizarea hardware:", err.message);
    res.status(500).json({ success: false, message: "Eroare internă de comunicație." });
  }
});
    
// =========================================================================
// 🏢 ENDPOINT HR: ȘTERGERE DISPOZITIV ASOCIAT
// =========================================================================
app.delete("/api/admin/reset-device/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    console.log(`[🏢 HR ACTION] Cerere de resetare dispozitiv pentru employee_id: ${employeeId}`);

    const deleteResult = await pool.query(`DELETE FROM smartphones WHERE employee_id = $1`, [employeeId]);

    if (deleteResult.rowCount === 0) {
      return res.status(444).json({ success: false, message: "Angajatul nu avea niciun dispozitiv asociat." });
    }

    return res.json({ success: true, message: "Dispozitivul vechi a fost eliminat cu succes." });

  } catch (err) {
    console.error("❌ Eroare la resetarea HR a dispozitivului:", err.message);
    res.status(500).json({ success: false, message: "Eroare de server la eliminarea dispozitivului." });
  }
});



// =========================================================================
// CERERI SCHIMBARE DISPOZITIV - PENTRU HR
// =========================================================================
app.get("/api/device-change-requests", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.request_id, r.status, r.requested_at,
             r.old_device_identifier, r.new_device_identifier, r.new_platform,
             e.first_name, e.last_name, e.badge_code
      FROM device_change_requests r
      INNER JOIN employees e ON e.employee_id = r.employee_id
      WHERE r.status = 'pending'
      ORDER BY r.requested_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch("/api/device-change-requests/:id/resolve", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.query(`
      UPDATE device_change_requests
      SET status = $1, resolved_at = NOW()
      WHERE request_id = $2
    `, [status, id]);
    res.json({ success: true, message: `Cerere ${status}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend ParkSecured sincronizat cu Git pe portul ${PORT}`);
});