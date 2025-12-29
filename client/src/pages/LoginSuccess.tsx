import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  Check,
  Sparkles,
  HardHat,
  Home,
  Shield,
  Wrench,
  Building2,
  LayoutDashboard,
  Hammer,
  Users,
  TrendingUp,
  Zap,
} from "lucide-react";

// Role-specific configurations
const roleConfig = {
  contractor: {
    icon: HardHat,
    secondaryIcons: [Wrench, Hammer, Building2],
    accentColor: "#f59e0b",
    gradientFrom: "#f59e0b",
    gradientTo: "#d97706",
    welcomeText: "Ready to Build",
    message: "Your next project awaits. Let's get to work!",
    loadingText: "Loading your projects...",
    particleColor: "rgba(245, 158, 11, 0.4)",
  },
  customer: {
    icon: Home,
    secondaryIcons: [Building2, TrendingUp, Users],
    accentColor: "#cfe0ad",
    gradientFrom: "#cfe0ad",
    gradientTo: "#a8c878",
    welcomeText: "Welcome Home",
    message: "Your construction journey continues. Let's build your dream!",
    loadingText: "Preparing your dashboard...",
    particleColor: "rgba(207, 224, 173, 0.4)",
  },
  admin: {
    icon: Shield,
    secondaryIcons: [LayoutDashboard, Users, TrendingUp],
    accentColor: "#8b5cf6",
    gradientFrom: "#8b5cf6",
    gradientTo: "#7c3aed",
    welcomeText: "Command Center",
    message: "Full system access granted. You're in control.",
    loadingText: "Initializing admin panel...",
    particleColor: "rgba(139, 92, 246, 0.4)",
  },
};

type RoleType = keyof typeof roleConfig;

