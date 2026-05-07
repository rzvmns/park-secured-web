import { useEffect, useMemo, useState } from "react";
import EmployeeTable from "../components/EmployeeTable.jsx";
import { getEmployees, saveEmployee } from "../services/api.js";

const emptyEmployee = {
  name: "",
  role: "",
  department: "",
  schedule: "08:00 - 17:00",
  phone: "Neasociat",
  carPlate: "",
  autoAccess: false,
  status: "Activ",
};

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    getEmployees().then(setEmployees);
  }, []);

  const filteredEmployees = useMemo(() => {
    const value = query.toLowerCase();
    return employees.filter((employee) =>
      [employee.name, employee.department, employee.role, employee.carPlate]
        .join(" ")
        .toLowerCase()
        .includes(value),
    );
  }, [employees, query]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const employee = {
      ...editing,
      name: form.get("name"),
      role: form.get("role"),
      department: form.get("department"),
      schedule: form.get("schedule"),
      phone: form.get("phone"),
      carPlate: form.get("carPlate") || "-",
      autoAccess: form.get("autoAccess") === "on",
      status: form.get("status"),
    };
    const saved = await saveEmployee(employee);
    setEmployees((current) => {
      const exists = current.some((item) => item.id === saved.id);
      return exists
        ? current.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...current];
    });
    setEditing(null);
  };

  return (
    <div className="page-grid">
      <section className="section-heading page-heading">
        <div>
          <p className="eyebrow">Administrare</p>
          <h2>Angajati si drepturi de acces</h2>
        </div>
        <button className="primary-button" type="button" onClick={() => setEditing(emptyEmployee)}>
          Adauga angajat
        </button>
      </section>

      <section className="card">
        <div className="toolbar">
          <input
            className="search-input"
            type="search"
            placeholder="Cauta dupa nume, departament, rol sau masina"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <span className="badge info">{filteredEmployees.length} rezultate</span>
        </div>
        <EmployeeTable employees={filteredEmployees} onEdit={setEditing} />
      </section>

      {editing && (
        <section className="card form-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Formular</p>
              <h2>{editing.id ? "Editare angajat" : "Angajat nou"}</h2>
            </div>
            <button className="ghost-button" type="button" onClick={() => setEditing(null)}>
              Inchide
            </button>
          </div>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              Nume complet
              <input name="name" defaultValue={editing.name} required />
            </label>
            <label>
              Rol
              <input name="role" defaultValue={editing.role} required />
            </label>
            <label>
              Departament
              <input name="department" defaultValue={editing.department} required />
            </label>
            <label>
              Orar acces
              <input name="schedule" defaultValue={editing.schedule} required />
            </label>
            <label>
              Smartphone
              <select name="phone" defaultValue={editing.phone}>
                <option>Asociat</option>
                <option>Neasociat</option>
              </select>
            </label>
            <label>
              Status
              <select name="status" defaultValue={editing.status}>
                <option>Activ</option>
                <option>Inactiv</option>
              </select>
            </label>
            <label>
              Numar masina
              <input name="carPlate" defaultValue={editing.carPlate} />
            </label>
            <label className="checkbox-field">
              <input name="autoAccess" type="checkbox" defaultChecked={editing.autoAccess} />
              Acces auto permis
            </label>
            <button className="primary-button" type="submit">
              Salveaza
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
