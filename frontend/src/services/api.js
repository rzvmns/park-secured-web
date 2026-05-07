const wait = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));

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
    accessCode: "PKS-19B7-45FC",
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
    name: "Rares Matei",
    role: "Tehnician",
    department: "Mentenanta",
    photoUrl: "",
    accessCode: "PKS-31EA-6D89",
    schedule: "06:00 - 14:00",
    phone: "Asociat",
    carPlate: "B 88 RMT",
    autoAccess: true,
    status: "Inactiv",
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
  {
    id: 104,
    employeeId: 1,
    employeeName: "Mara Ionescu",
    department: "IT",
    timestamp: "2026-05-07T12:06:00",
    direction: "OUT",
    status: "Valid",
    method: "ESP32",
    carPlate: "B 104 MRA",
    note: "Iesire pauza",
  },
  {
    id: 105,
    employeeId: 2,
    employeeName: "Victor Stan",
    department: "Operatiuni",
    timestamp: "2026-05-07T12:25:00",
    direction: "OUT",
    status: "Manual",
    method: "Portar",
    carPlate: "CJ 21 VST",
    note: "Validare manuala portar",
  },
];

const gateStatus = {
  state: "Inchisa",
  barrier: "Libera",
  esp32: "Conectat",
  cloud: "Sincronizat",
  lastSync: "2026-05-07T12:30:00",
  activeLed: "Galben",
};

export async function getEmployees() {
  await wait();
  return [...employees];
}

export async function saveEmployee(employee) {
  await wait();
  if (employee.id) {
    return { ...employee };
  }
  return { ...employee, id: Date.now(), status: "Activ" };
}

export async function getAccessLogs() {
  await wait();
  return [...accessLogs].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
  );
}

export async function getGateStatus() {
  await wait(120);
  return { ...gateStatus };
}

export async function getReports() {
  await wait();
  return {
    totals: {
      employees: employees.length,
      present: 2,
      denied: 1,
      manual: 1,
    },
    byDepartment: [
      { department: "IT", entries: 2, denied: 0 },
      { department: "Operatiuni", entries: 2, denied: 0 },
      { department: "Financiar", entries: 1, denied: 1 },
      { department: "Mentenanta", entries: 0, denied: 0 },
    ],
    monthly: [
      { label: "Ian", value: 84 },
      { label: "Feb", value: 91 },
      { label: "Mar", value: 88 },
      { label: "Apr", value: 96 },
      { label: "Mai", value: 72 },
    ],
  };
}
