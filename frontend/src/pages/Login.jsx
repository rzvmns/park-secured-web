import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { authError, isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("admin@parksecure.local");
  const [password, setPassword] = useState("admin123");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const accessDenied = searchParams.get("err") === "no-access";

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate("/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="brand large">
          <div className="brand-mark">PS</div>
          <div>
            <strong>ParkSecure</strong>
            <span>Administrare acces</span>
          </div>
        </div>
        <div>
          <p className="eyebrow">Autentificare</p>
          <h1>Acces rapid la panoul de monitorizare</h1>
        </div>
        <form className="form-stack" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Parola
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <button className="primary-button" type="submit">
            {isSubmitting ? "Se conecteaza..." : "Intra in aplicatie"}
          </button>
          {authError && <p className="inline-feedback danger-text">{authError}</p>}
          {accessDenied && !authError && (
            <p className="inline-feedback danger-text">
              Acest cont nu are acces la interfața web. Folosiți aplicația desktop (portar) sau aplicația mobilă.
            </p>
          )}
        </form>
      </section>
      <section className="login-aside">
        <div className="metric-card">
          <span>Poarta</span>
          <strong>Inchisa</strong>
          <small>Sistem conectat la ESP32 si cloud</small>
        </div>
        <div className="metric-card">
          <span>Roluri</span>
          <strong>Portar · Admin · Manager</strong>
          <small>Interfata pregatita pentru autorizare pe roluri</small>
        </div>
      </section>
    </main>
  );
}
