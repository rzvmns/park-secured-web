import { useEffect, useMemo, useState } from "react";import EmployeeTable from "../components/EmployeeTable.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getEmployees, saveEmployee, request, getIndividualReport } from "../services/api.js";

const emptyEmployee = {
  firstName: "",
  lastName: "",
  cnp: "",
  divisionId: 1,
  role: "",
  department: "",
  schedule: "08:00 - 17:00",
  phone: "Asociat",
  carPlate: "-",
  autoAccess: false,
  status: "Activ",
};

function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pass = "Ps@";
  for (let i = 0; i < 7; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)];
  }
  return pass;
}

function generateBluetoothCode() {
  const hex = () => Math.floor(Math.random() * 0x10000).toString(16).toUpperCase().padStart(4, "0");
  return `BT-${hex()}-${hex()}`;
}

function generateEmail(firstName, lastName, existingEmails = []) {
  const normalize = (s) =>
    (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");

  const base = `${normalize(firstName)}.${normalize(lastName)}`;
  const candidate = `${base}@parksecure.local`;

  if (!existingEmails.includes(candidate)) return candidate;

  let i = 2;
  while (existingEmails.includes(`${base}${i}@parksecure.local`)) i++;
  return `${base}${i}@parksecure.local`;
}

const AVAILABLE_ROLES = [
  { value: "operator", label: "Operator" },
  { value: "viewer", label: "Vizualizator" },
  { value: "division_manager", label: "Manager Divizie" },
  { value: "hr", label: "HR" },
];

function ModalAngajat({ editing, onClose, onSaved, userRole, userDivisionId }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [createdPassword, setCreatedPassword] = useState(null);
  const [emailPreview, setEmailPreview] = useState("");
  const [existingEmails, setExistingEmails] = useState([]);
  const [selectedAccountRole, setSelectedAccountRole] = useState("operator");
  const [btCode] = useState(() => isNew ? generateBluetoothCode() : (editing?.bluetoothCode || ""));
  const isNew = !editing?.employeeId && !editing?.id;

  const parseSchedule = (s) => {
    const m = (s || "").match(/^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/);
    return m ? [m[1], m[2]] : ["08:00", "17:00"];
  };
  const [schedStart, setSchedStart] = useState(() => parseSchedule(editing?.schedule)[0]);
  const [schedEnd, setSchedEnd] = useState(() => parseSchedule(editing?.schedule)[1]);

  useEffect(() => {
    if (!isNew) return;
    request("/users").then((users) => {
      setExistingEmails((users || []).map((u) => u.email).filter(Boolean));
    }).catch(() => {});
  }, [isNew]);

  const updateEmailPreview = (firstName, lastName) => {
    if (!firstName && !lastName) { setEmailPreview(""); return; }
    setEmailPreview(generateEmail(firstName, lastName, existingEmails));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const form = new FormData(e.currentTarget);
    const divisionIdFinal = userRole === "admin"
      ? Number(form.get("divisionId"))
      : userDivisionId;

    const employee = {
      ...editing,
      firstName: form.get("firstName"),
      lastName: form.get("lastName"),
      name: `${form.get("firstName")} ${form.get("lastName")}`.trim(),
      cnp: form.get("cnp"),
      divisionId: divisionIdFinal,
      badgeCode: form.get("badgeCode"),
      photoUrl: form.get("photoUrl") || editing.photoUrl || null,
      bluetoothCode: isNew ? btCode : (form.get("bluetoothCode") || editing.bluetoothCode || null),
      schedule: `${schedStart} - ${schedEnd}`,
      carPlate: form.get("carPlate") || "-",
      autoAccess: form.get("autoAccess") === "on",
      status: form.get("status"),
    };

    const emailCont = isNew ? emailPreview : null;

    try {
      const saved = await saveEmployee(employee);

      // Dacă e angajat nou și s-a completat emailul, crează și contul
      if (isNew && emailCont) {
        const tempPassword = generateTempPassword();
        try {
          await request("/users", {
            method: "POST",
            body: JSON.stringify({
              email: emailCont,
              password: tempPassword,
              role: selectedAccountRole,
              divisionId: divisionIdFinal,
              employeeId: saved.employeeId || saved.id,
              isActive: true,
            }),
          });
          setCreatedPassword(tempPassword);
          setSaving(false);
          onSaved(saved);
          return;
        } catch (err) {
          setError(`Angajat creat, dar contul nu a putut fi creat: ${err.message}`);
          setSaving(false);
          onSaved(saved);
          return;
        }
      }

      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err.message || "Eroare la salvare.");
    } finally {
      setSaving(false);
    }
  };

  // Dacă contul a fost creat, arată parola temporară
  if (createdPassword) {
    return (
      <div style={overlayStyle}>
        <div style={{ ...modalStyle, maxWidth: 420, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
              <circle cx="26" cy="26" r="24" fill="#0f8a5f" opacity="0.12" stroke="#0f8a5f" strokeWidth="2"/>
              <path d="M16 26.5l8 8 13-15" stroke="#0f8a5f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 style={{ margin: "0 0 8px", color: "#0f8a5f" }}>Angajat și cont create!</h2>
          <p style={{ color: "#66758a", marginBottom: 20 }}>
            Comunică angajatului parola temporară de mai jos. Aceasta nu va mai fi afișată.
          </p>
          <div style={{
            background: "#f0fdf4", border: "2px solid #0f8a5f", borderRadius: 8,
            padding: "16px 24px", fontFamily: "monospace", fontSize: 22,
            fontWeight: "bold", color: "#0f8a5f", letterSpacing: 2, marginBottom: 24
          }}>
            {createdPassword}
          </div>
          <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 24 }}>
            Angajatul trebuie să se logheze cu această parolă și să o schimbe ulterior.
          </p>
          <button className="primary-button" onClick={onClose} style={{ width: "100%" }}>
            Am notat parola, închide
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div className="section-heading" style={{ marginBottom: 20 }}>
          <div>
            <p className="eyebrow">{isNew ? "Angajat nou" : "Editare angajat"}</p>
            <h2 style={{ margin: 0 }}>{isNew ? "Adaugă angajat" : editing.name}</h2>
          </div>
          <button className="ghost-button" type="button" onClick={onClose}>
            Închide
          </button>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Prenume
            <input
              name="firstName"
              defaultValue={editing.firstName}
              required
              onChange={(e) => updateEmailPreview(e.target.value, document.querySelector('[name="lastName"]')?.value)}
            />
          </label>

          <label>
            Nume
            <input
              name="lastName"
              defaultValue={editing.lastName}
              required
              onChange={(e) => updateEmailPreview(document.querySelector('[name="firstName"]')?.value, e.target.value)}
            />
          </label>

          <label>
            CNP / identificator
            <input name="cnp" defaultValue={editing.cnp} required />
          </label>

          <label>
            Cod legitimație (badge)
            <input name="badgeCode" defaultValue={editing.badgeCode || ""} />
          </label>

          {userRole === "admin" ? (
            <label>
              ID divizie
              <input name="divisionId" type="number" min="1" defaultValue={editing.divisionId || 1} required />
            </label>
          ) : (
            <input type="hidden" name="divisionId" value={userDivisionId} />
          )}

          <label style={{ gridColumn: "span 2" }}>
            Orar acces
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="time"
                value={schedStart}
                onChange={(e) => setSchedStart(e.target.value)}
                style={{ flex: 1 }}
              />
              <span style={{ color: "var(--muted)", fontWeight: 600 }}>—</span>
              <input
                type="time"
                value={schedEnd}
                onChange={(e) => setSchedEnd(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
          </label>

          <label>
            Status
            <select name="status" defaultValue={editing.status}>
              <option value="Activ">Activ</option>
              <option value="Inactiv">Inactiv</option>
            </select>
          </label>

          <label>
            Număr mașină
            <input name="carPlate" defaultValue={editing.carPlate === "-" ? "" : editing.carPlate} placeholder="ex: TM01ABC" />
          </label>

          <label>
            Cod Bluetooth
            {isNew ? (
              <div style={{
                background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: 6,
                padding: "8px 12px", fontFamily: "monospace", fontSize: 14, color: "#1e40af"
              }}>
                {btCode}
              </div>
            ) : (
              <input name="bluetoothCode" defaultValue={editing.bluetoothCode || ""} placeholder="ex: BT-A1B2-C3D4" />
            )}
          </label>

          <label style={{ gridColumn: "span 2" }}>
            URL Poză Angajat
            <input name="photoUrl" defaultValue={editing.photoUrl || ""} placeholder="https://..." />
          </label>

          <label className="checkbox-field" style={{ display: "flex", gap: 8, alignItems: "center", gridColumn: "span 2" }}>
            <input name="autoAccess" type="checkbox" defaultChecked={editing.autoAccess} />
            <span>Acces auto permis (Barieră ESP32)</span>
          </label>

          {isNew && (
            <>
              <div style={{ gridColumn: "span 2", borderTop: "1px solid #e5e7eb", paddingTop: 16, marginTop: 4 }}>
                <p className="eyebrow" style={{ marginBottom: 12 }}>Cont aplicație (opțional)</p>
              </div>
              <label style={{ gridColumn: "span 2" }}>
                Rol cont
                <select
                  value={selectedAccountRole}
                  onChange={(e) => setSelectedAccountRole(e.target.value)}
                >
                  {AVAILABLE_ROLES
                    .filter((r) => userRole === "admin" || r.value !== "hr")
                    .map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                </select>
              </label>
              <div style={{ gridColumn: "span 2" }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  Email generat automat
                </p>
                {emailPreview ? (
                  <div style={{
                    background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 6,
                    padding: "8px 12px", fontFamily: "monospace", fontSize: 14, color: "#166534"
                  }}>
                    {emailPreview}
                  </div>
                ) : (
                  <div style={{
                    background: "#f9fafb", border: "1px dashed #d1d5db", borderRadius: 6,
                    padding: "8px 12px", fontSize: 13, color: "#9ca3af"
                  }}>
                    Completează prenumele și numele pentru a genera emailul
                  </div>
                )}
                <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>
                  Se va crea automat un cont cu această adresă și o parolă temporară.
                </p>
              </div>
            </>
          )}

          {error && (
            <p style={{ gridColumn: "span 2", color: "#c2413a", fontSize: 13 }}>{error}</p>
          )}

          <button
            className="primary-button"
            type="submit"
            style={{ gridColumn: "span 2", marginTop: 8 }}
            disabled={saving}
          >
            {saving ? "Se salvează..." : isNew ? "Creează angajat" : "Salvează modificări"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ModalRaport({ employee, onClose }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const employeeId = employee.employeeId || employee.id;
    setLoading(true);
    setError("");
    getIndividualReport(employeeId)
      .then(setReport)
      .catch((err) => setError(err.message || "Eroare la generarea raportului."))
      .finally(() => setLoading(false));
  }, [employee]);

  const formatDate = (isoString) => {
    if (!isoString) return "—";
    const d = new Date(isoString);
    return d.toLocaleString("ro-RO", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, maxWidth: 680 }}>
        <div className="section-heading" style={{ marginBottom: 20 }}>
          <div>
            <p className="eyebrow">Raport prezență</p>
            <h2 style={{ margin: 0 }}>{employee.name}</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>
              {employee.department || "—"} · {employee.schedule || "—"}
            </p>
          </div>
          <button className="ghost-button" type="button" onClick={onClose}>Închide</button>
        </div>

        {loading && (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--muted)" }}>
            Se generează raportul...
          </div>
        )}

        {error && (
          <div style={{ padding: 16, background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, color: "#b91c1c", fontSize: 14 }}>
            {error}
          </div>
        )}

        {report && !loading && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
              <div className="metric-card" style={{ textAlign: "center" }}>
                <span>Total accesări</span>
                <strong style={{ fontSize: 28 }}>{report.totalEvents}</strong>
              </div>
              <div className="metric-card" style={{ textAlign: "center" }}>
                <span>Accesuri permise</span>
                <strong style={{ fontSize: 28, color: "var(--success)" }}>{report.allowedEvents}</strong>
              </div>
              <div className="metric-card" style={{ textAlign: "center" }}>
                <span>Accesuri refuzate</span>
                <strong style={{ fontSize: 28, color: "var(--danger, #c2413a)" }}>{report.deniedEvents}</strong>
              </div>
            </div>

            {report.events.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--muted)", padding: "24px 0" }}>
                Nu există evenimente înregistrate pentru acest angajat.
              </p>
            ) : (
              <div className="table-wrap" style={{ maxHeight: 320, overflowY: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Data / Ora</th>
                      <th>Tip</th>
                      <th>Status</th>
                      <th>Sursă</th>
                      <th>Notă</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.events.map((ev) => (
                      <tr key={ev.eventId}>
                        <td style={{ whiteSpace: "nowrap" }}>{formatDate(ev.eventTime)}</td>
                        <td>
                          <span className={`badge ${ev.eventType === "ENTRY" ? "info" : "muted"}`}>
                            {ev.eventType === "ENTRY" ? "Intrare" : "Ieșire"}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${ev.eventStatus === "ALLOWED" ? "success" : "danger"}`}>
                            {ev.eventStatus === "ALLOWED" ? "Permis" : "Refuzat"}
                          </span>
                        </td>
                        <td>{ev.source || "—"}</td>
                        <td style={{ fontSize: 12, color: "var(--muted)" }}>{ev.notes || ev.gateCode || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed", inset: 0, zIndex: 9999,
  display: "flex", alignItems: "center", justifyContent: "center",
  background: "rgba(0,0,0,0.45)",
};

const modalStyle = {
  background: "#fff", borderRadius: 12, padding: "28px 32px",
  width: "90%", maxWidth: 580,
  boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  maxHeight: "90vh", overflowY: "auto",
};

export default function Employees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [reportEmployee, setReportEmployee] = useState(null);

  const incaseazaAngajati = () => {
    getEmployees().then(setEmployees).catch(console.error);
  };

  useEffect(() => {
    incaseazaAngajati();
  }, []);

  useEffect(() => {
    document.body.style.overflow = (editing || reportEmployee) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [editing, reportEmployee]);

  const filteredEmployees = useMemo(() => {
    const value = query.toLowerCase();
    return employees.filter((employee) => {
      const areDreptulPeDivizie = user?.role === "admin" || user?.role === "hr" || Number(employee.divisionId) === Number(user?.divisionId);
      const matchesQuery = [employee.name, employee.department, employee.role, employee.carPlate]
        .join(" ").toLowerCase().includes(value);
      return areDreptulPeDivizie && matchesQuery;
    });
  }, [employees, query, user]);

  const handleSaved = (saved) => {
    setEmployees((current) => {
      const exists = current.some((item) => item.id === saved.id);
      return exists
        ? current.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...current];
    });
    incaseazaAngajati();
  };

  return (
    <div className="page-grid">
      <section className="section-heading page-heading">
        <div>
          <p className="eyebrow">Modul Administrare ({user?.role || "Fără Rol"})</p>
          <h2>Angajați și drepturi de acces</h2>
        </div>
        {["admin", "hr"].includes(user?.role) && (
          <button className="primary-button" type="button" onClick={() => setEditing(emptyEmployee)}>
            Adaugă angajat
          </button>
        )}
      </section>

      <section className="card">
        <div className="toolbar">
          <input
            className="search-input"
            type="search"
            placeholder="Caută după nume, departament, rol sau mașină"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="badge info">{filteredEmployees.length} rezultate</span>
        </div>
        <EmployeeTable
          employees={filteredEmployees}
          onEdit={["admin", "hr"].includes(user?.role) ? setEditing : undefined}
          onReport={["admin", "division_manager"].includes(user?.role) ? setReportEmployee : undefined}
        />
      </section>

      {editing && (
        <ModalAngajat
          editing={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
          userRole={user?.role}
          userDivisionId={user?.divisionId}
        />
      )}

      {reportEmployee && (
        <ModalRaport
          employee={reportEmployee}
          onClose={() => setReportEmployee(null)}
        />
      )}
    </div>
  );
}
