import { useEffect, useMemo, useState } from "react";
import EmployeeTable from "../components/EmployeeTable.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getEmployees, saveEmployee } from "../services/api.js";

const emptyEmployee = {
  name: "",
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
      const areDreptulPeDivizie = user?.role === "SUPERADMIN" || employee.divisionId === user?.divisionId;
      const matchesQuery = [employee.name, employee.department, employee.role, employee.carPlate]
        .join(" ")
        .toLowerCase()
        .includes(value);
      return areDreptulPeDivizie && matchesQuery;
    });
  }, [employees, query, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    
    const divisionIdFinal = user?.role === "SUPERADMIN" 
      ? Number(form.get("divisionId")) 
      : user?.divisionId;

    const employee = {
      ...editing,
      name: form.get("name"),
      cnp: form.get("cnp"),
      divisionId: divisionIdFinal,
      role: form.get("role"),
      department: form.get("department"),
      schedule: form.get("schedule"),
      phone: form.get("phone"),
      carPlate: form.get("carPlate") || "-",
      autoAccess: form.get("autoAccess") === "on",
      status: form.get("status"),
    };

    try {
      const saved = await saveEmployee(employee);
      setEmployees((current) => {
        const exists = current.some((item) => item.id === saved.id);
        return exists
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...current];
      });
      setEditing(null);
      incaseazaAngajati();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="page-grid">
      <section className="section-heading page-heading">
        <div>
          <p className="eyebrow">Modul Administrare ({user?.role || "Fără Rol"})</p>
          <h2>Angajati si drepturi de acces - Divizia {user?.role === "SUPERADMIN" ? "Globală" : user?.divisionId}</h2>
        </div>
        {user?.role !== "PORTAR" && (
          <button className="primary-button" type="button" onClick={() => setEditing(emptyEmployee)}>
            Adauga angajat
          </button>
        )}
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
        <EmployeeTable employees={filteredEmployees} onEdit={user?.role !== "PORTAR" ? setEditing : undefined} />
      </section>

      {editing && (
        <section className="card form-card" style={{ marginTop: "20px" }}>
          <div className="section-heading">
            <div>
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
              CNP / identificator
              <input name="cnp" defaultValue={editing.cnp} required />
            </label>
            {user?.role === "SUPERADMIN" ? (
              <label>
                ID divizie
                <input name="divisionId" type="number" min="1" defaultValue={editing.divisionId || 1} required />
              </label>
            ) : (
              <input type="hidden" name="divisionId" value={user?.divisionId} />
            )}
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
                <option value="Asociat">Asociat</option>
                <option value="Neasociat">Neasociat</option>
              </select>
            </label>
            <label>
              Status
              <select name="status" defaultValue={editing.status}>
                <option value="Activ">Activ</option>
                <option value="Inactiv">Inactiv</option>
              </select>
            </label>
            <label>
              Numar masina
              <input name="carPlate" defaultValue={editing.carPlate} />
            </label>
            <label className="checkbox-field" style={{ display: "flex", gap: "8px", alignItems: "center", gridColumn: "span 2" }}>
              <input name="autoAccess" type="checkbox" defaultChecked={editing.autoAccess} />
              <span>Acces auto permis (Barieră ESP32)</span>
            </label>
            <button className="primary-button" type="submit" style={{ marginTop: "10px" }}>
              Salveaza Modificari
            </button>
          </form>
        </section>
      )}
    </div>
  );
}