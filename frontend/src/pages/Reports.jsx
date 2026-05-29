import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getReports } from "../services/api.js";

export default function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState(null);

  useEffect(() => {
    if (user?.role === "SUPERADMIN") {
      getReports().then(setReports).catch(console.error);
    }
  }, [user]);

  if (user?.role !== "SUPERADMIN") {
    return (
      <div className="card" style={{ padding: "40px", textAlign: "center" }}>
        <h2>Restricție Drepturi de Acces</h2>
        <p>Generarea rapoartelor agregate și exportul fișierelor CSV de audit sunt permise doar administratorilor.</p>
      </div>
    );
  }

  const handleExportCSV = () => {
    window.location.href = "http://localhost:5001/api/export-csv";
  };

  if (!reports) {
    return <div className="card">Se incarca datele statistice...</div>;
  }

  const maxMonthly = Math.max(...reports.monthly.map((item) => item.value), 1);

  return (
    <div className="page-grid">
      <section className="section-heading page-heading">
        <div>
          <p className="eyebrow">Rapoarte globale</p>
          <h2>Prezenta si activitate pe departamente</h2>
        </div>
        <button className="ghost-button" type="button" onClick={handleExportCSV}>
          📥 Export CSV Audit
        </button>
      </section>

      <section className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "20px" }}>
        <div className="metric-card">
          <span>Angajati</span>
          <strong>{reports.totals?.employees || 0}</strong>
          <small>Total in evidenta</small>
        </div>
        <div className="metric-card">
          <span>Prezenti</span>
          <strong>{reports.totals?.present || 0}</strong>
          <small>Acces valid astazi</small>
        </div>
        <div className="metric-card">
          <span>Refuzuri</span>
          <strong>{reports.totals?.denied || 0}</strong>
          <small>Sesiuni blocate</small>
        </div>
        <div className="metric-card">
          <span>Manual</span>
          <strong>{reports.totals?.manual || 0}</strong>
          <small>Interventii operator</small>
        </div>
      </section>

      <section className="report-layout" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div className="card">
          <div className="section-heading">
            <h2>Prezenta cumulata lunară</h2>
          </div>
          <div className="bar-chart" style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end", height: "200px", paddingTop: "20px" }}>
            {reports.monthly?.map((item) => (
              <div className="bar-item" key={item.label} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div className="bar-track" style={{ height: "140px", width: "30px", backgroundColor: "#f3f4f6", borderRadius: "4px", position: "relative" }}>
                  <span style={{ height: `${(item.value / maxMonthly) * 100}%`, width: "100%", backgroundColor: "#2563eb", position: "absolute", bottom: 0, borderRadius: "4px" }} />
                </div>
                <strong style={{ fontSize: "12px", marginTop: "8px" }}>{item.label}</strong>
                <small>{item.value}%</small>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-heading">
            <h2>Statistici pe departamente</h2>
          </div>
          <div className="department-list" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {reports.byDepartment?.map((item) => (
              <div className="department-row" key={item.department} style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid #f3f4f6" }}>
                <div>
                  <strong style={{ display: "block" }}>{item.department}</strong>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>{item.entries} accesari efectuate</span>
                </div>
                <span className={`badge ${item.denied > 0 ? "danger" : "success"}`}>
                  {item.denied} refuzuri
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}