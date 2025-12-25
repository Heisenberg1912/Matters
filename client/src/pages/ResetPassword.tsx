import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setIsVerifying(false);
      setIsValidToken(false);
      return;
    }

    const verifyToken = async () => {
      try {
        await api.get(`/session/verify-reset-token?token=${token}`);
        setIsValidToken(true);
      } catch (err: any) {
        setIsValidToken(false);
        const errorMessage = err?.response?.data?.error || "Invalid or expired reset link";
        setError(errorMessage);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/session/reset-password", {
        token,
        password,
      });
      setIsSuccess(true);
      toast.success("Password reset successfully!");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || "Failed to reset password";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-[100dvh] bg-[#010101] flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-6 h-6 xs:w-8 xs:h-8 animate-spin text-[#cfe0ad] mx-auto mb-3 xs:mb-4" />
          <p className="text-xs xs:text-sm sm:text-base text-neutral-400">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!token || !isValidToken) {
    return (
      <div className="min-h-[100dvh] bg-[#010101] flex flex-col items-center justify-center px-4 py-6 xs:p-6 sm:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[340px] xs:max-w-sm sm:max-w-md text-center"
        >
          <div className="mb-4 xs:mb-6 flex justify-center">
            <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 text-red-400" />
            </div>
          </div>

          <h1 className="text-xl xs:text-2xl font-bold text-white mb-2 xs:mb-3">Invalid Reset Link</h1>
          <p className="text-xs xs:text-sm sm:text-base text-neutral-400 mb-4 xs:mb-6">
            {error || "Invalid or expired reset link"}
          </p>
          <p className="text-neutral-500 text-[0.7rem] xs:text-xs sm:text-sm mb-4 xs:mb-6">
            This can happen if the link has expired (valid for 1 hour), was already used, or is incorrect.
          </p>

          <div className="flex flex-col gap-2 xs:gap-3">
            <Link
              to="/forgot-password"
              className="w-full py-2.5 xs:py-3 px-4 bg-[#cfe0ad] text-black text-sm xs:text-base font-medium rounded-lg hover:bg-[#bfd09d] transition-colors min-h-[44px] flex items-center justify-center"
            >
              Request New Reset Link
            </Link>
            <Link
              to="/login"
              className="text-xs xs:text-sm text-neutral-400 hover:text-white transition-colors py-2"
            >
              Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

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

          <h1 className="text-xl xs:text-2xl font-bold text-white mb-2 xs:mb-3">Password Reset Successful!</h1>
          <p className="text-xs xs:text-sm sm:text-base text-neutral-400 mb-4 xs:mb-6">
            Your password has been reset successfully. You can now log in with your new password.
          </p>

          <p className="text-[0.7rem] xs:text-xs sm:text-sm text-neutral-500">
            Redirecting to login page in 3 seconds...
          </p>

          <Link
            to="/login"
            className="inline-block mt-3 xs:mt-4 text-xs xs:text-sm text-[#cfe0ad] hover:underline"
          >
            Go to Login Now
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
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-white mb-1 xs:mb-2">Reset Your Password</h1>
          <p className="text-xs xs:text-sm sm:text-base text-neutral-400">Enter your new password below</p>
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
            <label htmlFor="password" className="block text-xs xs:text-sm font-medium text-neutral-300 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-sm xs:text-base text-white placeholder-neutral-500 focus:outline-none focus:border-[#cfe0ad]/50 transition-colors pr-11 xs:pr-12"
                placeholder="Min. 8 characters"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 xs:right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4 xs:w-5 xs:h-5" /> : <Eye className="w-4 h-4 xs:w-5 xs:h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-xs xs:text-sm font-medium text-neutral-300 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-sm xs:text-base text-white placeholder-neutral-500 focus:outline-none focus:border-[#cfe0ad]/50 transition-colors pr-11 xs:pr-12"
                placeholder="Re-enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 xs:right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors p-1"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4 xs:w-5 xs:h-5" /> : <Eye className="w-4 h-4 xs:w-5 xs:h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !password || !confirmPassword}
            className="w-full py-2.5 xs:py-3 px-4 bg-[#cfe0ad] text-black text-sm xs:text-base font-medium rounded-lg hover:bg-[#bfd09d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 xs:w-5 xs:h-5 animate-spin" />
                <span className="text-sm xs:text-base">Resetting Password...</span>
              </>
            ) : (
              "Reset Password"
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
