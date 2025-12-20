import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import FullPageLoader from "@/components/full-page-loader";
import { guestSession } from "@/lib/guest-session";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const isGuest = guestSession.isEnabled();

  // Guest mode doesn't require Clerk - allow access immediately
  if (isGuest) {
    return <>{children}</>;
  }

  // Only show loading for authenticated users (not guests)
  if (isLoading) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
