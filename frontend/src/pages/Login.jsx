import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@parksecured.ro");
  const [password, setPassword] = useState("parksecured");

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    login({ email, password });
    navigate("/dashboard");
  };

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="brand large">
          <div className="brand-mark">PS</div>
          <div>
            <strong>ParkSecured</strong>
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
            Intra in aplicatie
          </button>
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
