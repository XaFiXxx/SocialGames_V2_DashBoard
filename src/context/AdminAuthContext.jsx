import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const AdminAuthContext = createContext(null);
const ADMIN_SESSION_KEY = "admin_dashboard_access";

function isAdminUser(user) {
  return user?.is_admin === true || user?.is_admin === 1 || user?.is_admin === "1";
}

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdminSession, setIsAdminSession] = useState(
    sessionStorage.getItem(ADMIN_SESSION_KEY) === "true"
  );

  const refreshUser = async () => {
    try {
      const response = await api.get("/api/user");
      const currentUser = response.data;

      setUser(currentUser);
      return currentUser;
    } catch (error) {
      if (error.response?.status === 401) {
        setUser(null);
        setIsAdminSession(false);
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
      } else {
        console.error("Erreur refreshUser admin :", error);
      }

      return null;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      await refreshUser();
      setAuthLoading(false);
    };

    initAuth();
  }, []);

  const login = async (payload) => {
    await api.get("/sanctum/csrf-cookie");

    const response = await api.post("/login", payload);
    const loggedUser = response.data?.user ?? null;

    if (!loggedUser) {
      setUser(null);
      setIsAdminSession(false);
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      throw new Error("Impossible de récupérer l'utilisateur connecté.");
    }

    if (!isAdminUser(loggedUser)) {
      try {
        await api.post("/logout");
      } catch (error) {
        console.error("Erreur logout après refus admin :", error);
      }

      setUser(null);
      setIsAdminSession(false);
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      throw new Error("Accès réservé aux administrateurs.");
    }

    setUser(loggedUser);
    setIsAdminSession(true);
    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");

    return response.data;
  };

  const logout = async () => {
    try {
      await api.post("/logout");
    } finally {
      setUser(null);
      setIsAdminSession(false);
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }
  };

  const value = useMemo(
    () => ({
      user,
      setUser,
      authLoading,
      isAuthenticated: !!user,
      isAdminSession,
      login,
      logout,
      refreshUser,
    }),
    [user, authLoading, isAdminSession]
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }

  return context;
}