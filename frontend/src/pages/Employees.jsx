import { useEffect, useMemo, useState } from "react";import EmployeeTable from "../components/EmployeeTable.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getEmployees, saveEmployee, request } from "../services/api.js";

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
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
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

          <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Orar acces</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="time"
                value={schedStart}
                onChange={(e) => setSchedStart(e.target.value)}
                style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14 }}
              />
              <span style={{ color: "#6b7280", fontWeight: 600 }}>—</span>
              <input
                type="time"
                value={schedEnd}
                onChange={(e) => setSchedEnd(e.target.value)}
                style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14 }}
              />
            </div>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>{schedStart} - {schedEnd}</span>
          </div>

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

  const incaseazaAngajati = () => {
    getEmployees().then(setEmployees).catch(console.error);
  };

  useEffect(() => {
    incaseazaAngajati();
  }, []);

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
    </div>
  );
}
