import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Mail, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await api.post("/session/forgot-password", { email });
      setIsSuccess(true);
      toast.success("Password reset link sent to your email");
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || "Failed to send reset email";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[100dvh] bg-[#010101] flex flex-col items-center justify-center px-4 py-6 xs:p-6 sm:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[340px] xs:max-w-sm sm:max-w-md text-center"
        >
          <div className="mb-4 xs:mb-6 flex justify-center">
            <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 text-green-400" />
            </div>
          </div>

          <h1 className="text-xl xs:text-2xl font-bold text-white mb-2 xs:mb-3">Check Your Email</h1>
          <p className="text-xs xs:text-sm sm:text-base text-neutral-400 mb-4 xs:mb-6">
            We've sent a password reset link to <span className="text-white font-medium">{email}</span>.
            Please check your inbox and follow the instructions to reset your password.
          </p>

          <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-3 xs:p-4 mb-4 xs:mb-6">
            <p className="text-xs xs:text-sm text-neutral-400">
              Didn't receive the email? Check your spam folder or{" "}
              <button
                onClick={() => setIsSuccess(false)}
                className="text-[#cfe0ad] hover:underline"
              >
                try again
              </button>
              .
            </p>
          </div>

          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 xs:gap-2 text-xs xs:text-sm text-[#cfe0ad] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
            Back to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#010101] flex flex-col items-center justify-center px-4 py-6 xs:p-6 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[340px] xs:max-w-sm sm:max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-4 xs:mb-6 sm:mb-8">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 xs:gap-2 text-xs xs:text-sm text-neutral-400 hover:text-white transition-colors mb-3 xs:mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
            Back to Login
          </Link>
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-white mb-1 xs:mb-2">Forgot Password?</h1>
          <p className="text-xs xs:text-sm sm:text-base text-neutral-400">
            Enter your email and we'll send you a link to reset your password
          </p>
        </div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="space-y-4 xs:space-y-5 sm:space-y-6 bg-neutral-900/30 border border-neutral-800 rounded-xl xs:rounded-2xl p-4 xs:p-5 sm:p-6 md:p-8"
        >
          {error && (
            <div className="p-2.5 xs:p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs xs:text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-xs xs:text-sm font-medium text-neutral-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-2.5 xs:left-3 top-1/2 -translate-y-1/2 w-4 h-4 xs:w-5 xs:h-5 text-neutral-400" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 xs:pl-11 sm:pl-12 pr-3 xs:pr-4 py-2.5 xs:py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-sm xs:text-base text-white placeholder-neutral-500 focus:outline-none focus:border-[#cfe0ad]/50 transition-colors"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email}
            className="w-full py-2.5 xs:py-3 px-4 bg-[#cfe0ad] text-black text-sm xs:text-base font-medium rounded-lg hover:bg-[#bfd09d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 xs:w-5 xs:h-5 animate-spin" />
                <span className="text-sm xs:text-base">Sending...</span>
              </>
            ) : (
              "Send Reset Link"
            )}
          </button>

          <p className="text-center text-xs xs:text-sm text-neutral-400 pt-1">
            Remember your password?{" "}
            <Link to="/login" className="text-[#cfe0ad] hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </motion.form>
      </motion.div>
    </div>
  );
}
