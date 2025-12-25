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

  const icon = status === "success" ? <MailCheck className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 text-black" /> : <MailX className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 text-black" />;

  return (
    <PhoneShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-[100dvh] bg-[#010101] flex flex-col items-center justify-center px-4 xs:px-6"
      >
        <div className="max-w-[340px] xs:max-w-sm sm:max-w-md w-full text-center">
          <div className="mx-auto mb-3 xs:mb-4 inline-flex items-center justify-center w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 rounded-xl xs:rounded-2xl bg-[#cfe0ad]">
            {icon}
          </div>
          <h1 className="text-lg xs:text-xl sm:text-2xl font-bold text-white">
            {status === "success" ? "Invitation Accepted" : "Project Invitation"}
          </h1>
          <p className="text-xs xs:text-sm sm:text-base text-neutral-400 mt-1 xs:mt-2">
            {token ? "Confirm your invitation to access the project." : "Invitation token is missing or invalid."}
          </p>

          {!token && (
            <div className="mt-3 xs:mt-4 text-xs xs:text-sm text-red-400">Please check the invitation link and try again.</div>
          )}

          {isAuthenticated && (
            <div className="mt-4 xs:mt-6">
              {status === "loading" && <p className="text-xs xs:text-sm text-neutral-400">Accepting invitation...</p>}
              {(status === "success" || status === "error") && (
                <p className={`text-xs xs:text-sm ${status === "success" ? "text-[#cfe0ad]" : "text-red-400"}`}>
                  {message}
                </p>
              )}
              <div className="mt-3 xs:mt-4">
                <Link to="/home" className="text-[#cfe0ad] text-sm xs:text-base font-medium hover:underline">
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
