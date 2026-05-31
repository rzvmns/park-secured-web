import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const allNavItems = [
  { to: "/dashboard", label: "Dashboard", icon: "D", roles: ["admin", "hr", "division_manager", "operator", "viewer"] },
  { to: "/employees", label: "Angajati", icon: "A", roles: ["admin", "hr", "division_manager"] },
  { to: "/access-logs", label: "Log acces", icon: "L", roles: ["admin", "division_manager", "operator", "viewer"] },
  { to: "/reports", label: "Rapoarte", icon: "R", roles: ["admin"] },
  { to: "/device-requests", label: "Cereri dispozitiv", icon: "C", roles: ["admin", "hr"] },
];

export default function Sidebar() {
  const { user } = useAuth();
  const role = user?.role;

  const navItems = allNavItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">PS</div>
        <div>
          <strong>ParkSecured</strong>
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
