import { useEffect, useState } from "react";
import { getDeviceChangeRequests, resolveDeviceChangeRequest } from "../services/api.js";

export default function DeviceRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await getDeviceChangeRequests();
      setRequests(data);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (requestId, status) => {
    setResolving(requestId);
    try {
      await resolveDeviceChangeRequest(requestId, status);
      setRequests((current) => current.filter((r) => r.request_id !== requestId));
    } finally {
      setResolving(null);
    }
  };

  return (
    <div className="page-grid">
      <section className="section-heading page-heading">
        <div>
          <p className="eyebrow">HR</p>
          <h2>Cereri schimbare dispozitiv</h2>
        </div>
        <span className="badge info">{requests.length} pending</span>
      </section>

      <section className="card">
        {loading ? (
          <p style={{ color: "var(--muted)", padding: "1rem" }}>Se încarcă...</p>
        ) : requests.length === 0 ? (
          <p style={{ color: "var(--muted)", padding: "1rem" }}>
            Nu există cereri în așteptare.
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Angajat</th>
                <th>Legitimație</th>
                <th>Dispozitiv vechi</th>
                <th>Dispozitiv nou</th>
                <th>Platformă</th>
                <th>Data cererii</th>
                <th>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.request_id}>
                  <td>{req.first_name} {req.last_name}</td>
                  <td>{req.badge_code || "-"}</td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--muted)" }}>
                    {req.old_device_identifier?.slice(0, 20)}...
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--muted)" }}>
                    {req.new_device_identifier?.slice(0, 20)}...
                  </td>
                  <td>{req.new_platform}</td>
                  <td>{new Date(req.requested_at).toLocaleString("ro-RO")}</td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        className="primary-button"
                        style={{ padding: "0.3rem 0.8rem", fontSize: "0.85rem" }}
                        disabled={resolving === req.request_id}
                        onClick={() => handleResolve(req.request_id, "approved")}
                      >
                        Aprobă
                      </button>
                      <button
                        className="ghost-button"
                        style={{ padding: "0.3rem 0.8rem", fontSize: "0.85rem", color: "var(--danger)", borderColor: "var(--danger)" }}
                        disabled={resolving === req.request_id}
                        onClick={() => handleResolve(req.request_id, "rejected")}
                      >
                        Respinge
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
