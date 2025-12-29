import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "gradient" | "glass" | "interactive";
  hover?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", hover = false, ...props }, ref) => {
    const variants = {
      default: "border border-[#242424] bg-[#101010]",
      elevated: "border border-[#242424] bg-[#101010] shadow-lg shadow-black/30",
      gradient: "border border-[#242424] bg-gradient-to-b from-[#161616] to-[#0a0a0a]",
      glass: "border border-white/5 bg-[#101010]/80 backdrop-blur-xl",
      interactive: "border border-[#242424] bg-[#101010] hover:border-[#cfe0ad]/20 cursor-pointer",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl xs:rounded-2xl sm:rounded-[26px] text-foreground transition-all duration-300",
          variants[variant],
          hover && "hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

// Animated Card variant with framer-motion
interface AnimatedCardProps extends HTMLMotionProps<"div"> {
  variant?: "default" | "elevated" | "gradient" | "glass" | "interactive";
  delay?: number;
}

const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, variant = "default", delay = 0, ...props }, ref) => {
    const variants = {
      default: "border border-[#242424] bg-[#101010]",
      elevated: "border border-[#242424] bg-[#101010] shadow-lg shadow-black/30",
      gradient: "border border-[#242424] bg-gradient-to-b from-[#161616] to-[#0a0a0a]",
      glass: "border border-white/5 bg-[#101010]/80 backdrop-blur-xl",
      interactive: "border border-[#242424] bg-[#101010] cursor-pointer",
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-xl xs:rounded-2xl sm:rounded-[26px] text-foreground",
          variants[variant],
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay,
          ease: [0.22, 1, 0.36, 1],
        }}
        whileHover={{
          y: -2,
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          borderColor: "rgba(207, 224, 173, 0.2)",
        }}
        whileTap={{ scale: 0.98 }}
        {...props}
      />
    );
  }
);
AnimatedCard.displayName = "AnimatedCard";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-4 xs:p-5 sm:p-6", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-lg xs:text-xl sm:text-2xl font-semibold leading-none tracking-tight text-white",
        className
      )}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-xs xs:text-sm text-neutral-400", className)}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("p-4 xs:p-5 sm:p-6 pt-0", className)}
      {...props}
    />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center p-4 xs:p-5 sm:p-6 pt-0",
        className
      )}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

// Stats card component
interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  color?: string;
  delay?: number;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ label, value, subtext, icon, color = "#cfe0ad", delay = 0, className, ...props }, ref) => (
    <motion.div
      ref={ref}
      className={cn(
        "border border-[#242424] bg-[#101010] p-3 xs:p-4 rounded-xl xs:rounded-2xl",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2, borderColor: `${color}30` }}
      {...props}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon && (
          <div style={{ color }} className="shrink-0">
            {icon}
          </div>
        )}
        <span className="text-[0.6rem] xs:text-xs text-neutral-500 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-xl xs:text-2xl sm:text-3xl font-bold text-white">{value}</p>
      {subtext && (
        <p className="text-[0.6rem] xs:text-xs text-neutral-600 mt-0.5">{subtext}</p>
      )}
    </motion.div>
  )
);
StatCard.displayName = "StatCard";

export {
  Card,
  AnimatedCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  StatCard,
};
