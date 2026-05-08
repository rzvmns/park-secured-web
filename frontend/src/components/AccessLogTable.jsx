import React from "react";

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
                <div className="cell-main">
                  <strong>{log.employeeName || "Necunoscut"}</strong>
                  <span className="subtext">{log.department || "N/A"}</span>
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