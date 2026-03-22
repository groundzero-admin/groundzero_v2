import { Navigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/api/types";

interface RequireAuthProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return null; // brief blank while checking refresh token on mount
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Wrong role — send them to their own home
    const redirect = user.role === "teacher" ? "/teacher" : user.role === "admin" ? "/admin" : "/dashboard";
    return <Navigate to={redirect} replace />;
  }

  return <>{children}</>;
}
