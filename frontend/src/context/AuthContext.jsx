import { createContext, useContext, useMemo, useState } from "react";
import {
  clearSession,
  getStoredToken,
  getStoredUser,
  loginRequest,
} from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => getStoredToken());
  const [authError, setAuthError] = useState("");

  const login = async ({ email, password }) => {
    setAuthError("");

    try {
      const session = await loginRequest({ email, password });
      setUser(session.user);
      setToken(session.token);
      return session;
    } catch (error) {
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
    [authError, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
