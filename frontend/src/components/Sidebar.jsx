import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "D" },
  { to: "/employees", label: "Angajati", icon: "A" },
  { to: "/access-logs", label: "Log acces", icon: "L" },
  { to: "/reports", label: "Rapoarte", icon: "R" },
  { to: "/device-requests", label: "Cereri dispozitiv", icon: "C" },
];

export default function Sidebar() {
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
