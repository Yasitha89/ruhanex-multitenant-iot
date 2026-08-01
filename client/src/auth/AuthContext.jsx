import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
} from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const loadSession = useCallback(async () => {
    try {
      const result = await getCurrentUser();
      setUser(result.user);
      setTenant(result.tenant);
    } catch (error) {
      if (error.status !== 401) {
        console.error("Session check failed:", error);
      }
      setUser(null);
      setTenant(null);
    } finally {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const login = useCallback(async (credentials) => {
    const result = await loginUser(credentials);
    setUser(result.user);
    setTenant(result.tenant);
    return result;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
      setTenant(null);
    }
  }, []);

  const hasRole = useCallback(
    (...roles) => Boolean(user && roles.includes(user.role)),
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      tenant,
      initializing,
      isAuthenticated: Boolean(user && tenant),
      login,
      logout,
      refreshSession: loadSession,
      hasRole,
    }),
    [user, tenant, initializing, login, logout, loadSession, hasRole]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
