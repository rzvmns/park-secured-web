import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const allNavItems = [
  { to: "/dashboard", label: "Dashboard", icon: "D", roles: ["operator", "admin"] },
  { to: "/access-logs", label: "Log acces", icon: "L", roles: ["operator", "admin"] },
];

export default function Sidebar() {
  const { user } = useAuth();
  const role = user?.role;

  const navItems = allNavItems.filter((item) => item.roles.includes(role ?? ""));

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">PS</div>
        <div>
          <strong>ParkSecure</strong>
          <span>Access Control</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Navigare principala">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className="nav-link">
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-status">
        <span className="status-dot online" />
        Sistem sincronizat
      </div>
    </aside>
  );
}
