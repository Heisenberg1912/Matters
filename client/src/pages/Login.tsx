import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: authLoading, error: authError, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on role
      if (user.role === "contractor") {
        navigate("/contractor/dashboard", { replace: true });
      } else if (user.role === "admin" || user.role === "superadmin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#010101] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#cfe0ad]" />
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
        {/* Logo/Header */}
        <div className="text-center mb-6 xs:mb-8">
          <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold text-white mb-1 xs:mb-2">Matters</h1>
          <p className="text-xs xs:text-sm sm:text-base text-neutral-400">Construction Management Dashboard</p>
        </div>

        {/* Login Form */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="space-y-3 xs:space-y-4"
        >
          {(error || authError) && (
            <div className="p-2.5 xs:p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs xs:text-sm">
              {error || authError}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-xs xs:text-sm font-medium text-neutral-300 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-sm xs:text-base text-white placeholder-neutral-500 focus:outline-none focus:border-[#cfe0ad]/50 transition-colors"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs xs:text-sm font-medium text-neutral-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-sm xs:text-base text-white placeholder-neutral-500 focus:outline-none focus:border-[#cfe0ad]/50 transition-colors pr-11 xs:pr-12"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 xs:right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors p-1 touch-target"
              >
                {showPassword ? <EyeOff className="w-4 h-4 xs:w-5 xs:h-5" /> : <Eye className="w-4 h-4 xs:w-5 xs:h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Link
              to="/forgot-password"
              className="text-xs xs:text-sm text-neutral-400 hover:text-[#cfe0ad] transition-colors py-1"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full py-2.5 xs:py-3 px-4 bg-[#cfe0ad] text-black text-sm xs:text-base font-medium rounded-lg hover:bg-[#bfd09d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 xs:w-5 xs:h-5 animate-spin" />
                <span className="text-sm xs:text-base">Logging in...</span>
              </>
            ) : (
              "Login"
            )}
          </button>

          <p className="text-center text-xs xs:text-sm text-neutral-400 pt-2">
            Don't have an account?{" "}
            <Link to="/register" className="text-[#cfe0ad] hover:underline font-medium">
              Create Account
            </Link>
          </p>
        </motion.form>
      </motion.div>
    </div>
  );
}