export default function LoginSuccess() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [showContent, setShowContent] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [progress, setProgress] = useState(0);

  // Determine user role type
  const roleType: RoleType = useMemo(() => {
    if (user?.role === "contractor") return "contractor";
    if (user?.role === "admin" || user?.role === "superadmin") return "admin";
    return "customer";
  }, [user?.role]);

  const config = roleConfig[roleType];
  const IconComponent = config.icon;

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Animation phases
  useEffect(() => {
    const timers = [
      setTimeout(() => setAnimationPhase(1), 300),
      setTimeout(() => setShowContent(true), 600),
      setTimeout(() => setAnimationPhase(2), 1200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Progress bar animation
  useEffect(() => {
    const startTime = Date.now();
    const duration = 2800;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(100, (elapsed / duration) * 100);
      setProgress(newProgress);

      if (newProgress < 100) {
        requestAnimationFrame(animate);
      }
    };

    const frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
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
    }, 3200);

    return () => clearTimeout(timer);
  }, [user, navigate]);

  const firstName = user?.name?.split(" ")[0] || "there";

  // Generate random positions for floating icons
  const floatingIcons = useMemo(() => {
    return config.secondaryIcons.map((Icon, index) => ({
      Icon,
      angle: (index * 120) + 30,
      distance: 120 + index * 20,
      delay: index * 0.15,
    }));
  }, [config.secondaryIcons]);

  // Particle configurations
  const particles = useMemo(() => {
    return [...Array(20)].map((_, i) => ({
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2.5 + Math.random() * 2,
      size: Math.random() * 3 + 1,
    }));
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#010101] flex flex-col items-center justify-center px-4 overflow-hidden relative">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: config.particleColor,
              left: `${particle.x}%`,
            }}
            initial={{ y: "110vh", opacity: 0 }}
            animate={{
              y: "-10vh",
              opacity: [0, 0.8, 0.8, 0],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Glowing orb background effect - main */}
      <motion.div
        className="absolute w-[280px] h-[280px] xs:w-[320px] xs:h-[320px] sm:w-[400px] sm:h-[400px] rounded-full"
        style={{
          background: `radial-gradient(circle, ${config.accentColor}20 0%, ${config.accentColor}08 40%, transparent 70%)`,
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: 0.8,
        }}
        transition={{
          scale: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          },
          opacity: { duration: 1 },
        }}
      />

      {/* Secondary ambient orbs */}
      <motion.div
        className="absolute w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] rounded-full -top-20 -left-20"
        style={{
          background: `radial-gradient(circle, ${config.accentColor}15 0%, transparent 60%)`,
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: 0.6,
          x: [0, 20, 0],
          y: [0, -15, 0],
        }}
        transition={{
          scale: { duration: 1.5 },
          opacity: { duration: 1.5 },
          x: { duration: 8, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
        }}
      />
      <motion.div
        className="absolute w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] rounded-full -bottom-20 -right-20"
        style={{
          background: `radial-gradient(circle, ${config.accentColor}12 0%, transparent 60%)`,
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: 0.5,
          x: [0, -15, 0],
          y: [0, 20, 0],
        }}
        transition={{
          scale: { duration: 1.5, delay: 0.3 },
          opacity: { duration: 1.5, delay: 0.3 },
          x: { duration: 7, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 9, repeat: Infinity, ease: "easeInOut" },
        }}
      />

      {/* Floating secondary icons - orbital motion */}
      <AnimatePresence>
        {animationPhase >= 1 &&
          floatingIcons.map(({ Icon, angle, distance, delay }, index) => (
            <motion.div
              key={index}
              className="absolute"
              style={{ color: `${config.accentColor}50` }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: 0.5,
                scale: 1,
                x: Math.cos((angle * Math.PI) / 180) * distance,
                y: Math.sin((angle * Math.PI) / 180) * distance,
              }}
              transition={{
                opacity: { duration: 0.5, delay },
                scale: { type: "spring", stiffness: 200, damping: 15, delay },
                x: { type: "spring", stiffness: 100, damping: 20, delay },
                y: { type: "spring", stiffness: 100, damping: 20, delay },
              }}
            >
              <motion.div
                animate={{
                  y: [0, -8, 0],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 3 + index * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Icon className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8" />
              </motion.div>
            </motion.div>
          ))}
      </AnimatePresence>

      {/* Main content container */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-4">
        {/* Success icon circle */}
        <motion.div
          className="relative mb-6 xs:mb-8 sm:mb-10"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.1,
          }}
        >
          {/* Outer ring animations */}
          {[0, 0.6, 1.2].map((delay, i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full"
              style={{
                border: `2px solid ${config.accentColor}`,
                opacity: 0,
              }}
              animate={{
                scale: [0.8, 1.8],
                opacity: [0.6, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
                delay,
              }}
            />
          ))}

          {/* Main circle with enhanced glow */}
          <motion.div
            className="relative w-24 h-24 xs:w-28 xs:h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${config.gradientFrom}, ${config.gradientTo})`,
              boxShadow: `0 0 60px ${config.accentColor}40, 0 20px 40px rgba(0,0,0,0.3)`,
            }}
            initial={{ rotate: -180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 150,
              damping: 20,
              delay: 0.2,
            }}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)",
              }}
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{
                duration: 1.2,
                delay: 0.8,
                ease: "easeInOut",
              }}
            />

            {/* Inner glow */}
            <div
              className="absolute inset-2 rounded-full"
              style={{
                background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 60%)`,
              }}
            />

            {/* Icon transition: Role icon -> Checkmark */}
            <div className="relative">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: animationPhase >= 2 ? 0 : 1,
                  opacity: animationPhase >= 2 ? 0 : 1,
                  rotate: animationPhase >= 2 ? 90 : 0,
                }}
                transition={{ duration: 0.3 }}
              >
                <IconComponent className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 text-[#010101]" />
              </motion.div>
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ scale: 0, opacity: 0, rotate: -90 }}
                animate={{
                  scale: animationPhase >= 2 ? 1 : 0,
                  opacity: animationPhase >= 2 ? 1 : 0,
                  rotate: animationPhase >= 2 ? 0 : -90,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 15,
                }}
              >
                <Check className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 text-[#010101] stroke-[3]" />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Welcome text with staggered animation */}
        <AnimatePresence>
          {showContent && (
            <>
              <motion.div
                className="flex items-center gap-2 mb-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles
                    className="w-4 h-4 xs:w-5 xs:h-5"
                    style={{ color: config.accentColor }}
                  />
                </motion.div>
                <span
                  className="text-xs xs:text-sm font-semibold uppercase tracking-[0.2em]"
                  style={{ color: config.accentColor }}
                >
                  {config.welcomeText}
                </span>
                <motion.div
                  animate={{ rotate: [0, -15, 15, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles
                    className="w-4 h-4 xs:w-5 xs:h-5"
                    style={{ color: config.accentColor }}
                  />
                </motion.div>
              </motion.div>

              <motion.h1
                className="text-3xl xs:text-4xl sm:text-5xl font-bold text-white text-center mb-3 xs:mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Hey, {firstName}!
              </motion.h1>

              <motion.p
                className="text-neutral-400 text-center text-sm xs:text-base max-w-xs mb-8 xs:mb-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {config.message}
              </motion.p>

              {/* Progress section */}
              <motion.div
                className="w-full max-w-[240px] xs:max-w-[280px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {/* Progress bar */}
                <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden mb-4">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${config.gradientFrom}, ${config.gradientTo})`,
                      boxShadow: `0 0 10px ${config.accentColor}60`,
                    }}
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>

                {/* Loading indicator */}
                <div className="flex flex-col items-center gap-3">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: config.accentColor }}
                        animate={{
                          scale: [1, 1.4, 1],
                          opacity: [0.4, 1, 0.4],
                        }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          delay: i * 0.15,
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Zap className="w-3 h-3" style={{ color: config.accentColor }} />
                    <span className="text-xs">{config.loadingText}</span>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom decorative gradient line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{
          background: `linear-gradient(to right, transparent, ${config.accentColor}, transparent)`,
        }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 0.7 }}
        transition={{ duration: 1, delay: 0.5 }}
      />

      {/* Corner decorations with enhanced gradients */}
      <motion.div
        className="absolute top-0 left-0 w-32 h-32 xs:w-40 xs:h-40 sm:w-48 sm:h-48"
        style={{
          background: `linear-gradient(135deg, ${config.accentColor}15 0%, transparent 60%)`,
        }}
        initial={{ opacity: 0, x: -20, y: -20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-32 h-32 xs:w-40 xs:h-40 sm:w-48 sm:h-48"
        style={{
          background: `linear-gradient(315deg, ${config.accentColor}12 0%, transparent 60%)`,
        }}
        initial={{ opacity: 0, x: 20, y: 20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      />
    </div>
  );
}
