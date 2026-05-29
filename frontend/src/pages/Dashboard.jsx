import { useEffect, useMemo, useState } from "react";
import AccessLogTable from "../components/AccessLogTable.jsx";
import GateStatusCard from "../components/GateStatusCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getAccessLogs,
  getEmployees,
  getGateStatus,
  validateAccess,
} from "../services/api.js";

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
  const { user } = useAuth();
  const [gateStatus, setGateStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [accessMessage, setAccessMessage] = useState("");

  const refreshDashboard = () => {
    getGateStatus().then(setGateStatus).catch(console.error);
    getAccessLogs().then(setLogs).catch(console.error);
    getEmployees().then(setEmployees).catch(console.error);
  };

  useEffect(() => {
    if (user?.role === "PORTAR" || user?.role === "SUPERADMIN") {
      refreshDashboard();
      // Auto-refresh la fiecare 3 secunde ca să vadă poarta când se deschide din telefon sau ESP32!
      const interval = setInterval(refreshDashboard, 3000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (user?.role === "HR_MANAGER") {
    return (
      <div className="card" style={{ padding: "40px", textAlign: "center" }}>
        <h2>Panou Operațional Poartă</h2>
        <p>Acest ecran este rezervat exclusiv operatorilor de la poartă pentru monitorizarea barierelor.</p>
        <p>Vă rugăm să folosiți secțiunea <strong>Angajați</strong> din meniu.</p>
      </div>
    );
  }

  const handleValidateAccess = async (accessCode, direction = "IN") => {
    try {
      const result = await validateAccess({
        accessCode,
        direction,
        method: "Portar",
      });

      setAccessMessage(result.message || (result.authorized ? "Acces permis" : "Acces refuzat"));
      refreshDashboard();
    } catch (error) {
      setAccessMessage("Eroare de comunicație cu backend-ul.");
    }
  };

  const latestLog = logs[0];

  return (
    <div className="page-grid">
      <section className="hero-band">
        <div>
          <p className="eyebrow">Dashboard poarta ({user?.role || "Fără Rol"})</p>
          <h2>Monitorizare intrari si iesiri in timp real</h2>
          <p>Starea portii, validarea accesului si ultimele evenimente sunt centralizate pentru operator.</p>
        </div>
        <CurrentTime />
      </section>

      <div className="dashboard-layout">
        <GateStatusCard status={gateStatus} />

        <section className="card employee-preview">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                Ultima solicitare: {latestLog?.direction === "OUT" ? "Ieșire 🟠" : "Intrare 🟢"}
              </p>
              <h2>{latestLog?.employeeName || "Fara evenimente"}</h2>
            </div>
            <span className={`badge ${latestLog?.status === "Valid" ? "success" : latestLog?.status === "Refuzat" ? "danger" : "info"}`}>
              {latestLog?.status || "Așteptare..."}
            </span>
          </div>
          
          <div className="profile-row">
            <span className="avatar xl">{latestLog?.employeeName?.slice(0, 1) || "?"}</span>
            <div>
              <p style={{ margin: 0, fontSize: "14px", color: "#6b7280", fontWeight: "500" }}>
                {latestLog?.carPlate && latestLog.carPlate !== "-" ? `🚘 Mașină: ${latestLog.carPlate}` : "🚶 Acces Pietonal"}
              </p>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#9ca3af" }}>
                Departament: {latestLog?.department || "-"}
              </p>
            </div>
          </div>

          <div className="action-row" style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button className="primary-button" type="button" onClick={() => handleValidateAccess("1234", "IN")}>
              Permite Intrare
            </button>
            <button className="primary-button" style={{ backgroundColor: "#d97706" }} type="button" onClick={() => handleValidateAccess("1234", "OUT")}>
              Permite Ieșire
            </button>
            <button className="danger-button" type="button" onClick={() => handleValidateAccess("INVALID", "IN")}>
              Interzice manual
            </button>
          </div>
          {accessMessage && <p className="inline-feedback">{accessMessage}</p>}
        </section>
      </div>

      <section className="card">
        <div className="section-heading">
          <div>
            <h2>Ultimele loguri poartă</h2>
          </div>
          <span className="badge info">{logs.length} evenimente</span>
        </div>
        <AccessLogTable logs={logs.slice(0, 5)} />
      </section>
    </div>
  );
}