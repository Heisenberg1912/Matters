import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface AnimatedBadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  pulse?: boolean;
  className?: string;
}

export function AnimatedBadge({
  children,
  variant = "default",
  size = "md",
  icon,
  pulse = false,
  className,
}: AnimatedBadgeProps) {
  const variants = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-orange-100 text-orange-700",
    danger: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.05 }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium transition-all",
        variants[variant],
        sizes[size],
        pulse && "animate-pulse",
        className
      )}
    >
      {icon}
      {children}
    </motion.span>
  );
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig: Record<
    string,
    { variant: "success" | "warning" | "danger" | "info" | "default"; label: string }
  > = {
    open: { variant: "info", label: "Open" },
    pending: { variant: "warning", label: "Pending" },
    in_progress: { variant: "info", label: "In Progress" },
    assigned: { variant: "success", label: "Assigned" },
    completed: { variant: "success", label: "Completed" },
    cancelled: { variant: "danger", label: "Cancelled" },
    rejected: { variant: "danger", label: "Rejected" },
    accepted: { variant: "success", label: "Accepted" },
  };

  const config = statusConfig[status.toLowerCase()] || { variant: "default", label: status };

  return (
    <AnimatedBadge variant={config.variant} className={className}>
      {config.label}
    </AnimatedBadge>
  );
}
