import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import Dashboard from "../pages/Dashboard";
import AccessLogs from "../pages/AccessLogs";
import Login from "../pages/Login";

function AppShell({ children }: { children: React.ReactNode }) {
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

const GATE_ROLES = ["operator", "admin"];

function OperatorRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, logout } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!GATE_ROLES.includes(user?.role ?? "")) {
    logout();
    return <Navigate to="/login?err=no-access" replace />;
  }
  return <AppShell>{children}</AppShell>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<OperatorRoute><Dashboard /></OperatorRoute>} />
      <Route path="/access-logs" element={<OperatorRoute><AccessLogs /></OperatorRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
