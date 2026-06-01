import { useEffect, useMemo, useState } from "react";
import AccessLogTable from "../components/AccessLogTable";
import { getAccessLogs } from "../services/api";

export default function AccessLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [status, setStatus] = useState("Toate");
  const [direction, setDirection] = useState("Toate");
  const [query, setQuery] = useState("");

  useEffect(() => {
    getAccessLogs().then(setLogs);
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesStatus = status === "Toate" || log.status === status;
      const matchesDirection = direction === "Toate" || log.direction === direction;
      const matchesQuery = [log.employeeName, log.department, log.carPlate, log.note]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase());

      return matchesStatus && matchesDirection && matchesQuery;
    });
  }, [direction, logs, query, status]);

  return (
    <div className="page-grid">
      <section className="section-heading page-heading">
        <div>
          <p className="eyebrow">Evenimente acces</p>
          <h2>Loguri intrare si iesire</h2>
        </div>
        <span className="badge info">{filteredLogs.length} loguri</span>
      </section>

      <section className="card">
        <div className="toolbar filters">
          <input
            className="search-input"
            type="search"
            placeholder="Cauta angajat, departament, masina sau observatie"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option>Toate</option>
            <option>Valid</option>
            <option>Refuzat</option>
            <option>Manual</option>
          </select>
          <select value={direction} onChange={(event) => setDirection(event.target.value)}>
            <option>Toate</option>
            <option value="IN">Intrare</option>
            <option value="OUT">Iesire</option>
          </select>
        </div>
        <AccessLogTable logs={filteredLogs} />
      </section>
    </div>
  );
}
