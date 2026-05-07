import { useEffect, useMemo, useState } from "react";
import AccessLogTable from "../components/AccessLogTable.jsx";
import GateStatusCard from "../components/GateStatusCard.jsx";
import { getAccessLogs, getEmployees, getGateStatus } from "../services/api.js";

function CurrentTime() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="clock-card">
      <span>Ora curenta</span>
      <strong>
        {new Intl.DateTimeFormat("ro-RO", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).format(now)}
      </strong>
    </div>
  );
}

export default function Dashboard() {
  const [gateStatus, setGateStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    getGateStatus().then(setGateStatus);
    getAccessLogs().then(setLogs);
    getEmployees().then(setEmployees);
  }, []);

  const latestLog = logs[0];
  const activeEmployee = useMemo(
    () => employees.find((employee) => employee.id === latestLog?.employeeId),
    [employees, latestLog],
  );

  return (
    <div className="page-grid">
      <section className="hero-band">
        <div>
          <p className="eyebrow">Dashboard poarta</p>
          <h2>Monitorizare intrari si iesiri in timp real</h2>
          <p>
            Starea portii, validarea accesului si ultimele evenimente sunt
            centralizate pentru operatorul de la poarta.
          </p>
        </div>
        <CurrentTime />
      </section>

      <div className="dashboard-layout">
        <GateStatusCard status={gateStatus} />

        <section className="card employee-preview">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Ultimul acces</p>
              <h2>{latestLog?.employeeName || "Fara evenimente"}</h2>
            </div>
            <span className={`badge ${latestLog?.status === "Valid" ? "success" : "danger"}`}>
              {latestLog?.status}
            </span>
          </div>
          <div className="profile-row">
            <span className="avatar xl">{latestLog?.employeeName?.slice(0, 1) || "?"}</span>
            <div>
              <strong>{activeEmployee?.role || "Rol necunoscut"}</strong>
              <span>{activeEmployee?.department || latestLog?.department}</span>
              <span>{latestLog?.carPlate}</span>
            </div>
          </div>
          <div className="action-row">
            <button className="primary-button" type="button">
              Permite acces
            </button>
            <button className="danger-button" type="button">
              Interzice manual
            </button>
          </div>
        </section>
      </div>

      <section className="card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Audit acces</p>
            <h2>Ultimele loguri</h2>
          </div>
          <span className="badge info">{logs.length} evenimente</span>
        </div>
        <AccessLogTable logs={logs.slice(0, 5)} />
      </section>
    </div>
  );
}
