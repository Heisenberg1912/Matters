import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import { useAuth } from "@/context/AuthContext";
import PhoneShell from "@/components/phone-shell";
import { Loader2 } from "lucide-react";

export default function SSOCallback() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded: clerkLoaded } = useClerkAuth();
  const { isAuthenticated, isLoading } = useAuth();
  const [showDebug, setShowDebug] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);

  // Debug: show state after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowDebug(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Timeout: if stuck for 15 seconds, redirect to login
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeoutReached(true);
      console.error("SSO Callback timeout - auth state:", {
        clerkLoaded,
        isSignedIn,
        isAuthenticated,
        isLoading,
      });
    }, 15000);
    return () => clearTimeout(timer);
  }, [clerkLoaded, isSignedIn, isAuthenticated, isLoading]);

  // Once Clerk confirms sign-in AND our auth context is ready, redirect
  useEffect(() => {
    if (clerkLoaded && isSignedIn && !isLoading && isAuthenticated) {
      console.log("SSO complete, redirecting to home");
      navigate("/home", { replace: true });
    }
  }, [clerkLoaded, isSignedIn, isLoading, isAuthenticated, navigate]);

  // If timeout reached and not authenticated, go to login
  if (timeoutReached && !isAuthenticated) {
    return (
      <PhoneShell className="items-center justify-center">
        <div className="text-center p-6 max-w-sm">
          <div className="text-yellow-400 font-medium mb-3">Sign in taking too long</div>
          <p className="text-muted text-sm mb-4">Please try again</p>
          <button
            onClick={() => navigate("/login", { replace: true })}
            className="px-4 py-2 bg-pill text-background rounded-lg"
          >
            Back to Login
          </button>
        </div>
      </PhoneShell>
    );
  }

  return (
    <>
      {/* Clerk's callback handler */}
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/home"
        signUpFallbackRedirectUrl="/home"
      />

      {/* Loading overlay */}
      <PhoneShell className="items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-pill" />
          <p className="text-muted text-sm">Completing sign in...</p>

          {/* Debug info after 5 seconds */}
          {showDebug && (
            <div className="mt-4 p-3 bg-card rounded-lg text-xs text-muted space-y-1">
              <p>Clerk loaded: {clerkLoaded ? "yes" : "no"}</p>
              <p>Clerk signed in: {isSignedIn ? "yes" : "no"}</p>
              <p>Auth loading: {isLoading ? "yes" : "no"}</p>
              <p>Authenticated: {isAuthenticated ? "yes" : "no"}</p>
            </div>
          )}
        </div>
      </PhoneShell>
    </>
  );
}
