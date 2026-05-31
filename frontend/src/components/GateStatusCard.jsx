const ledClass = {
  Galben: "warning",
  Verde: "success",
  Rosu: "danger",
  Albastru: "info",
};

function GateAnimation({ state }) {
  const isOpen = state === "Deschisa";
  const isOpening = state === "In curs de deschidere";
  const isClosing = state === "In curs de inchidere";
  const isMoving = isOpening || isClosing;

  const doorStyle = {
    height: "12px",
    margin: "-68px 38px 0",
    borderRadius: "5px",
    background: isOpen ? "#0f8a5f" : isMoving ? "#b7791f" : "#263445",
    transition: "width 0.6s ease, background 0.4s ease",
    width: isOpen ? "8px" : isMoving ? "40%" : "calc(100% - 76px)",
  };

  const visualStyle = {
    display: "grid",
    alignItems: "center",
    minHeight: "160px",
    margin: "22px 0",
    borderRadius: "8px",
    background: isOpen
      ? "linear-gradient(90deg, transparent 0 48%, rgba(15,138,95,0.12) 48% 52%, transparent 52%), #f0fdf4"
      : isMoving
      ? "linear-gradient(90deg, transparent 0 48%, rgba(183,121,31,0.12) 48% 52%, transparent 52%), #fffbeb"
      : "linear-gradient(90deg, transparent 0 48%, rgba(21,32,45,0.06) 48% 52%, transparent 52%), #f7f9fb",
    transition: "background 0.4s ease",
  };

  return (
    <div style={visualStyle} aria-label={`Poarta este ${state}`}>
      <div className="gate-track">
        <span />
        <span />
      </div>
      <div style={doorStyle} />
      <div style={{ textAlign: "center", fontSize: "12px", color: isOpen ? "#0f8a5f" : isMoving ? "#b7791f" : "#66758a", fontWeight: "600", marginTop: "8px" }}>
        {isOpen ? "⬛ DESCHISĂ" : isMoving ? "⏳ " + state.toUpperCase() : "▬ ÎNCHISĂ"}
      </div>
    </div>
  );
}

export default function GateStatusCard({ status }) {
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
        <span className={`badge ${ledClass[status.activeLed] || "info"}`}>
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
