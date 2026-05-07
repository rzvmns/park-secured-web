export default function EmployeeTable({ employees = [], onEdit }) {
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
            <tr key={employee.id}>
              <td>
                <div className="employee-cell">
                  <span className="avatar soft">{employee.name.slice(0, 1)}</span>
                  <div>
                    <strong>{employee.name}</strong>
                    <span>{employee.role}</span>
                  </div>
                </div>
              </td>
              <td>{employee.department}</td>
              <td>{employee.schedule}</td>
              <td>{employee.autoAccess ? employee.carPlate : "Nu"}</td>
              <td>{employee.phone}</td>
              <td>
                <span
                  className={`badge ${
                    employee.status === "Activ" ? "success" : "muted"
                  }`}
                >
                  {employee.status}
                </span>
              </td>
              <td className="table-actions">
                <button type="button" className="ghost-button" onClick={() => onEdit(employee)}>
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
