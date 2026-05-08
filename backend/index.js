const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json());

// --- MOCK DATA ---
const employees = [
  { id: 1, name: "Mara Ionescu", role: "Inginer software", department: "IT", accessCode: "PKS-83D1-7A20", carPlate: "B 104 MRA", status: "Activ" },
  { id: 2, name: "Victor Stan", role: "Manager departament", department: "Operatiuni", accessCode: "1234", carPlate: "CJ 21 VST", status: "Activ" },
  { id: 3, name: "Elena Radu", role: "Analist financiar", department: "Financiar", accessCode: "PKS-55AC-910E", carPlate: "-", status: "Activ" },
  { id: 4, name: "Teodora Otelariu", role: "Operator test", department: "Securitate", accessCode: "2026", carPlate: "-", status: "Activ" }
];

let accessLogs = [
  { id: 101, employeeName: "Mara Ionescu", department: "IT", timestamp: new Date().toISOString(), direction: "IN", status: "Valid", method: "ESP32" }
];

const gateStatus = {
  state: "Inchisa",
  activeLed: "Galben",
  esp32: "Conectat",
  lastSync: new Date().toISOString()
};

// --- HELPER FUNCTIONS ---
const updateGate = (state, led) => {
  gateStatus.state = state;
  gateStatus.activeLed = led;
  gateStatus.lastSync = new Date().toISOString();
};

function setGateTemporarilyOpen() {
  updateGate("Deschisa", "Verde");
  setTimeout(() => updateGate("Inchisa", "Galben"), 5000);
}

// --- ROUTES ---

// Verificare status server
app.get("/api/status", (req, res) => {
  res.json({ status: "online", mode: "mock", timestamp: new Date().toISOString() });
});

// Status Poartă
app.get("/api/gate/status", (req, res) => res.json(gateStatus));

// Angajați
app.get("/api/employees", (req, res) => res.json(employees));

app.post("/api/employees", (req, res) => {
  const newEmployee = { 
    id: Date.now(), 
    status: "Activ", 
    accessCode: `PKS-${String(Date.now()).slice(-4)}`,
    ...req.body 
  };
  employees.unshift(newEmployee);
  res.status(201).json(newEmployee);
});

// Log-uri acces
app.get("/api/access-logs", (req, res) => {
  const sorted = [...accessLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(sorted);
});

// --- LOGICA DE VALIDARE (Principala pentru ESP32) ---
app.post("/api/validate-access", (req, res) => {
  const { accessCode, direction = "IN", method = "ESP32" } = req.body;
  
  const employee = employees.find(e => e.accessCode === accessCode && e.status === "Activ");

  const newLog = {
    id: Date.now(),
    employeeId: employee?.id || null,
    employeeName: employee?.name || "Necunoscut",
    department: employee?.department || "N/A",
    timestamp: new Date().toISOString(),
    direction,
    status: employee ? "Valid" : "Refuzat",
    method,
    carPlate: employee?.carPlate || "-",
    note: employee ? "Acces permis" : "Cod invalid"
  };

  accessLogs.unshift(newLog);

  if (!employee) {
    updateGate("Inchisa", "Rosu");
    return res.status(403).json({ authorized: false, message: "Acces Interzis", log: newLog });
  }

  setGateTemporarilyOpen();
  console.log(`[ACCES] ${employee.name} a intrat.`);
  
  res.json({ 
    authorized: true, 
    name: employee.name, 
    action: "OPEN_GATE", 
    gateStatus 
  });
});

// Pornire Server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 ParkSecured Backend activ pe portul ${PORT}`);
});