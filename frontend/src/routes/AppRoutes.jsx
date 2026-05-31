import { Navigate, Route, Routes } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import AccessLogs from "../pages/AccessLogs.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Employees from "../pages/Employees.jsx";
import Login from "../pages/Login.jsx";
import Reports from "../pages/Reports.jsx";
import DeviceRequests from "../pages/DeviceRequests.jsx";

function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <Navbar />
        <div className="page-container">{children}</div>
      </main>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppShell>{children}</AppShell>;
}

function RoleRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!roles.includes(user?.role)) return <Navigate to={defaultRoute(user?.role)} replace />;
  return <AppShell>{children}</AppShell>;
}

function defaultRoute(role) {
  if (role === "admin" || role === "operator") return "/dashboard";
  if (role === "division_manager") return "/reports";
  return "/access-logs";
}

function RoleRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={defaultRoute(user?.role)} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<RoleRoute roles={["admin", "operator"]}><Dashboard /></RoleRoute>} />
      <Route path="/employees" element={<RoleRoute roles={["admin", "hr", "division_manager"]}><Employees /></RoleRoute>} />
      <Route path="/access-logs" element={<RoleRoute roles={["admin", "hr", "operator", "viewer"]}><AccessLogs /></RoleRoute>} />
      <Route path="/reports" element={<RoleRoute roles={["admin", "division_manager"]}><Reports /></RoleRoute>} />
      <Route path="/device-requests" element={<RoleRoute roles={["admin", "hr"]}><DeviceRequests /></RoleRoute>} />
      <Route path="*" element={<RoleRedirect />} />
    </Routes>
  );
}
