const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const employees = [
  {
    id: 1,
    name: "Mara Ionescu",
    role: "Inginer software",
    department: "IT",
    photoUrl: "",
    accessCode: "PKS-83D1-7A20",
    schedule: "08:00 - 18:00",
    phone: "Asociat",
    carPlate: "B 104 MRA",
    autoAccess: true,
    status: "Activ",
    grantedBy: "Admin Securitate",
  },
  {
    id: 2,
    name: "Victor Stan",
    role: "Manager departament",
    department: "Operatiuni",
    photoUrl: "",
    accessCode: "1234",
    schedule: "07:00 - 17:00",
    phone: "Asociat",
    carPlate: "CJ 21 VST",
    autoAccess: true,
    status: "Activ",
    grantedBy: "Admin Securitate",
  },
  {
    id: 3,
    name: "Elena Radu",
    role: "Analist financiar",
    department: "Financiar",
    photoUrl: "",
    accessCode: "PKS-55AC-910E",
    schedule: "09:00 - 17:00",
    phone: "Neasociat",
    carPlate: "-",
    autoAccess: false,
    status: "Activ",
    grantedBy: "Manager Financiar",
  },
  {
    id: 4,
    name: "Teodora Otelariu",
    role: "Operator test",
    department: "Securitate",
    photoUrl: "",
    accessCode: "2026",
    schedule: "08:00 - 16:00",
    phone: "Asociat",
    carPlate: "-",
    autoAccess: false,
    status: "Activ",
    grantedBy: "Admin Securitate",
  },
];

const accessLogs = [
  {
    id: 101,
    employeeId: 1,
    employeeName: "Mara Ionescu",
    department: "IT",
    timestamp: "2026-05-07T08:12:00",
    direction: "IN",
    status: "Valid",
    method: "ESP32",
    carPlate: "B 104 MRA",
    note: "Acces in interval permis",
  },
  {
    id: 102,
    employeeId: 2,
    employeeName: "Victor Stan",
    department: "Operatiuni",
    timestamp: "2026-05-07T08:18:00",
    direction: "IN",
    status: "Valid",
    method: "ESP32",
    carPlate: "CJ 21 VST",
    note: "Poarta deschisa automat",
  },
  {
    id: 103,
    employeeId: 3,
    employeeName: "Elena Radu",
    department: "Financiar",
    timestamp: "2026-05-07T07:41:00",
    direction: "IN",
    status: "Refuzat",
    method: "Bluetooth",
    carPlate: "-",
    note: "In afara intervalului permis",
  },
];

const gateStatus = {
  state: "Inchisa",
  barrier: "Libera",
  esp32: "Conectat",
  cloud: "Mock API activ",
  lastSync: new Date().toISOString(),
  activeLed: "Galben",
};

function sortLogs() {
  return [...accessLogs].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
  );
}

function buildReports() {
  const validLogs = accessLogs.filter((log) => log.status === "Valid");
  const deniedLogs = accessLogs.filter((log) => log.status === "Refuzat");
  const manualLogs = accessLogs.filter((log) => log.status === "Manual");
  const presentEmployeeIds = new Set(validLogs.map((log) => log.employeeId));
  const departments = employees.reduce((acc, employee) => {
    if (!acc[employee.department]) {
      acc[employee.department] = { department: employee.department, entries: 0, denied: 0 };
    }
    return acc;
  }, {});

  accessLogs.forEach((log) => {
    if (!departments[log.department]) {
      departments[log.department] = { department: log.department, entries: 0, denied: 0 };
    }
    departments[log.department].entries += 1;
    if (log.status === "Refuzat") {
      departments[log.department].denied += 1;
    }
  });

  return {
    totals: {
      employees: employees.length,
      present: presentEmployeeIds.size,
      denied: deniedLogs.length,
      manual: manualLogs.length,
    },
    byDepartment: Object.values(departments),
    monthly: [
      { label: "Ian", value: 84 },
      { label: "Feb", value: 91 },
      { label: "Mar", value: 88 },
      { label: "Apr", value: 96 },
      { label: "Mai", value: Math.max(60, Math.min(100, 70 + validLogs.length * 3)) },
    ],
  };
}

function setGateTemporarilyOpen() {
  gateStatus.state = "Deschisa";
  gateStatus.activeLed = "Verde";
  gateStatus.lastSync = new Date().toISOString();

  setTimeout(() => {
    gateStatus.state = "Inchisa";
    gateStatus.activeLed = "Galben";
    gateStatus.lastSync = new Date().toISOString();
  }, 5000);
}

app.get("/api/status", (req, res) => {
  res.json({
    message: "Serverul mock ParkSecured functioneaza corect.",
    mode: "mock",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/gate/status", (req, res) => {
  res.json(gateStatus);
});

app.get("/api/employees", (req, res) => {
  res.json(employees);
});

app.post("/api/employees", (req, res) => {
  const employee = {
    id: Date.now(),
    status: "Activ",
    accessCode: `PKS-${String(Date.now()).slice(-4)}`,
    ...req.body,
  };
  employees.unshift(employee);
  res.status(201).json(employee);
});

app.put("/api/employees/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = employees.findIndex((employee) => employee.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Angajatul nu a fost gasit." });
  }

  employees[index] = { ...employees[index], ...req.body, id };
  res.json(employees[index]);
});

app.patch("/api/employees/:id/deactivate", (req, res) => {
  const id = Number(req.params.id);
  const employee = employees.find((item) => item.id === id);

  if (!employee) {
    return res.status(404).json({ message: "Angajatul nu a fost gasit." });
  }

  employee.status = "Inactiv";
  res.json(employee);
});

app.get("/api/access-logs", (req, res) => {
  res.json(sortLogs());
});

app.get("/api/reports/attendance", (req, res) => {
  res.json(buildReports());
});

app.post("/api/validate-access", (req, res) => {
  const { accessCode, direction = "IN", method = "Portar" } = req.body;
  const employee = employees.find(
    (item) => item.accessCode === accessCode && item.status === "Activ",
  );

  const log = {
    id: Date.now(),
    employeeId: employee?.id || null,
    employeeName: employee?.name || "Necunoscut",
    department: employee?.department || "N/A",
    timestamp: new Date().toISOString(),
    direction,
    status: employee ? "Valid" : "Refuzat",
    method,
    carPlate: employee?.carPlate || "-",
    note: employee ? "Acces permis prin mock backend" : "Cod invalid sau angajat inactiv",
  };

  accessLogs.unshift(log);

  if (!employee) {
    gateStatus.activeLed = "Rosu";
    gateStatus.lastSync = new Date().toISOString();
    return res.status(403).json({
      authorized: false,
      message: "Cod invalid sau expirat",
      log,
      gateStatus,
    });
  }

  setGateTemporarilyOpen();
  console.log(`[ACCES PERMIS] ${employee.name} - ${new Date().toLocaleTimeString()}`);

  return res.json({
    authorized: true,
    name: employee.name,
    action: "OPEN_GATE",
    employee,
    log,
    gateStatus,
  });
});

app.listen(PORT, () => {
  console.log(`ParkSecured mock backend pornit pe portul ${PORT}`);
});
