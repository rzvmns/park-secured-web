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
                {onReport && (
                  <button
                    type="button"
                    className="ghost-button"
                    style={{ marginRight: 6 }}
                    onClick={() => onReport(employee)}
                  >
                    📊 Raport
                  </button>
                )}
                <button 
                  type="button" 
                  className="ghost-button" 
                  onClick={() => onEdit && onEdit(employee)}
                >
                  Editare
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}