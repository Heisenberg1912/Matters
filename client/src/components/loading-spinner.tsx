import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "dots" | "pulse" | "bars";
  className?: string;
  color?: string;
}

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
};

export function LoadingSpinner({
  size = "md",
  variant = "default",
  className,
  color = "#cfe0ad",
}: LoadingSpinnerProps) {
  const pixelSize = sizeMap[size];

  if (variant === "dots") {
    return (
      <div className={cn("flex items-center justify-center gap-1.5", className)}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="rounded-full"
            style={{
              width: pixelSize / 4,
              height: pixelSize / 4,
              backgroundColor: color,
            }}
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
    );
  }

  if (variant === "pulse") {
    return (
      <div
        className={cn("relative flex items-center justify-center", className)}
        style={{ width: pixelSize, height: pixelSize }}
      >
        <motion.div
          className="absolute rounded-full"
          style={{
            width: pixelSize,
            height: pixelSize,
            border: `2px solid ${color}`,
          }}
          animate={{
            scale: [0.8, 1.2],
            opacity: [1, 0],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: pixelSize * 0.4,
            height: pixelSize * 0.4,
            backgroundColor: color,
          }}
          animate={{
            scale: [0.9, 1.1, 0.9],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    );
  }

  if (variant === "bars") {
    return (
      <div
        className={cn("flex items-end justify-center gap-0.5", className)}
        style={{ height: pixelSize }}
      >
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="rounded-sm"
            style={{
              width: pixelSize / 6,
              backgroundColor: color,
            }}
            animate={{
              height: [pixelSize * 0.3, pixelSize * 0.8, pixelSize * 0.3],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    );
  }

  // Default spinner
  return (
    <div
      className={cn("relative", className)}
      style={{ width: pixelSize, height: pixelSize }}
    >
      {/* Outer ring */}
      <div
        className="absolute inset-0 rounded-full animate-spin"
        style={{
          border: `2px solid ${color}20`,
          borderTopColor: color,
        }}
      />
      {/* Inner glow */}
      <motion.div
        className="absolute inset-1 rounded-full"
        style={{
          background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
        }}
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

// Full page loading overlay
interface LoadingOverlayProps {
  message?: string;
  variant?: "default" | "dots" | "pulse" | "bars";
}

export function LoadingOverlay({
  message = "Loading...",
  variant = "default",
}: LoadingOverlayProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#010101]/90 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <LoadingSpinner size="xl" variant={variant} />
      <motion.p
        className="mt-4 text-sm text-neutral-400"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {message}
      </motion.p>
    </motion.div>
  );
}

// Inline loading state for buttons/cards
interface InlineLoaderProps {
  className?: string;
}

export function InlineLoader({ className }: InlineLoaderProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-current"
          animate={{
            y: [0, -4, 0],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
}

// Skeleton loading placeholder
interface SkeletonLoaderProps {
  className?: string;
  variant?: "text" | "circle" | "rect";
  width?: string | number;
  height?: string | number;
}

export function SkeletonLoader({
  className,
  variant = "rect",
  width,
  height,
}: SkeletonLoaderProps) {
  const baseStyles = "bg-neutral-800 animate-pulse";
  const variantStyles = {
    text: "rounded h-4",
    circle: "rounded-full",
    rect: "rounded-xl",
  };

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], className)}
      style={{ width, height }}
    />
  );
}
