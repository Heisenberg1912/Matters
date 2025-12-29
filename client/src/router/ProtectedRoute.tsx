import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

type AuthRole = "user" | "contractor" | "admin" | "superadmin";

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: AuthRole[];
}

const getDefaultRoute = (role: AuthRole) => {
  if (role === "contractor") return "/contractor/dashboard";
  if (role === "admin" || role === "superadmin") return "/admin/dashboard";
  return "/home";
};

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, isAuthenticated, hasRole, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#010101] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#cfe0ad]" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Check role-based access
  const currentRole = (user?.role || "user") as AuthRole;
  if (roles && roles.length > 0 && !hasRole(roles)) {
    return <Navigate to={getDefaultRoute(currentRole)} replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
