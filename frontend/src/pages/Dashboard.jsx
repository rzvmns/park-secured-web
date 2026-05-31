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
          hour: "2-digit", minute: "2-digit", second: "2-digit",
        }).format(now)}
      </strong>
    </div>
  );
}

function AccessDetailsCard({ employee, authorized, message }) {
  if (!employee && !message) return null;
  const borderColor = authorized ? "#0f8a5f" : "#c2413a";
  const bgColor = authorized ? "#f0fdf4" : "#fff5f5";
  return (
    <div style={{ border: `2px solid ${borderColor}`, borderRadius: "8px", padding: "16px", marginTop: "16px", background: bgColor, transition: "all 0.3s ease" }}>
      {employee ? (
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {employee.photoUrl ? (
            <img src={employee.photoUrl} alt={employee.name} style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${borderColor}` }} />
          ) : (
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: authorized ? "#0f8a5f" : "#c2413a", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "24px", fontWeight: "700", flexShrink: 0 }}>
              {employee.name?.slice(0, 1) || "?"}
            </div>
          )}
          <div>
            <p style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#18212f" }}>{employee.name}</p>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#66758a" }}>{employee.department} · {employee.role}</p>
            {employee.carPlate && employee.carPlate !== "-" && (
              <p style={{ margin: "4px 0 0", fontSize: "13px", fontWeight: "600", color: "#18212f" }}>🚘 {employee.carPlate}</p>
            )}
            <p style={{ margin: "6px 0 0", fontSize: "13px", fontWeight: "700", color: borderColor }}>
              {authorized ? "✅ ACCES PERMIS" : "❌ ACCES REFUZAT"}
            </p>
          </div>
        </div>
      ) : (
        <p style={{ margin: 0, color: borderColor, fontWeight: "600" }}>{message}</p>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [gateStatus, setGateStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [lastAccess, setLastAccess] = useState(null);
  const [prevFirstLogId, setPrevFirstLogId] = useState(null);

  const refreshDashboard = () => {
    getGateStatus().then(setGateStatus).catch(console.error);
    getAccessLogs().then((newLogs) => {
      setLogs(newLogs);
      // Dacă apare un log nou față de ultima verificare, îl afișăm în cardul mare
      if (newLogs.length > 0 && newLogs[0].id !== prevFirstLogId) {
        setPrevFirstLogId(newLogs[0].id);
        const latest = newLogs[0];
        setLastAccess({
          employee: {
            name: latest.employeeName,
            department: latest.department,
            carPlate: latest.carPlate,
            role: latest.method,
          },
          authorized: latest.status === "Valid",
        });
      }
    }).catch(console.error);
    getEmployees().then(setEmployees).catch(console.error);
  };

  useEffect(() => {
    refreshDashboard();
    if (["admin", "operator"].includes(user?.role)) {
      const interval = setInterval(refreshDashboard, 3000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (user?.role === "hr") {
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
      const result = await validateAccess({ accessCode, direction, method: "Portar" });
      setLastAccess({
        employee: result.employee,
        authorized: result.authorized,
      });
      refreshDashboard();
    } catch (error) {
      setLastAccess({ employee: null, authorized: false, message: "Eroare de comunicație cu backend-ul." });
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

          <AccessDetailsCard
            employee={lastAccess?.employee}
            authorized={lastAccess?.authorized}
            message={lastAccess?.message}
          />
        </section>
      </div>

      <section className="card">
        <div className="section-heading">
          <div><h2>Ultimele loguri poartă</h2></div>
          <span className="badge info">{logs.length} evenimente</span>
        </div>
        <AccessLogTable logs={logs.slice(0, 5)} />
      </section>
    </div>
  );
}
