import { useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";

// Helper: detectează dacă rulăm în contextul Tauri sau în browser simplu
const isTauri = () => typeof (window as any).__TAURI_INTERNALS__ !== "undefined";
import AccessLogTable from "../components/AccessLogTable";
import GateStatusCard from "../components/GateStatusCard";
import { useAuth } from "../context/AuthContext";
import {
  getAccessLogs,
  getEmployees,
  getGateStatus,
  validateAccess,
  resolveAccessEvent,
} from "../services/api";

// ── SVG icons ──────────────────────────────────────────────────────────────
const iconStyle = { display: "inline-block", verticalAlign: "-0.125em", flexShrink: 0 } as const;

const IconCar = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={iconStyle}>
    <path d="M3.5 9l1.8-4.5A1 1 0 0 1 6.24 4h7.52a1 1 0 0 1 .94.5L16.5 9" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="2" y="9" width="16" height="6" rx="1.5" stroke={color} strokeWidth="1.5"/>
    <circle cx="6" cy="15" r="1.5" fill={color}/>
    <circle cx="14" cy="15" r="1.5" fill={color}/>
    <path d="M2 12h16" stroke={color} strokeWidth="1" strokeOpacity="0.3"/>
  </svg>
);

const IconWalk = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={iconStyle}>
    <circle cx="10" cy="3.5" r="1.5" fill={color}/>
    <path d="M7 7.5l1.5 3 2-1.5 1.5 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.5 10.5L7 16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M11.5 9l1.5 7" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconCheck = ({ size = 16, color = "#16a34a" }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={iconStyle}>
    <circle cx="10" cy="10" r="9" fill={color} opacity="0.15"/>
    <circle cx="10" cy="10" r="9" stroke={color} strokeWidth="1.5"/>
    <path d="M6 10.5l3 3 5-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconX = ({ size = 16, color = "#dc2626" }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={iconStyle}>
    <circle cx="10" cy="10" r="9" fill={color} opacity="0.15"/>
    <circle cx="10" cy="10" r="9" stroke={color} strokeWidth="1.5"/>
    <path d="M7 7l6 6M13 7l-6 6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const IconBluetooth = ({ size = 16, color = "#2563eb" }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={iconStyle}>
    <path d="M6 6l8 8M14 6L6 14M10 3v14" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
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
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={iconStyle}>
    <circle cx="10" cy="10" r="8.5" stroke={color} strokeWidth="1.5"/>
    <path d="M10 6v4.5l3 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconBlock = ({ size = 14, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={iconStyle}>
    <circle cx="10" cy="10" r="8.5" stroke={color} strokeWidth="1.5"/>
    <path d="M4 10h12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const IconArrowIn = ({ size = 13, color = "#16a34a" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={iconStyle}>
    <path d="M14 8H4M8 4L4 8l4 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 3v10" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const IconArrowOut = ({ size = 13, color = "#ea580c" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={iconStyle}>
    <path d="M2 8h10M8 4l4 4-4 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 3v10" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
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

interface Employee {
  name?: string;
  department?: string;
  role?: string;
  photoUrl?: string;
  carPlate?: string;
}

const PERSON_SVG_STR = (color: string) =>
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">` +
  `<circle cx="12" cy="8" r="4" stroke="${color}" stroke-width="1.8"/>` +
  `<path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>` +
  `</svg>`;

// Avatar cu fallback la inițiala — dacă photoUrl lipsește sau imaginea
// returnează 404/eroare, afișăm un cerc colorat cu prima literă a numelui.
function EmployeeAvatar({ name, photoUrl, size, borderColor, fontSize = 16 }: {
  name?: string;
  photoUrl?: string;
  size: number;
  borderColor: string;
  fontSize?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const initial = name?.trim().slice(0, 1).toUpperCase() || "?";
  const circleStyle: React.CSSProperties = {
    width: size, height: size, borderRadius: "50%", flexShrink: 0,
    background: borderColor, display: "flex", alignItems: "center",
    justifyContent: "center", color: "white", fontWeight: 700, fontSize,
  };

  if (photoUrl) {
    return (
      <div ref={wrapRef} style={{ ...circleStyle, background: borderColor, overflow: "hidden" }}>
        <img
          src={photoUrl}
          alt={name}
          style={{ width: size, height: size, objectFit: "cover", display: "block" }}
          onError={() => {
            if (wrapRef.current) {
              wrapRef.current.innerHTML =
                `<span style="color:white;font-weight:700;font-size:${fontSize}px">${initial}</span>`;
            }
          }}
        />
      </div>
    );
  }

  return <div style={circleStyle}>{initial}</div>;
}

function AccessDetailsCard({ employee, authorized, pending, message, source }: {
  employee?: Employee | null;
  authorized?: boolean;
  pending?: boolean;
  message?: string;
  source?: string;
}) {
  if (!employee && !message) return null;
  const borderColor = pending ? "#d97706" : authorized ? "#0f8a5f" : "#c2413a";
  const bgColor = pending ? "#fffbeb" : authorized ? "#f0fdf4" : "#fff5f5";
  return (
    <div style={{ border: `2px solid ${borderColor}`, borderRadius: "8px", padding: "16px", marginTop: "16px", background: bgColor, transition: "all 0.3s ease" }}>
      {employee ? (
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <EmployeeAvatar name={employee.name} photoUrl={employee.photoUrl} size={64} borderColor={borderColor} fontSize={24} />
          <div>
            <p style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#18212f" }}>{employee.name}</p>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#66758a" }}>{employee.department} · {employee.role}</p>
            {employee.carPlate && employee.carPlate !== "-" && (
              <p style={{ margin: "4px 0 0", fontSize: "13px", fontWeight: "600", color: "#18212f", display: "flex", alignItems: "center", gap: 5 }}>
                <IconCar color="#6b7280" /> {employee.carPlate}
              </p>
            )}
            {source && (
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}>
                <IconBluetooth size={12} color="#2563eb" /> {source}
              </p>
            )}
            <p style={{ margin: "6px 0 0", fontSize: "13px", fontWeight: "700", color: borderColor, display: "flex", alignItems: "center", gap: 6 }}>
              {pending
                ? <><IconClock size={15} color="#d97706" /> AȘTEPTARE PORTAR</>
                : authorized
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

interface TimeAlert {
  eventId: number;
  employeeName: string;
  department: string;
  carPlate?: string;
  schedule?: string | null;
  photoUrl?: string;
}

function TimeAlertModal({ alert, onDismiss, onManualDeny }: {
  alert: TimeAlert | null;
  onDismiss: () => void;
  onManualDeny: () => void;
}) {
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
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
          <EmployeeAvatar
            name={alert.employeeName}
            photoUrl={alert.photoUrl}
            size={80}
            borderColor="#c2413a"
            fontSize={30}
          />
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
            <IconBlock size={15} color="#fff" /> Refuză accesul
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

// ── Bluetooth notification banner ──────────────────────────────────────────
interface BluetoothNotif {
  authorized: boolean;
  employee?: Employee | null;
  message?: string;
  source: string;
}

function BluetoothBanner({ notif, onClose }: { notif: BluetoothNotif | null; onClose: () => void }) {
  useEffect(() => {
    if (!notif) return;
    const t = setTimeout(onClose, 8000);
    return () => clearTimeout(t);
  }, [notif]);

  if (!notif) return null;

  const bg = notif.authorized ? "#f0fdf4" : "#fff5f5";
  const border = notif.authorized ? "#16a34a" : "#dc2626";

  return (
    <div style={{
      position: "fixed", top: "20px", right: "20px", zIndex: 8888,
      maxWidth: "360px", width: "calc(100% - 40px)",
      background: bg, border: `2px solid ${border}`, borderRadius: "12px",
      padding: "16px 20px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      animation: "slideIn 0.3s ease",
      display: "flex", alignItems: "flex-start", gap: "12px",
    }}>
      <div style={{ flexShrink: 0, marginTop: 2 }}>
        <IconBluetooth size={20} color="#2563eb" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Acces Bluetooth — {notif.source}
        </p>
        {notif.employee ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <EmployeeAvatar name={notif.employee.name} photoUrl={notif.employee.photoUrl} size={36} borderColor={border} fontSize={16} />
            <div>
              <p style={{ margin: 0, fontWeight: "700", fontSize: "15px", color: "#18212f" }}>{notif.employee.name}</p>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#66758a" }}>{notif.employee.department}</p>
              {notif.employee.carPlate && notif.employee.carPlate !== "-" && (
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#18212f", display: "flex", alignItems: "center", gap: 4 }}>
                  <IconCar size={12} color="#6b7280" /> {notif.employee.carPlate}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: "14px", color: border, fontWeight: "600" }}>{notif.message}</p>
        )}
        <p style={{ margin: "8px 0 0", fontSize: "13px", fontWeight: "700", color: border, display: "flex", alignItems: "center", gap: 5 }}>
          {notif.authorized
            ? <><IconCheck size={14} color="#16a34a" /> ACCES PERMIS</>
            : <><IconX size={14} color="#dc2626" /> ACCES REFUZAT</>
          }
        </p>
      </div>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "18px", padding: "0", lineHeight: 1, flexShrink: 0 }}>
        ×
      </button>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Payload shape din cloud (via lib.rs) ───────────────────────────────────
interface BluetoothPayload {
  authorized: boolean;
  status: string;
  message: string;
  employee?: {
    firstName?: string;
    lastName?: string;
    photoUrl?: string;
    carNumber?: string;
    divisionId?: number;
  } | null;
}

export default function Dashboard() {
  const { user } = useAuth();

  // Tot state-ul care se actualizează împreună la polling e grupat —
  // un singur setState = un singur render, fără glitch-uri între câmpuri.
  const [dash, setDash] = useState<{
    gateStatus: any;
    logs: any[];
    lastAccess: any;
    timeAlert: TimeAlert | null;
  }>({ gateStatus: null, logs: [], lastAccess: null, timeAlert: null });

  const { gateStatus, logs, lastAccess, timeAlert } = dash;

  const setGateStatus  = (fn: any) => setDash(prev => ({ ...prev, gateStatus:  typeof fn === "function" ? fn(prev.gateStatus)  : fn }));
  const setLogs        = (v: any)  => setDash(prev => ({ ...prev, logs: v }));
  const setLastAccess  = (fn: any) => setDash(prev => ({ ...prev, lastAccess:  typeof fn === "function" ? fn(prev.lastAccess)  : fn }));
  const setTimeAlert   = (fn: any) => setDash(prev => ({ ...prev, timeAlert:   typeof fn === "function" ? fn(prev.timeAlert)   : fn }));

  const [bluetoothNotif, setBluetoothNotif] = useState<BluetoothNotif | null>(null);

  const timeAlertRef = useRef<TimeAlert | null>(null);
  const prevFirstLogIdRef = useRef<number | null>(null);
  const resolvedEventIdsRef = useRef<Set<number>>(new Set());

  // ── Tauri: bluetooth-access-result listener (cu fallback pentru browser) ──
  useEffect(() => {
    let unlisten: (() => void) | null = null;

    // Handler comun — procesează payload-ul indiferent de sursa evenimentului
    const handleBluetoothPayload = (payload: BluetoothPayload) => {
      if (!payload || typeof payload !== "object" || !("authorized" in payload)) {
        console.warn("bluetooth-access-result: payload invalid", payload);
        return;
      }

      const { authorized, message, employee } = payload;
      console.log(employee?.divisionId);
      const emp = employee
        ? {
            name: `${employee.firstName || ""} ${employee.lastName || ""}`.trim() || "Angajat",
            department: employee.divisionId ? `Divizia ${employee.divisionId}` : "N/A",
            photoUrl: employee.photoUrl || "",
            carPlate: employee.carNumber || "-",
            role: "Bluetooth",
          }
        : null;

      setBluetoothNotif({ authorized, employee: emp, message, source: "Bluetooth" });
      setLastAccess({ employee: emp, authorized, message: emp ? undefined : message, source: "Bluetooth" });
      refreshDashboard();
    };

    if (isTauri()) {
      // Rulăm în Tauri — ascultăm evenimentul nativ emis din Rust
      listen<BluetoothPayload>("bluetooth-access-result", (event) => {
        handleBluetoothPayload(event.payload);
      }).then((fn) => {
        unlisten = fn;
      }).catch((err) => {
        console.error("Eroare la înregistrarea listener-ului Tauri bluetooth:", err);
      });
    } else {
      // Fallback pentru browser / dev web — ascultăm un CustomEvent pe window
      // Util când testezi fără Tauri sau când BLE vine prin altă cale (ex: WebSocket)
      const browserHandler = (e: Event) => {
        const detail = (e as CustomEvent<BluetoothPayload>).detail;
        handleBluetoothPayload(detail);
      };
      window.addEventListener("bluetooth-access-result", browserHandler);
      unlisten = () => window.removeEventListener("bluetooth-access-result", browserHandler);
    }

    return () => { unlisten?.(); };
  }, []);
  // ─────────────────────────────────────────────────────────────────────────

  const refreshDashboard = () => {
    getGateStatus()
      .then((status: any) => {
        setDash(prev => ({ ...prev, gateStatus: status }));
      })
      .catch(console.error);

    Promise.all([getAccessLogs(), getEmployees()]).then(([newLogs, newEmployees]) => {
      console.log("POLLING - logs:", newLogs.length);

      // Calculăm toate valorile noi înainte de a apela setState
      let newTimeAlert: TimeAlert | null | "keep" = "keep";
      const pendingLog = newLogs.find((log: any) => log.status === "Pending" && !resolvedEventIdsRef.current.has(log.id));
      if (pendingLog) {
        if (pendingLog.id !== timeAlertRef.current?.eventId) {
          const emp = newEmployees.find((e: any) => Number(e.employeeId) === Number(pendingLog.employeeId));
          const alert: TimeAlert = {
            eventId: pendingLog.id,
            employeeName: pendingLog.employeeName,
            department: pendingLog.department,
            carPlate: pendingLog.carPlate,
            schedule: emp?.schedule || pendingLog.schedule || null,
            photoUrl: pendingLog.photoUrl || emp?.photoUrl || '',
          };
          timeAlertRef.current = alert;
          newTimeAlert = alert;
        }
      } else {
        const currentId = timeAlertRef.current?.eventId;
        if (currentId == null || !resolvedEventIdsRef.current.has(currentId)) {
          if (timeAlertRef.current !== null) {
            timeAlertRef.current = null;
            newTimeAlert = null;
          }
        }
      }

      // Un singur setDash = un singur render
      let newLastAccess: any = null;
      let shouldUpdateLastAccess = false;
      if (newLogs.length > 0 && newLogs[0].id !== prevFirstLogIdRef.current) {
        prevFirstLogIdRef.current = newLogs[0].id;
        const latest = newLogs[0];
        newLastAccess = {
          employee: {
            name: latest.employeeName,
            department: latest.department,
            carPlate: latest.carPlate,
            role: latest.method,
            photoUrl: latest.photoUrl || "",
          },
          authorized: latest.status === "Valid",
          pending: latest.status === "Pending",
        };
        shouldUpdateLastAccess = true;
      }

      setDash(prev => {
        // Dacă lastAccess vine din Bluetooth și log-ul nou e același eveniment, păstrăm datele Bluetooth
        const keepBluetooth = shouldUpdateLastAccess && prev.lastAccess?.source === "Bluetooth"
          && prev.lastAccess?.bluetoothEventLogId === newLogs[0]?.id;

        return {
          ...prev,
          logs: newLogs,
          lastAccess: keepBluetooth ? prev.lastAccess : shouldUpdateLastAccess ? newLastAccess : prev.lastAccess,
          ...(newTimeAlert !== "keep" ? { timeAlert: newTimeAlert } : {}),
        };
      });
    }).catch(console.error);
  };

  useEffect(() => {
    refreshDashboard();
    if (["admin", "operator"].includes(user?.role ?? "")) {
      const interval = setInterval(refreshDashboard, 500);
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

  const handleManualDeny = async () => {
    const alert = timeAlert;
    if (!alert?.eventId) { setTimeAlert(null); return; }
    try {
      resolvedEventIdsRef.current.add(alert.eventId);
      await resolveAccessEvent(alert.eventId, "DENIED");
      // Nu resetăm timeAlertRef.current = null — îl lăsăm cu eventId-ul curent
      // astfel polling-ul nu mai recunoaște același eveniment PENDING ca "nou"
      setTimeAlert(null);
      setLastAccess({
        employee: { name: alert.employeeName, department: alert.department !== "N/A" ? alert.department : "", carPlate: alert.carPlate, photoUrl: alert.photoUrl },
        authorized: false,
      });
    } catch (err) {
      console.error("resolve error:", err);
    }
  };

  const handleDismissAlert = async () => {
    const alert = timeAlert;
    if (!alert?.eventId) { setTimeAlert(null); return; }
    try {
      resolvedEventIdsRef.current.add(alert.eventId);
      await resolveAccessEvent(alert.eventId, "ALLOWED");
      // Nu resetăm timeAlertRef.current = null — îl lăsăm cu eventId-ul curent
      // astfel polling-ul nu mai recunoaște același eveniment PENDING ca "nou"
      setTimeAlert(null);
      setLastAccess({
        employee: { name: alert.employeeName, department: alert.department !== "N/A" ? alert.department : "", carPlate: alert.carPlate, photoUrl: alert.photoUrl },
        authorized: true,
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

      <BluetoothBanner
        notif={bluetoothNotif}
        onClose={() => setBluetoothNotif(null)}
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
            <EmployeeAvatar name={latestLog?.employeeName} photoUrl={latestLog?.photoUrl} size={80} borderColor="#6b7280" fontSize={32} />
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

          <AccessDetailsCard
            employee={lastAccess?.employee}
            authorized={lastAccess?.authorized}
            pending={lastAccess?.pending}
            message={lastAccess?.message}
            source={lastAccess?.source}
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
