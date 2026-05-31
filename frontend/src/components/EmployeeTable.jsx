export default function EmployeeTable({ employees = [], onEdit, onReport }) {
  // Verificăm dacă employees este valid, altfel afișăm un mesaj
  if (!employees || employees.length === 0) {
    return <div className="p-8 text-center">Nu s-au găsit angajați.</div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Angajat</th>
            <th>Departament</th>
            <th>Orar</th>
            <th>Acces auto</th>
            <th>Smartphone</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id || Math.random()}>
              <td>
                <div className="employee-cell">
                  {/* PROTECȚIE AICI: Verificăm dacă name există înainte de slice */}
                  <span className="avatar soft">
                    {employee.name ? employee.name.slice(0, 1) : "?"}
                  </span>
                  <div>
                    <strong>{employee.name || "Nume lipsă"}</strong>
                    <span>{employee.role || "Fără rol"}</span>
                  </div>
                </div>
              </td>
              <td>{employee.department || "N/A"}</td>
              <td>{employee.schedule || "Nespecificat"}</td>
              <td>
                {employee.autoAccess && employee.carPlate 
                  ? employee.carPlate 
                  : "Nu"}
              </td>
              <td>{employee.phone || "Neasociat"}</td>
              <td>
                <span
                  className={`badge ${
                    employee.status === "Activ" ? "success" : "muted"
                  }`}
                >
                  {employee.status || "Inactiv"}
                </span>
              </td>
              <td className="table-actions">
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  {onReport && (
                    <button
                      type="button"
                      onClick={() => onReport(employee)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "5px 10px", borderRadius: 6, border: "1px solid #d1fae5",
                        background: "#f0fdf4", color: "#059669",
                        fontSize: 12, fontWeight: 700, cursor: "pointer",
                        transition: "background 150ms",
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                        <rect x="2" y="8" width="2.5" height="6" rx="1" fill="currentColor"/>
                        <rect x="6.5" y="5" width="2.5" height="9" rx="1" fill="currentColor"/>
                        <rect x="11" y="2" width="2.5" height="12" rx="1" fill="currentColor"/>
                      </svg>
                      Raport
                    </button>
                  )}
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(employee)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "5px 10px", borderRadius: 6, border: "1px solid var(--border)",
                        background: "var(--surface-soft)", color: "var(--text)",
                        fontSize: 12, fontWeight: 700, cursor: "pointer",
                        transition: "background 150ms",
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M11.5 2.5a1.414 1.414 0 0 1 2 2L5 13H3v-2L11.5 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Editare
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}