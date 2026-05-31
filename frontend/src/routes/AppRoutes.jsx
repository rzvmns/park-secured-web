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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppShell>{children}</AppShell>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoute>
            <Employees />
          </ProtectedRoute>
        }
      />
      <Route
        path="/access-logs"
        element={
          <ProtectedRoute>
            <AccessLogs />
          </ProtectedRoute>
        }
      />
      <Route path=\"/reports\" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path=\"/device-requests\" element={<ProtectedRoute><DeviceRequests /></ProtectedRoute>} />
      <Route path=\"*\" element={<Navigate to=\"/dashboard\" replace />} />
    </Routes>
  );
}
