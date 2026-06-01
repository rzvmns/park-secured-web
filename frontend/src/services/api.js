const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://park-secured-cloud-r62j.onrender.com/api";
const TOKEN_KEY = "parksecured_token";
const USER_KEY = "parksecured_user";

const wait = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

const fallbackEmployees = [
  {
    id: 1,
    employeeId: 1,
    name: "Mara Ionescu",
    firstName: "Mara",
    lastName: "Ionescu",
    cnp: "1990101123456",
    role: "Angajat",
    department: "IT",
    divisionId: 1,
    accessCode: "PKS-83D1-7A20",
    schedule: "08:00 - 18:00",
    phone: "Neasociat",
    carPlate: "B 104 MRA",
    autoAccess: true,
    status: "Activ",
    grantedBy: "Admin Securitate",
  },
];

let fallbackAccessLogs = [
  {
    id: 101,
    employeeId: 1,
    employeeName: "Mara Ionescu",
    department: "IT",
    timestamp: new Date().toISOString(),
    direction: "IN",
    status: "Valid",
    method: "ESP32",
    carPlate: "B 104 MRA",
    note: "Acces demonstrativ local",
  },
];

const fallbackGateStatus = {
  state: "Inchisa",
  barrier: "Libera",
  esp32: "Conectat",
  cloud: "Offline",
  lastSync: new Date().toISOString(),
  activeLed: "Galben",
};

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const storedUser = localStorage.getItem(USER_KEY);

  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
}

