const ledClass = {
  Galben: "warning",
  Verde: "success",
  Rosu: "danger",
  Albastru: "info",
};

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

      <div className="gate-visual" aria-label={`Poarta este ${status.state}`}>
        <div className="gate-track">
          <span />
          <span />
        </div>
        <div className="gate-door" />
      </div>

      <div className="status-grid">
        <div>
          <span>Bariera</span>
          <strong>{status.barrier}</strong>
        </div>
        <div>
          <span>ESP32</span>
          <strong>{status.esp32}</strong>
        </div>
        <div>
          <span>Cloud</span>
          <strong>{status.cloud}</strong>
        </div>
      </div>
    </section>
  );
}
