import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";
import { useAuth } from "@/context/AuthContext";
import PhoneShell from "@/components/phone-shell";
import { Loader2 } from "lucide-react";

export default function SSOCallback() {
  const navigate = useNavigate();
  const { handleRedirectCallback } = useClerk();
  const { isAuthenticated, isLoading, error } = useAuth();
  const [callbackError, setCallbackError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  // Handle the OAuth callback
  useEffect(() => {
    const processCallback = async () => {
      try {
        // Let Clerk process the OAuth callback
        await handleRedirectCallback({
          signInFallbackRedirectUrl: "/home",
          signUpFallbackRedirectUrl: "/home",
        });
      } catch (err) {
        console.error("OAuth callback error:", err);
        setCallbackError(err instanceof Error ? err.message : "Authentication failed");
      } finally {
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [handleRedirectCallback]);

  // Redirect once authenticated
  useEffect(() => {
    if (isProcessing) return;
    if (isLoading) return;

    if (isAuthenticated) {
      navigate("/home", { replace: true });
    } else if (callbackError || error) {
      // Give a moment to show the error, then redirect
      const timer = setTimeout(() => {
        navigate("/login", { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, isProcessing, callbackError, error, navigate]);

  // Show error if any
  const displayError = callbackError || error;
  if (displayError && !isProcessing) {
    return (
      <PhoneShell className="items-center justify-center">
        <div className="text-center p-6 max-w-sm">
          <div className="text-red-400 font-medium mb-3">Sign in failed</div>
          <p className="text-muted text-sm mb-4">{displayError}</p>
          <p className="text-muted/60 text-xs">Redirecting to login...</p>
        </div>
      </PhoneShell>
    );
  }

  // Loading state
  return (
    <PhoneShell className="items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-pill" />
        <p className="text-muted text-sm">
          {isProcessing ? "Processing sign in..." : "Completing sign in..."}
        </p>
      </div>
    </PhoneShell>
  );
}
