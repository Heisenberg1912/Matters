import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, Building2, LogIn, Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const {
    login,
    isAuthenticated,
    isLoading: authLoading,
    error: authError,
    user,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate("/login-success", { replace: true });
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
      <div className="min-h-[100dvh] bg-[#010101] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-[#cfe0ad]/20 border-t-[#cfe0ad] animate-spin" />
            <div className="absolute inset-0 w-12 h-12 rounded-full bg-[#cfe0ad]/10 animate-pulse" />
          </div>
          <span className="text-neutral-400 text-sm">Loading...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#010101] flex flex-col items-center justify-center px-4 py-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary gradient orb */}
        <motion.div
          className="absolute -top-[30%] -left-[20%] w-[70%] h-[70%] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(207, 224, 173, 0.08) 0%, transparent 70%)",
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: [0, 20, 0],
            y: [0, -10, 0],
          }}
          transition={{
            opacity: { duration: 1 },
            scale: { duration: 1 },
            x: { duration: 8, repeat: Infinity, ease: "easeInOut" },
            y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
          }}
        />

        {/* Secondary gradient orb */}
        <motion.div
          className="absolute -bottom-[30%] -right-[20%] w-[70%] h-[70%] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(207, 224, 173, 0.06) 0%, transparent 70%)",
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: [0, -15, 0],
            y: [0, 15, 0],
          }}
          transition={{
            opacity: { duration: 1, delay: 0.3 },
            scale: { duration: 1, delay: 0.3 },
            x: { duration: 7, repeat: Infinity, ease: "easeInOut" },
            y: { duration: 9, repeat: Infinity, ease: "easeInOut" },
          }}
        />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(#cfe0ad 1px, transparent 1px), linear-gradient(90deg, #cfe0ad 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[#cfe0ad]/30"
            initial={{
              x: `${20 + i * 15}%`,
              y: "110%",
            }}
            animate={{
              y: "-10%",
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.8,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[340px] xs:max-w-[380px] sm:max-w-[420px] mx-auto"
      >
        {/* Logo/Header */}
        <motion.div
          className="text-center mb-8 xs:mb-10 sm:mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          {/* Logo icon with glow effect */}
          <motion.div
            className="relative inline-flex items-center justify-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.2,
            }}
          >
            {/* Glow ring */}
            <motion.div
              className="absolute inset-0 w-16 h-16 xs:w-18 xs:h-18 sm:w-20 sm:h-20 rounded-2xl"
              style={{
                background: "linear-gradient(135deg, #cfe0ad, #a8c878)",
                filter: "blur(15px)",
                opacity: 0.4,
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <div className="relative w-16 h-16 xs:w-18 xs:h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#cfe0ad] to-[#a8c878] flex items-center justify-center shadow-lg shadow-[#cfe0ad]/25">
              <Building2 className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 text-[#010101]" />
            </div>
          </motion.div>

          <motion.h1
            className="mt-5 text-2xl xs:text-3xl sm:text-4xl font-bold text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Matters
          </motion.h1>
          <motion.p
            className="mt-2 text-xs xs:text-sm text-neutral-400 max-w-[220px] xs:max-w-[260px] mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Construction Management Platform
          </motion.p>
        </motion.div>

        {/* Login Form Card */}
        <motion.div
          className="relative bg-neutral-900/60 backdrop-blur-xl border border-neutral-800/60 rounded-2xl xs:rounded-3xl p-5 xs:p-6 sm:p-8 shadow-2xl shadow-black/40"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 rounded-2xl xs:rounded-3xl bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

          <form onSubmit={handleSubmit} className="relative space-y-4 xs:space-y-5">
            {/* Error message */}
            <AnimatePresence>
              {(error || authError) && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="p-3 xs:p-4 rounded-xl bg-red-500/10 border border-red-500/20 overflow-hidden"
                >
                  <p className="text-red-400 text-xs xs:text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    {error || authError}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email field */}
            <div className="space-y-1.5 xs:space-y-2">
              <label
                htmlFor="email"
                className="block text-xs xs:text-sm font-medium text-neutral-300"
              >
                Email
              </label>
              <motion.div
                className="relative"
                animate={{
                  scale: isFocused === "email" ? 1.01 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                <div className="absolute left-3.5 xs:left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                  <Mail className="w-4 h-4 xs:w-5 xs:h-5" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsFocused("email")}
                  onBlur={() => setIsFocused(null)}
                  className="w-full pl-10 xs:pl-12 pr-4 py-3 xs:py-3.5 bg-neutral-900/80 border border-neutral-700/50 rounded-xl text-sm xs:text-base text-white placeholder-neutral-500 focus:outline-none focus:border-[#cfe0ad]/50 focus:ring-2 focus:ring-[#cfe0ad]/20 transition-all duration-200"
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                />
              </motion.div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5 xs:space-y-2">
              <label
                htmlFor="password"
                className="block text-xs xs:text-sm font-medium text-neutral-300"
              >
                Password
              </label>
              <motion.div
                className="relative"
                animate={{
                  scale: isFocused === "password" ? 1.01 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                <div className="absolute left-3.5 xs:left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                  <Lock className="w-4 h-4 xs:w-5 xs:h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsFocused("password")}
                  onBlur={() => setIsFocused(null)}
                  className="w-full pl-10 xs:pl-12 pr-12 py-3 xs:py-3.5 bg-neutral-900/80 border border-neutral-700/50 rounded-xl text-sm xs:text-base text-white placeholder-neutral-500 focus:outline-none focus:border-[#cfe0ad]/50 focus:ring-2 focus:ring-[#cfe0ad]/20 transition-all duration-200"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-neutral-800/50"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 xs:w-5 xs:h-5" />
                  ) : (
                    <Eye className="w-4 h-4 xs:w-5 xs:h-5" />
                  )}
                </button>
              </motion.div>
            </div>

            {/* Forgot password link */}
            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-xs xs:text-sm text-neutral-400 hover:text-[#cfe0ad] transition-colors duration-200 py-1"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={isLoading || !email || !password}
              className="relative w-full py-3.5 xs:py-4 px-4 bg-gradient-to-r from-[#cfe0ad] to-[#bdd49b] text-[#010101] text-sm xs:text-base font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[52px] xs:min-h-[56px] overflow-hidden group"
              whileHover={{ scale: isLoading ? 1 : 1.01 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
            >
              {/* Button glow effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                animate={!isLoading ? { translateX: ["100%", "-100%"] } : {}}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: "easeInOut",
                }}
              />

              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Login</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Create account link */}
        <motion.div
          className="text-center mt-6 xs:mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-xs xs:text-sm text-neutral-400">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-[#cfe0ad] hover:text-[#bfd09d] font-medium transition-colors inline-flex items-center gap-1 group"
            >
              Create Account
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </p>
        </motion.div>

        {/* Version/Footer */}
        <motion.div
          className="text-center mt-8 xs:mt-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-center gap-2 text-neutral-600">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <p className="text-[10px] xs:text-xs">
              Secure login protected by encryption
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom safe area spacer for mobile */}
      <div className="h-safe-area-inset-bottom" />
    </div>
  );
}
