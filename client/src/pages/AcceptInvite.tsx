import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import PhoneShell from "@/components/phone-shell";
import { projectsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { MailCheck, MailX } from "lucide-react";

type Status = "idle" | "loading" | "success" | "error";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const { isAuthenticated, isLoading } = useAuth();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const acceptInvite = async () => {
      if (!token || !isAuthenticated || isLoading) {
        return;
      }

      setStatus("loading");
      try {
        const response = await projectsApi.acceptInvite(token);
        if (response.success) {
          setStatus("success");
          setMessage("Invitation accepted. You now have access to the project.");
        } else {
          setStatus("error");
          setMessage(response.error || "Failed to accept invitation.");
        }
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Failed to accept invitation.");
      }
    };

    acceptInvite();
  }, [isAuthenticated, isLoading, token]);

  const icon = status === "success" ? <MailCheck className="w-8 h-8 text-white" /> : <MailX className="w-8 h-8 text-white" />;

  return (
    <PhoneShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center px-6"
      >
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-4 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600">
            {icon}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {status === "success" ? "Invitation Accepted" : "Project Invitation"}
          </h1>
          <p className="text-gray-600 mt-2">
            {token ? "Confirm your invitation to access the project." : "Invitation token is missing or invalid."}
          </p>

          {!token && (
            <div className="mt-4 text-sm text-red-600">Please check the invitation link and try again.</div>
          )}

          {isAuthenticated && (
            <div className="mt-6">
              {status === "loading" && <p className="text-sm text-gray-600">Accepting invitation...</p>}
              {(status === "success" || status === "error") && (
                <p className={`text-sm ${status === "success" ? "text-emerald-600" : "text-red-600"}`}>
                  {message}
                </p>
              )}
              <div className="mt-4">
                <Link to="/home" className="text-blue-600 font-medium hover:underline">
                  Go to Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </PhoneShell>
  );
}
