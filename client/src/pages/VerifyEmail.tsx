import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PhoneShell from "@/components/phone-shell";
import { MailCheck } from "lucide-react";

export default function VerifyEmail() {
  const message = "Email verification is handled during sign up. Enter the code sent to your inbox to finish.";

  return (
    <PhoneShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center px-6"
      >
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-4 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600">
            <MailCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Email Verification
          </h1>
          <p className="text-gray-600 mt-2">
            {message}
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
