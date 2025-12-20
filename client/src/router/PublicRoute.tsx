import type { ReactNode } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import FullPageLoader from "@/components/full-page-loader";

export default function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [searchParams] = useSearchParams();

  // Allow accessing login page with ?force=true to sign in with different account
  const forceShow = searchParams.get("force") === "true";

  if (isLoading) {
    return <FullPageLoader />;
  }

  // If authenticated and not forcing, redirect to home
  if (isAuthenticated && !forceShow) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
