const statusClass = {
  Valid: "success",
  Refuzat: "danger",
  Manual: "warning",
};

function formatDate(value) {
  return new Intl.DateTimeFormat("ro-RO", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

export default function AccessLogTable({ logs = [] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Ora</th>
            <th>Angajat</th>
            <th>Sens</th>
            <th>Status</th>
            <th>Metoda</th>
            <th>Masina</th>
            <th>Observatii</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{formatDate(log.timestamp)}</td>
              <td>
                <strong>{log.employeeName}</strong>
                <span>{log.department}</span>
              </td>
              <td>{log.direction === "IN" ? "Intrare" : "Iesire"}</td>
              <td>
                <span className={`badge ${statusClass[log.status]}`}>
                  {log.status}
                </span>
              </td>
              <td>{log.method}</td>
              <td>{log.carPlate}</td>
              <td>{log.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
