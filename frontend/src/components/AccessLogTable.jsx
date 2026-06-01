import React, { useRef } from "react";

const AVATAR_STYLE = {
  width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
  background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center",
};

const PERSON_SVG =
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">` +
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
          style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
          onError={() => { if (wrapRef.current) wrapRef.current.innerHTML = PERSON_SVG; }}
        />
      </div>
    );
  }
  return <div style={AVATAR_STYLE} dangerouslySetInnerHTML={{ __html: PERSON_SVG }} />;
}

// Configurare clase pentru badge-uri în funcție de status
const statusClass = {
  Valid: "success",
  Refuzat: "danger",
  Manual: "warning",
};

/**
 * Formatează data într-un mod sigur.
 * Dacă valoarea lipsește sau e invalidă, returnează un șir gol/placeholder
 * în loc să prăbușească întreaga aplicație.
 */
function formatDate(value) {
  if (!value) return "---";
  
  try {
    const date = new Date(value);
    // Verificăm dacă data este validă
    if (isNaN(date.getTime())) return "Data invalidă";

    return new Intl.DateTimeFormat("ro-RO", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    }).format(date);
  } catch (error) {
    console.error("Eroare formatare dată:", error);
    return "---";
  }
}

export default function AccessLogTable({ logs = [] }) {
  // Dacă logs nu este array sau este gol, afișăm un mesaj prietenos
  if (!Array.isArray(logs) || logs.length === 0) {
    return (
      <div className="empty-state-table">
        <p>Nu există înregistrări în jurnalul de acces.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Ora</th>
            <th>Angajat</th>
            <th>Sens</th>
            <th>Status</th>
            <th>Metodă</th>
            <th>Mașină</th>
            <th>Observații</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id || Math.random()}>
              {/* Ora formatată cu protecție */}
              <td>{formatDate(log.timestamp)}</td>
              
              <td>
                <div className="cell-main" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <EmployeeAvatar name={log.employeeName} photoUrl={log.photoUrl} />
                  <div>
                    <strong>{log.employeeName || "Necunoscut"}</strong>
                    <span className="subtext">{log.department || "N/A"}</span>
                  </div>
                </div>
              </td>
              
              <td>
                {log.direction === "IN" ? "Intrare" : "Ieșire"}
              </td>
              
              <td>
                <span className={`badge ${statusClass[log.status] || "info"}`}>
                  {log.status || "Necunoscut"}
                </span>
              </td>
              
              <td>{log.method || "ESP32"}</td>
              
              <td>{log.carPlate || "-"}</td>
              
              <td className="note-cell">
                <small>{log.note || "-"}</small>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}