export function setSession({ token, user }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function request(path, options = {}) {
  const token = getStoredToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error(
      `Nu se poate contacta API-ul cloud (${API_BASE_URL}). Verifica VITE_API_BASE_URL si conexiunea.`,
    );
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(payload?.message || `API request failed: ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload?.data ?? payload;
}

function splitName(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() || "Angajat";
  const lastName = parts.join(" ") || "ParkSecured";

  return { firstName, lastName };
}

function normalizeTime(value) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

function buildSchedule(start, end) {
  if (!start && !end) return "Nespecificat";
  return `${normalizeTime(start) || "--:--"} - ${normalizeTime(end) || "--:--"}`;
}

function parseSchedule(schedule = "") {
  const [start, end] = schedule.split("-").map((item) => item?.trim());

  return {
    accessStartTime: start || null,
    accessEndTime: end || null,
  };
}

function generatedCnp(employee) {
  return employee.cnp || `TMP${employee.id || Date.now()}`;
}

function mapCloudUser(user) {
  return {
    id: user.userId || user.accountId,
    email: user.email,
    name: user.email?.split("@")[0] || "Utilizator ParkSecured",
    role: user.role,
    divisionId: user.divisionId ? Number(user.divisionId) : null,
    employeeId: user.employeeId || null,
    department: user.divisionId ? `Divizia ${user.divisionId}` : "Global",
    mustChangePassword: user.mustChangePassword ?? false,
  };
}

function mapCloudEmployee(employee) {
  const name = `${employee.firstName || ""} ${employee.lastName || ""}`.trim();
  const hasCar = Boolean(employee.carNumber);

  return {
    id: employee.employeeId,
    employeeId: employee.employeeId,
    firstName: employee.firstName,
    lastName: employee.lastName,
    name: name || `Angajat #${employee.employeeId}`,
    cnp: employee.cnp,
    role: employee.badgeCode || "Angajat",
    department: employee.divisionName || `Divizia ${employee.divisionId}`,
    divisionId: employee.divisionId,
    photoUrl: employee.photoUrl || "",
    accessCode: employee.bluetoothCode || employee.badgeCode || "",
    badgeCode: employee.badgeCode || "",
    bluetoothCode: employee.bluetoothCode || "",
    schedule: buildSchedule(employee.accessStartTime, employee.accessEndTime),
    phone: "Neasociat",
    carPlate: employee.carNumber || "-",
    autoAccess: hasCar,
    status: employee.isActive ? "Activ" : "Inactiv",
    isActive: employee.isActive,
    grantedBy: employee.grantedByUserId ? `Utilizator ${employee.grantedByUserId}` : "Cloud",
  };
}

function toCloudEmployeePayload(employee) {
  const { firstName, lastName } = splitName(employee.name);
  const schedule = parseSchedule(employee.schedule);

  return {
    firstName: employee.firstName || firstName,
    lastName: employee.lastName || lastName,
    cnp: generatedCnp(employee),
    photoUrl: employee.photoUrl || null,
    badgeCode: employee.badgeCode || employee.accessCode || null,
    divisionId: Number(employee.divisionId || 1),
    bluetoothCode: employee.bluetoothCode || employee.accessCode || null,
    carNumber: employee.autoAccess ? employee.carPlate || null : null,
    accessStartTime: schedule.accessStartTime,
    accessEndTime: schedule.accessEndTime,
    isActive: employee.status ? employee.status === "Activ" : employee.isActive !== false,
  };
}

function mapCloudEvent(event, employees = []) {
  const employee = employees.find((item) => item.employeeId === event.employeeId);

  return {
    id: event.eventId,
    employeeId: event.employeeId,
    employeeName: employee?.name || `Angajat #${event.employeeId}`,
    department: employee?.department || "N/A",
    photoUrl: employee?.photoUrl || "",
    timestamp: event.eventTime,
    direction: event.eventType === "EXIT" ? "OUT" : "IN",
    status: event.eventStatus === "DENIED" ? "Refuzat" : event.eventStatus === "PENDING" ? "Pending" : "Valid",
    method: event.source || "Cloud",
    carPlate: employee?.carPlate || "-",
    note: event.notes || event.gateCode || "-",
  };
}

function eventTypeFromDirection(direction) {
  return direction === "OUT" ? "EXIT" : "ENTRY";
}

function createLocalLog({ employee, authorized, direction = "IN", method = "Portar", note }) {
  const log = {
    id: Date.now(),
    employeeId: employee?.employeeId || employee?.id || null,
    employeeName: employee?.name || "Necunoscut",
    department: employee?.department || "N/A",
    photoUrl: employee?.photoUrl || "",
    timestamp: new Date().toISOString(),
    direction,
    status: authorized ? "Valid" : "Refuzat",
    method,
    carPlate: employee?.carPlate || "-",
    note: note || (authorized ? "Acces permis" : "Cod invalid sau angajat inactiv"),
  };

  fallbackAccessLogs = [log, ...fallbackAccessLogs];
  return log;
}

export async function loginRequest({ email, password }) {
  const result = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const session = {
    token: result.token,
    user: mapCloudUser(result.user),
  };

  setSession(session);
  return session;
}

export async function changePassword({ currentPassword, newPassword }) {
  return request("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function getEmployees() {
  try {
    const employees = await request("/employees");
    return employees.map(mapCloudEmployee);
  } catch (error) {
    await wait();
    return [...fallbackEmployees];
  }
}

export async function saveEmployee(employee) {
  try {
    const payload = toCloudEmployeePayload(employee);
    const saved = employee.employeeId || employee.id
      ? await request(`/employees/${employee.employeeId || employee.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
      : await request("/employees", {
          method: "POST",
          body: JSON.stringify(payload),
        });

    return mapCloudEmployee(saved);
  } catch (error) {
    await wait();
    return employee.id
      ? { ...employee }
      : { ...employee, id: Date.now(), employeeId: Date.now(), status: "Activ" };
  }
}

export async function getAccessLogs() {
  try {
    const [employees, events] = await Promise.all([
      getEmployees(),
      request("/access-events"),
    ]);

    return events.map((event) => mapCloudEvent(event, employees));
  } catch (error) {
    await wait();
    return [...fallbackAccessLogs].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
    );
  }
}

export async function getGateStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/hardware/gate-status`);
    const result = await response.json();
    return {
      state: result.state || "Inchisa",
      activeLed: result.activeLed || "Galben",
      barrier: "Liberă",
      esp32: "Conectat",
      cloud: "Sincronizat",
      lastSync: new Date().toISOString(),
    };
  } catch (error) {
    return {
      state: "Inchisa",
      activeLed: "Galben",
      barrier: "Liberă",
      esp32: "Deconectat",
      cloud: "Offline",
      lastSync: new Date().toISOString(),
    };
  }
}

export async function getReports() {
  try {
    const [employees, globalReport, divisions] = await Promise.all([
      getEmployees(),
      request("/reports/global"),
      request("/divisions").catch(() => []),
    ]);

    const divisionReports = await Promise.all(
      divisions.map((division) =>
        request(`/reports/division/${division.divisionId}`).catch(() => null),
      ),
    );

    return {
      totals: {
        employees: globalReport.total_employees ?? employees.length,
        present: globalReport.allowed_events ?? 0,
        denied: globalReport.denied_events ?? 0,
        manual: 0,
      },
      byDepartment: divisionReports
        .filter(Boolean)
        .map((item) => ({
          department: item.division_name,
          entries: item.allowed_events,
          denied: item.denied_events,
        })),
      monthly: [
        { label: "Ian", value: 0 },
        { label: "Feb", value: 0 },
        { label: "Mar", value: 0 },
        { label: "Apr", value: 0 },
        { label: "Mai", value: globalReport.total_events ?? 0 },
      ],
    };
  } catch (error) {
    await wait();
    return {
      totals: {
        employees: fallbackEmployees.length,
        present: fallbackAccessLogs.filter((log) => log.status === "Valid").length,
        denied: fallbackAccessLogs.filter((log) => log.status === "Refuzat").length,
        manual: fallbackAccessLogs.filter((log) => log.method === "Portar").length,
      },
      byDepartment: [{ department: "Local", entries: fallbackAccessLogs.length, denied: 0 }],
      monthly: [{ label: "Mai", value: fallbackAccessLogs.length }],
    };
  }
}

export async function validateAccess({
  accessCode = "",
  direction = "IN",
  method = "Portar",
} = {}) {
  const employees = await getEmployees();
  const employee = employees.find(
    (item) =>
      item.status === "Activ" &&
      [item.accessCode, item.bluetoothCode, item.badgeCode]
        .filter(Boolean)
        .includes(accessCode),
  );
  const authorized = Boolean(employee);

  try {
    let savedEvent = null;

    if (employee) {
      savedEvent = await request("/access-events", {
        method: "POST",
        body: JSON.stringify({
          employeeId: employee.employeeId,
          eventType: eventTypeFromDirection(direction),
          eventStatus: "ALLOWED",
          source: method,
          notes: "Validare initiata din aplicatia web",
        }),
      });
    }

    const log = savedEvent
      ? mapCloudEvent(savedEvent, employees)
      : createLocalLog({
          employee,
          authorized: false,
          direction,
          method,
          note: "Cod invalid sau angajat inactiv",
        });

    return {
      authorized,
      name: employee?.name,
      action: authorized ? "OPEN_GATE" : "DENY_ACCESS",
      employee,
      log,
      gateStatus: {
        ...fallbackGateStatus,
        state: authorized ? "Deschisa" : "Inchisa",
        activeLed: authorized ? "Verde" : "Rosu",
        cloud: "Sincronizat",
        lastSync: new Date().toISOString(),
      },
      message: authorized ? "Acces permis" : "Cod invalid sau angajat inactiv",
    };
  } catch (error) {
    const log = createLocalLog({ employee, authorized, direction, method });

    return {
      authorized,
      name: employee?.name,
      action: authorized ? "OPEN_GATE" : "DENY_ACCESS",
      employee,
      log,
      gateStatus: {
        ...fallbackGateStatus,
        state: authorized ? "Deschisa" : "Inchisa",
        activeLed: authorized ? "Verde" : "Rosu",
        lastSync: new Date().toISOString(),
      },
      message: authorized ? "Acces permis local" : "Cod invalid sau expirat",
    };
  }
}

export async function getDeviceChangeRequests() {
  try {
    return request("/device-change-requests");
  } catch {
    return [];
  }
}

export async function resolveDeviceChangeRequest(requestId, status) {
  return request(`/device-change-requests/${requestId}/resolve`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function getIndividualReport(employeeId) {
  const report = await request(`/reports/individual/${employeeId}`);
  return {
    employeeId: report.employeeId,
    totalEvents: report.totalEvents ?? 0,
    allowedEvents: report.allowedEvents ?? 0,
    deniedEvents: report.deniedEvents ?? 0,
    events: (report.events || []).map((event) => ({
      eventId: event.eventId,
      eventType: event.eventType,
      eventStatus: event.eventStatus,
      eventTime: event.eventTime,
      gateCode: event.gateCode,
      source: event.source,
      notes: event.notes,
    })),
  };
}

export async function resolveAccessEvent(eventId, resolution) {
  return request(`/access-events/${eventId}/resolve`, {
    method: "PATCH",
    body: JSON.stringify({ resolution }),
  });
}
