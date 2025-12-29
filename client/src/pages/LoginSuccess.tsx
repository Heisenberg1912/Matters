import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Check, Sparkles } from "lucide-react";

export default function LoginSuccess() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [showContent, setShowContent] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Show content after initial animation
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 400);
    return () => clearTimeout(timer);
  }, []);

  // Auto-redirect to dashboard after animation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user?.role === "contractor") {
        navigate("/contractor/dashboard", { replace: true });
      } else if (user?.role === "admin" || user?.role === "superadmin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [user, navigate]);

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="min-h-[100dvh] bg-[#010101] flex flex-col items-center justify-center px-4 overflow-hidden relative">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[#cfe0ad]/30 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: window.innerHeight + 10,
              scale: Math.random() * 0.5 + 0.5,
            }}
            animate={{
              y: -10,
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Glowing orb background effect */}
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full bg-[#cfe0ad]/10 blur-[100px]"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1.5, opacity: 0.5 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />

      {/* Main content container */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Success checkmark circle */}
        <motion.div
          className="relative mb-8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.1,
          }}
        >
          {/* Outer ring animation */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-[#cfe0ad]"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.4, opacity: 0 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />

          {/* Second ring animation */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-[#cfe0ad]"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.4, opacity: 0 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.5,
            }}
          />

          {/* Main circle */}
          <motion.div
            className="w-24 h-24 xs:w-28 xs:h-28 rounded-full bg-gradient-to-br from-[#cfe0ad] to-[#a8c878] flex items-center justify-center shadow-lg shadow-[#cfe0ad]/20"
            initial={{ rotate: -180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 150,
              damping: 20,
              delay: 0.2,
            }}
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
            >
              <Check className="w-10 h-10 xs:w-12 xs:h-12 text-[#010101] stroke-[3]" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Welcome text */}
        {showContent && (
          <>
            <motion.div
              className="flex items-center gap-2 mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Sparkles className="w-5 h-5 text-[#cfe0ad]" />
              <span className="text-[#cfe0ad] text-sm font-medium uppercase tracking-wider">
                Welcome Back
              </span>
              <Sparkles className="w-5 h-5 text-[#cfe0ad]" />
            </motion.div>

            <motion.h1
              className="text-3xl xs:text-4xl sm:text-5xl font-bold text-white text-center mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Hey, {firstName}!
            </motion.h1>

            <motion.p
              className="text-neutral-400 text-center text-sm xs:text-base max-w-xs mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Great to see you again. Let's build something amazing today.
            </motion.p>

            {/* Loading indicator */}
            <motion.div
              className="flex flex-col items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-[#cfe0ad]"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.15,
                    }}
                  />
                ))}
              </div>
              <span className="text-neutral-500 text-xs">
                Preparing your dashboard...
              </span>
            </motion.div>
          </>
        )}
      </div>

      {/* Bottom decorative line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#cfe0ad] to-transparent"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 0.5 }}
        transition={{ duration: 1.5, delay: 0.5 }}
      />
    </div>
  );
}
