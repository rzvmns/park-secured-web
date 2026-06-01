import React, { useRef } from "react";

const AVATAR_STYLE = {
  width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
  background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center",
};

const PERSON_SVG =
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">` +
  `<circle cx="12" cy="8" r="4" stroke="#9ca3af" stroke-width="1.8"/>` +
  `<path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="#9ca3af" stroke-width="1.8" stroke-linecap="round"/>` +
  `</svg>`;

function EmployeeAvatar({ name, photoUrl }) {
  const wrapRef = useRef(null);
  if (photoUrl) {
    return (
      <div ref={wrapRef} style={AVATAR_STYLE}>
        <img
          src={photoUrl}
          alt={name}
          style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
          onError={() => { if (wrapRef.current) wrapRef.current.innerHTML = PERSON_SVG; }}
        />
      </div>
    );
  }
  return <div style={AVATAR_STYLE} dangerouslySetInnerHTML={{ __html: PERSON_SVG }} />;
}

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
                  <EmployeeAvatar name={employee.name} photoUrl={employee.photoUrl} />
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