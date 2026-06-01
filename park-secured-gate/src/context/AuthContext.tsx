import { createContext, useContext, useMemo, useState } from "react";
import {
  clearSession,
  getStoredToken,
  getStoredUser,
  loginRequest,
} from "../services/api";

interface User {
  name: string;
  role: string;
  email?: string;
  divisionId?: number | null;
  employeeId?: number | null;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  authError: string;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [authError, setAuthError] = useState("");

  const login = async ({ email, password }: { email: string; password: string }) => {
    setAuthError("");
    try {
      const session = await loginRequest({ email, password });
      setUser(session.user);
      setToken(session.token);
      return session;
    } catch (error: any) {
      setAuthError(error.message || "Autentificarea a esuat");
      throw error;
    }
  };

  const logout = () => {
    clearSession();
    setUser(null);
    setToken(null);
    setAuthError("");
  };

  const value = useMemo(
    () => ({
      user,
      token,
      authError,
      isAuthenticated: Boolean(user && token),
      login,
      logout,
    }),
    [authError, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
