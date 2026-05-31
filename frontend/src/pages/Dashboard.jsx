import { useEffect, useRef, useState } from "react";
import AccessLogTable from "../components/AccessLogTable.jsx";
import GateStatusCard from "../components/GateStatusCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getAccessLogs,
  getEmployees,
  getGateStatus,
  validateAccess,
  resolveAccessEvent,
} from "../services/api.js";

// ── SVG icons ──────────────────────────────────────────────────────────────
const IconCar = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ display: "inline", verticalAlign: "middle", flexShrink: 0 }}>
    <path d="M3.5 9l1.8-4.5A1 1 0 0 1 6.24 4h7.52a1 1 0 0 1 .94.5L16.5 9" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="2" y="9" width="16" height="6" rx="1.5" stroke={color} strokeWidth="1.5"/>
    <circle cx="6" cy="15" r="1.5" fill={color}/>
    <circle cx="14" cy="15" r="1.5" fill={color}/>
    <path d="M2 12h16" stroke={color} strokeWidth="1" strokeOpacity="0.3"/>
  </svg>
);

const IconWalk = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ display: "inline", verticalAlign: "middle", flexShrink: 0 }}>
    <circle cx="10" cy="3.5" r="1.5" fill={color}/>
    <path d="M7 7.5l1.5 3 2-1.5 1.5 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.5 10.5L7 16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M11.5 9l1.5 7" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconCheck = ({ size = 16, color = "#16a34a" }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ display: "inline", verticalAlign: "middle", flexShrink: 0 }}>
    <circle cx="10" cy="10" r="9" fill={color} opacity="0.15"/>
    <circle cx="10" cy="10" r="9" stroke={color} strokeWidth="1.5"/>
    <path d="M6 10.5l3 3 5-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconX = ({ size = 16, color = "#dc2626" }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ display: "inline", verticalAlign: "middle", flexShrink: 0 }}>
    <circle cx="10" cy="10" r="9" fill={color} opacity="0.15"/>
    <circle cx="10" cy="10" r="9" stroke={color} strokeWidth="1.5"/>
    <path d="M7 7l6 6M13 7l-6 6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const IconWarning = ({ size = 48, color = "#c2413a" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ display: "block", flexShrink: 0 }}>
    <path d="M24 4L44 40H4L24 4z" fill={color} opacity="0.12" stroke={color} strokeWidth="2.5" strokeLinejoin="round"/>
    <path d="M24 18v10" stroke={color} strokeWidth="3" strokeLinecap="round"/>
    <circle cx="24" cy="33" r="2" fill={color}/>
  </svg>
);

const IconClock = ({ size = 14, color = "#b7791f" }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ display: "inline", verticalAlign: "middle", flexShrink: 0 }}>
    <circle cx="10" cy="10" r="8.5" stroke={color} strokeWidth="1.5"/>
    <path d="M10 6v4.5l3 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconBlock = ({ size = 14, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ display: "inline", verticalAlign: "middle", flexShrink: 0 }}>
    <circle cx="10" cy="10" r="8.5" stroke={color} strokeWidth="1.5"/>
    <path d="M4 10h12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const IconArrowIn = ({ size = 13, color = "#16a34a" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: "inline", verticalAlign: "middle", flexShrink: 0 }}>
    <path d="M8 2v9M4 7l4 4 4-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 14h10" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const IconArrowOut = ({ size = 13, color = "#ea580c" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: "inline", verticalAlign: "middle", flexShrink: 0 }}>
    <path d="M8 14V5M4 9l4-4 4 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 14h10" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
// ───────────────────────────────────────────────────────────────────────────

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
              <p style={{ margin: "4px 0 0", fontSize: "13px", fontWeight: "600", color: "#18212f", display: "flex", alignItems: "center", gap: 5 }}>
                <IconCar color="#6b7280" /> {employee.carPlate}
              </p>
            )}
            <p style={{ margin: "6px 0 0", fontSize: "13px", fontWeight: "700", color: borderColor, display: "flex", alignItems: "center", gap: 6 }}>
              {authorized
                ? <><IconCheck size={15} color="#16a34a" /> ACCES PERMIS</>
                : <><IconX size={15} color="#dc2626" /> ACCES REFUZAT</>
              }
            </p>
          </div>
        </div>
      ) : (
        <p style={{ margin: 0, color: borderColor, fontWeight: "600" }}>{message}</p>
      )}
    </div>
  );
}

