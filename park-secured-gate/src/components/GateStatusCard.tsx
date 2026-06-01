const ledClass = {
  Galben: "warning",
  Verde: "success",
  Rosu: "danger",
  Albastru: "info",
};

function GateAnimation({ state }: { state: string }) {
  const isOpen = state === "Deschisa";
  const isOpening = state === "In curs de deschidere";
  const isClosing = state === "In curs de inchidere";
  const isMoving = isOpening || isClosing;

  // Arm rotates: 0deg = horizontal (closed), -90deg = vertical (open)
  const armAngle = isOpen ? -88 : isMoving ? -44 : 0;
  const armColor = isOpen ? "#16a34a" : isMoving ? "#d97706" : "#dc2626";
  const armTransition = isMoving
    ? "transform 1.2s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s"
    : isOpen
    ? "transform 1.5s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s"
    : "transform 2s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s";

  const bgColor = isOpen ? "#f0fdf4" : isMoving ? "#fffbeb" : "#fff5f5";
  const groundColor = isOpen ? "#bbf7d0" : isMoving ? "#fde68a" : "#fecaca";

  return (
    <div style={{
      position: "relative",
      height: "200px",
      margin: "16px -8px",
      borderRadius: "10px",
      background: bgColor,
      border: `1.5px solid ${isOpen ? "#86efac" : isMoving ? "#fcd34d" : "#fca5a5"}`,
      overflow: "hidden",
      transition: "background 0.5s, border-color 0.5s",
    }}>
      {/* Ground line */}
      <div style={{
        position: "absolute",
        bottom: "38px",
        left: 0,
        right: 0,
        height: "3px",
        background: groundColor,
        transition: "background 0.5s",
      }} />

      {/* Road markings */}
      {[0,1,2,3,4].map(i => (
        <div key={i} style={{
          position: "absolute",
          bottom: "24px",
          left: `${15 + i * 18}%`,
          width: "8%",
          height: "3px",
          background: groundColor,
          transition: "background 0.5s",
        }} />
      ))}

      {/* Post / housing */}
      <div style={{
        position: "absolute",
        bottom: "38px",
        left: "52px",
        width: "22px",
        height: "52px",
        background: "linear-gradient(180deg, #374151 0%, #1f2937 100%)",
        borderRadius: "4px 4px 0 0",
        boxShadow: "inset -2px 0 4px rgba(0,0,0,0.3), 2px 0 6px rgba(0,0,0,0.15)",
      }}>
        {/* Light on post */}
        <div style={{
          position: "absolute",
          top: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          background: armColor,
          boxShadow: `0 0 8px 2px ${armColor}`,
          transition: "background 0.4s, box-shadow 0.4s",
        }} />
      </div>

      {/* Pivot point */}
      <div style={{
        position: "absolute",
        bottom: "88px",
        left: "56px",
        width: "14px",
        height: "14px",
        borderRadius: "50%",
        background: "#111827",
        border: "2px solid #6b7280",
        zIndex: 3,
        transform: "translateX(-50%)",
      }} />

      {/* Arm */}
      <div style={{
        position: "absolute",
        bottom: "94px",
        left: "63px",
        width: "300px",
        height: "14px",
        transformOrigin: "0% 50%",
        transform: `rotate(${armAngle}deg)`,
        transition: armTransition,
        zIndex: 2,
        borderRadius: "0 4px 4px 0",
        background: `repeating-linear-gradient(90deg, #dc2626 0px, #dc2626 24px, #ffffff 24px, #ffffff 40px)`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        filter: isOpen ? "brightness(0.85) saturate(0.7)" : "brightness(1)",
      }}>
        {/* Tip weight */}
        <div style={{
          position: "absolute",
          right: "-4px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "10px",
          height: "22px",
          borderRadius: "3px",
          background: "#1f2937",
        }} />
      </div>

      {/* Counterweight */}
      <div style={{
        position: "absolute",
        bottom: "94px",
        left: "37px",
        width: "26px",
        height: "14px",
        transformOrigin: "100% 50%",
        transform: `rotate(${-armAngle}deg)`,
        transition: armTransition,
        zIndex: 2,
        borderRadius: "4px 0 0 4px",
        background: "#374151",
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
      }}>
        <div style={{
          position: "absolute",
          left: "-6px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "14px",
          height: "20px",
          borderRadius: "3px",
          background: "#111827",
        }} />
      </div>

      {/* Status label */}
      <div style={{
        position: "absolute",
        bottom: "8px",
        left: 0, right: 0,
        textAlign: "center",
        fontSize: "11px",
        fontWeight: "700",
        letterSpacing: "0.08em",
        color: isOpen ? "#16a34a" : isMoving ? "#d97706" : "#dc2626",
        transition: "color 0.4s",
      }}>
        {isOpen ? "▲ RIDICATĂ" : isMoving ? state.toUpperCase() : "▼ COBORÂTĂ"}
      </div>
    </div>
  );
}

export default function GateStatusCard({ status }: { status: any }) {
  if (!status) {
    return <div className="card skeleton-card">Se incarca starea portii...</div>;
  }

  return (
    <section className="card gate-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Poarta principala</p>
          <h2>{status.state}</h2>
        </div>
        <span className={`badge ${ledClass[status.activeLed as keyof typeof ledClass] || "info"}`}>
          LED {status.activeLed}
        </span>
      </div>

      <GateAnimation state={status.state} />

      <div className="status-grid">
        <div>
          <span>Bariera</span>
          <strong>{status.barrier || "—"}</strong>
        </div>
        <div>
          <span>ESP32</span>
          <strong>{status.esp32 || "—"}</strong>
        </div>
        <div>
          <span>Cloud</span>
          <strong>{status.cloud}</strong>
        </div>
      </div>
    </section>
  );
}
