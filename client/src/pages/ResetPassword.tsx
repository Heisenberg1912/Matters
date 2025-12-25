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
      <div className="min-h-screen bg-[#010101] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#cfe0ad] mx-auto mb-4" />
          <p className="text-neutral-400">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!token || !isValidToken) {
    return (
      <div className="min-h-screen bg-[#010101] flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">Invalid Reset Link</h1>
          <p className="text-neutral-400 mb-6">
            {error || "Invalid or expired reset link"}
          </p>
          <p className="text-neutral-500 text-sm mb-6">
            This can happen if the link has expired (valid for 1 hour), was already used, or is incorrect.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              to="/forgot-password"
              className="w-full py-3 px-4 bg-[#cfe0ad] text-black font-medium rounded-lg hover:bg-[#bfd09d] transition-colors"
            >
              Request New Reset Link
            </Link>
            <Link
              to="/login"
              className="text-neutral-400 hover:text-white transition-colors"
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
      <div className="min-h-screen bg-[#010101] flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">Password Reset Successful!</h1>
          <p className="text-neutral-400 mb-6">
            Your password has been reset successfully. You can now log in with your new password.
          </p>

          <p className="text-sm text-neutral-500">
            Redirecting to login page in 3 seconds...
          </p>

          <Link
            to="/login"
            className="inline-block mt-4 text-[#cfe0ad] hover:underline"
          >
            Go to Login Now
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#010101] flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Reset Your Password</h1>
          <p className="text-neutral-400">Enter your new password below</p>
        </div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="space-y-6 bg-neutral-900/30 border border-neutral-800 rounded-2xl p-8"
        >
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-300 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-[#cfe0ad]/50 transition-colors pr-12"
                placeholder="Min. 8 characters"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-300 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-[#cfe0ad]/50 transition-colors pr-12"
                placeholder="Re-enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !password || !confirmPassword}
            className="w-full py-3 px-4 bg-[#cfe0ad] text-black font-medium rounded-lg hover:bg-[#bfd09d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Resetting Password...
              </>
            ) : (
              "Reset Password"
            )}
          </button>

          <p className="text-center text-sm text-neutral-400">
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
