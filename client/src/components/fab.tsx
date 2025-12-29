import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

type FabProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    label?: string;
    variant?: "default" | "secondary";
  }
>;

export function Fab({
  children,
  className,
  label,
  variant = "default",
  ...props
}: FabProps) {
  const variants = {
    default: "bg-gradient-to-r from-[#cfe0ad] to-[#bdd49b] text-[#010101] shadow-[0_8px_30px_rgba(207,224,173,0.3)]",
    secondary: "bg-neutral-800 text-white border border-neutral-700 shadow-[0_8px_30px_rgba(0,0,0,0.4)]",
  };

  return (
    <motion.button
      type="button"
      {...(props as any)}
      className={cn(
        "fixed z-30 flex items-center rounded-full font-semibold overflow-hidden",
        "transition-colors duration-200",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cfe0ad]",
        "bottom-20 xs:bottom-24 sm:bottom-28 md:bottom-6",
        "right-4 xs:right-5 sm:right-6 md:right-8",
        "gap-1.5 xs:gap-2 px-4 py-3 xs:px-5 xs:py-3.5 sm:px-6 sm:py-4",
        "text-sm xs:text-base",
        "min-w-[52px] min-h-[52px] xs:min-w-[56px] xs:min-h-[56px]",
        variants[variant],
        className
      )}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.1,
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={label ?? "Quick action"}
    >
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: "200%" }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 4,
          ease: "easeInOut",
        }}
      />

      {/* Glow pulse effect */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: variant === "default"
            ? "radial-gradient(circle, rgba(207,224,173,0.3) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.2, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Content */}
      <span className="relative z-10 flex items-center gap-1.5 xs:gap-2">
        {children || <Plus className="w-5 h-5 xs:w-6 xs:h-6" strokeWidth={2.5} />}
        {label && <span className="hidden xs:inline font-semibold">{label}</span>}
      </span>
    </motion.button>
  );
}

// Extended FAB with icon
export function FabExtended({
  icon: Icon,
  label,
  className,
  variant = "default",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: React.ElementType;
  label: string;
  variant?: "default" | "secondary";
}) {
  const variants = {
    default: "bg-gradient-to-r from-[#cfe0ad] to-[#bdd49b] text-[#010101] shadow-[0_8px_30px_rgba(207,224,173,0.3)]",
    secondary: "bg-neutral-800 text-white border border-neutral-700 shadow-[0_8px_30px_rgba(0,0,0,0.4)]",
  };

  return (
    <motion.button
      type="button"
      {...(props as any)}
      className={cn(
        "fixed z-30 flex items-center justify-center rounded-full font-semibold overflow-hidden",
        "transition-colors duration-200",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cfe0ad]",
        "bottom-20 xs:bottom-24 sm:bottom-28 md:bottom-6",
        "right-4 xs:right-5 sm:right-6 md:right-8",
        "gap-2 px-5 py-3.5 xs:px-6 xs:py-4",
        "text-sm xs:text-base",
        variants[variant],
        className
      )}
      initial={{ scale: 0, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0, y: 20 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.1,
      }}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      aria-label={label}
    >
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: "200%" }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3,
          ease: "easeInOut",
        }}
      />

      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5" />}
        <span className="font-semibold">{label}</span>
      </span>
    </motion.button>
  );
}
