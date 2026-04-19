import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function AdminRoute() {
  const { user, authLoading, isAdminSession } = useAdminAuth();

  if (authLoading) {
    return <div className="p-6">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdminSession) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}