function TimeAlertModal({ alert, onDismiss, onManualDeny }) {
  useEffect(() => {
    if (!alert) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [alert]);

  if (!alert) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.55)",
      animation: "fadeIn 0.2s ease",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "12px",
        padding: "32px 28px",
        maxWidth: "440px",
        width: "90%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        border: "3px solid #c2413a",
        animation: "pulse-border 1s ease infinite",
        textAlign: "center",
      }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
          <IconWarning size={48} color="#c2413a" />
        </div>
        <h2 style={{ margin: "0 0 8px", color: "#c2413a", fontSize: "20px" }}>
          Acces în afara intervalului orar!
        </h2>
        <p style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: "700", color: "#18212f" }}>
          {alert.employeeName}
        </p>
        <p style={{ margin: "0 0 4px", fontSize: "14px", color: "#66758a" }}>
          {alert.department}
        </p>
        <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#b7791f", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <IconClock size={14} color="#b7791f" /> Interval permis: {alert.schedule || "nespecificat"}
        </p>
        {alert.carPlate && alert.carPlate !== "-" && (
          <p style={{ margin: "0 0 16px", fontSize: "13px", fontWeight: "600", color: "#18212f", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <IconCar size={14} color="#6b7280" /> {alert.carPlate}
          </p>
        )}
        <p style={{ margin: "0 0 24px", fontSize: "13px", color: "#66758a" }}>
          Portarul poate permite accesul excepțional sau îl poate interzice manual.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button
            onClick={onManualDeny}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "10px 20px", borderRadius: "8px", border: "none",
              background: "#c2413a", color: "#fff", fontWeight: "700",
              fontSize: "14px", cursor: "pointer",
            }}
          >
            <IconBlock size={15} color="#fff" /> Închide bariera
          </button>
          <button
            onClick={onDismiss}
            style={{
              padding: "10px 20px", borderRadius: "8px", border: "2px solid #dbe3ec",
              background: "#fff", color: "#18212f", fontWeight: "600",
              fontSize: "14px", cursor: "pointer",
            }}
          >
            Permite excepțional
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse-border {
          0%, 100% { border-color: #c2413a; box-shadow: 0 0 0 0 rgba(194,65,58,0.4); }
          50% { border-color: #e05d56; box-shadow: 0 0 0 8px rgba(194,65,58,0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function isOutsideTimeWindow(note) {
  if (!note) return false;
  const n = note.toLowerCase();
  return n.includes("outside allowed interval") || n.includes("interval orar") || n.includes("afara");
}

export default function Dashboard() {
  const { user } = useAuth();
  const [gateStatus, setGateStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [lastAccess, setLastAccess] = useState(null);
  const [prevFirstLogId, setPrevFirstLogId] = useState(null);
  const [timeAlert, setTimeAlert] = useState(null);
  const [gateAnimating, setGateAnimating] = useState(false);
  const gateAnimatingRef = useRef(false);
  const [gateClosing, setGateClosing] = useState(false);

  const refreshDashboard = () => {
    getGateStatus().then((status) => { if (!gateAnimatingRef.current) setGateStatus(status); }).catch(console.error);
    Promise.all([getAccessLogs(), getEmployees()]).then(([newLogs, newEmployees]) => {
      setLogs(newLogs);
      setEmployees(newEmployees);

      const pendingLog = newLogs.find((log) => log.status === "Pending");
      if (pendingLog) {
        if (pendingLog.id !== timeAlert?.eventId) {
          const emp = newEmployees.find((e) => e.employeeId === pendingLog.employeeId);
          setTimeAlert({
            eventId: pendingLog.id,
            employeeName: pendingLog.employeeName,
            department: pendingLog.department,
            carPlate: pendingLog.carPlate,
            schedule: emp?.schedule || pendingLog.schedule || null,
          });
        }
      } else {
        setTimeAlert(null);
      }

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

  const simulateGate = (authorized) => {
    if (!authorized) return;
    setGateAnimating(true);
    gateAnimatingRef.current = true;
    setGateStatus((prev) => ({
      ...prev,
      state: "In curs de deschidere",
      activeLed: "Galben",
      barrier: "Simulat",
      esp32: "Simulat",
      cloud: "OK",
    }));
    setTimeout(() => {
      setGateStatus((prev) => ({ ...prev, state: "Deschisa", activeLed: "Verde" }));
      setTimeout(() => {
        setGateStatus((prev) => ({ ...prev, state: "In curs de inchidere", activeLed: "Galben" }));
        setTimeout(() => {
          setGateStatus((prev) => ({ ...prev, state: "Inchisa", activeLed: "Rosu" }));
          setGateAnimating(false);
          gateAnimatingRef.current = false;
        }, 2000);
      }, 20000);
    }, 1500);
  };

  const simulateClose = () => {
    if (gateClosing) return;
    setGateClosing(true);
    setGateStatus((prev) => ({
      ...prev,
      state: "In curs de inchidere",
      activeLed: "Galben",
      barrier: "Simulat",
      esp32: "Simulat",
      cloud: "OK",
    }));
    setTimeout(() => {
      setGateStatus((prev) => ({ ...prev, state: "Inchisa", activeLed: "Rosu" }));
      setGateClosing(false);
      setGateAnimating(false);
      gateAnimatingRef.current = false;
    }, 3000);
  };

  const handleValidateAccess = async (accessCode, direction = "IN") => {
    try {
      const result = await validateAccess({ accessCode, direction, method: "Portar" });
      setLastAccess({ employee: result.employee, authorized: result.authorized });
      simulateGate(result.authorized);
      refreshDashboard();
    } catch (error) {
      setLastAccess({ employee: null, authorized: false, message: "Eroare de comunicație cu backend-ul." });
    }
  };

  const handleManualDeny = async () => {
    const alert = timeAlert;
    if (!alert?.eventId) { setTimeAlert(null); return; }
    try {
      const result = await resolveAccessEvent(alert.eventId, "DENIED");
      setTimeAlert(null);
      setLastAccess({
        employee: { name: alert.employeeName, department: alert.department, carPlate: alert.carPlate },
        authorized: false,
        message: "Acces interzis manual de portar.",
      });
    } catch (err) {
      console.error("resolve error:", err);
    }
  };

  const handleDismissAlert = async () => {
    const alert = timeAlert;
    if (!alert?.eventId) { setTimeAlert(null); return; }
    try {
      await resolveAccessEvent(alert.eventId, "ALLOWED");
      simulateGate(true);
      setTimeAlert(null);
      setLastAccess({
        employee: { name: alert.employeeName, department: alert.department, carPlate: alert.carPlate },
        authorized: true,
        message: "Acces permis excepțional de portar.",
      });
    } catch (err) {
      console.error("Eroare la aprobare:", err);
    }
  };

  const latestLog = logs[0];

  return (
    <div className="page-grid">
      <TimeAlertModal
        alert={timeAlert}
        onDismiss={handleDismissAlert}
        onManualDeny={handleManualDeny}
      />

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
              <p className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                Ultima solicitare:&nbsp;
                {latestLog?.direction === "OUT"
                  ? <><IconArrowOut size={13} color="#ea580c" /> Ieșire</>
                  : <><IconArrowIn size={13} color="#16a34a" /> Intrare</>
                }
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
              <p style={{ margin: 0, fontSize: "14px", color: "#6b7280", fontWeight: "500", display: "flex", alignItems: "center", gap: 5 }}>
                {latestLog?.carPlate && latestLog.carPlate !== "-"
                  ? <><IconCar size={14} color="#6b7280" /> Mașină: {latestLog.carPlate}</>
                  : <><IconWalk size={14} color="#6b7280" /> Acces Pietonal</>
                }
              </p>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#9ca3af" }}>
                Departament: {latestLog?.department || "-"}
              </p>
            </div>
          </div>

          <div className="action-row" style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
            {["admin", "operator"].includes(user?.role) && (
              <>
                <button className="primary-button" type="button" disabled={gateAnimating} onClick={() => { handleValidateAccess("1234", "IN"); simulateGate(true); }}>
                  Permite Intrare
                </button>
                <button className="primary-button" style={{ backgroundColor: "#d97706" }} type="button" disabled={gateAnimating} onClick={() => { handleValidateAccess("1234", "OUT"); simulateGate(true); }}>
                  Permite Ieșire
                </button>
                <button className="danger-button" type="button" disabled={gateClosing} onClick={() => { handleValidateAccess("INVALID", "IN"); simulateClose(); }}>
                  Închide bariera
                </button>
              </>
            )}
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
