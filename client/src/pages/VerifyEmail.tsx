import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import PhoneShell from "@/components/phone-shell";
import { authApi } from "@/lib/api";
import { MailCheck, MailX } from "lucide-react";

type Status = "loading" | "success" | "error";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing or invalid.");
        return;
      }

      try {
        const response = await authApi.verifyEmail(token);
        if (response.success) {
          setStatus("success");
          setMessage("Email verified successfully. You can now sign in.");
        } else {
          setStatus("error");
          setMessage(response.error || "Email verification failed.");
        }
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Email verification failed.");
      }
    };

    verify();
  }, [token]);

  return (
    <PhoneShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center px-6"
      >
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-4 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600">
            {status === "success" ? (
              <MailCheck className="w-8 h-8 text-white" />
            ) : (
              <MailX className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {status === "success" ? "Email Verified" : status === "error" ? "Verification Failed" : "Verifying Email"}
          </h1>
          <p className="text-gray-600 mt-2">
            {status === "loading" ? "Please wait while we verify your email." : message}
          </p>
          <div className="mt-6">
            <Link to="/login" className="text-blue-600 font-medium hover:underline">
              Go to Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </PhoneShell>
  );
}
