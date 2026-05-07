import { useEffect, useState } from "react";
import { getReports } from "../services/api.js";

export default function Reports() {
  const [reports, setReports] = useState(null);

  useEffect(() => {
    getReports().then(setReports);
  }, []);

  if (!reports) {
    return <div className="card skeleton-card">Se incarca rapoartele...</div>;
  }

  const maxMonthly = Math.max(...reports.monthly.map((item) => item.value));

  return (
    <div className="page-grid">
      <section className="section-heading page-heading">
        <div>
          <p className="eyebrow">Rapoarte</p>
          <h2>Prezenta si activitate pe departamente</h2>
        </div>
        <button className="ghost-button" type="button">
          Export CSV
        </button>
      </section>

      <section className="metrics-grid">
        <div className="metric-card">
          <span>Angajati</span>
          <strong>{reports.totals.employees}</strong>
          <small>Total in evidenta</small>
        </div>
        <div className="metric-card">
          <span>Prezenti</span>
          <strong>{reports.totals.present}</strong>
          <small>Acces valid astazi</small>
        </div>
        <div className="metric-card">
          <span>Refuzuri</span>
          <strong>{reports.totals.denied}</strong>
          <small>Cod invalid sau orar depasit</small>
        </div>
        <div className="metric-card">
          <span>Manual</span>
          <strong>{reports.totals.manual}</strong>
          <small>Interventii operator</small>
        </div>
      </section>

      <section className="report-layout">
        <div className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Lunar</p>
              <h2>Prezenta cumulata</h2>
            </div>
          </div>
          <div className="bar-chart">
            {reports.monthly.map((item) => (
              <div className="bar-item" key={item.label}>
                <div className="bar-track">
                  <span style={{ height: `${(item.value / maxMonthly) * 100}%` }} />
                </div>
                <strong>{item.label}</strong>
                <small>{item.value}%</small>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Departamente</p>
              <h2>Acces valid si refuzat</h2>
            </div>
          </div>
          <div className="department-list">
            {reports.byDepartment.map((item) => (
              <div className="department-row" key={item.department}>
                <div>
                  <strong>{item.department}</strong>
                  <span>{item.entries} accesari</span>
                </div>
                <span className={item.denied ? "badge danger" : "badge success"}>
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
