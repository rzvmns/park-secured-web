import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const formatter = new Intl.DateTimeFormat("ro-RO", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Monitorizare acces</p>
        <h1>Panou operational poarta</h1>
      </div>
      <div className="topbar-actions">
        <span className="date-pill">{formatter.format(new Date())}</span>
        <div className="user-chip">
          <span className="avatar">{user?.name?.slice(0, 1) || "U"}</span>
          <div>
            <strong>{user?.name}</strong>
            <span>{user?.role}</span>
          </div>
        </div>
        <button className="ghost-button" type="button" onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
}
