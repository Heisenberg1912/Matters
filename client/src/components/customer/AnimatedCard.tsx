import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface AnimatedCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  hover?: boolean;
  delay?: number;
  className?: string;
}

export function AnimatedCard({ children, hover = true, delay = 0, className, ...props }: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay,
        type: "spring",
        stiffness: 100,
      }}
      whileHover={hover ? { scale: 1.02, y: -5 } : undefined}
      className={cn(
        "bg-white rounded-xl shadow-md border border-gray-100 transition-all",
        hover && "hover:shadow-lg",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color?: "blue" | "green" | "purple" | "orange" | "red";
  trend?: { value: number; label: string };
  delay?: number;
}

export function StatCard({ title, value, icon, color = "blue", trend, delay = 0 }: StatCardProps) {
  const colors = {
    blue: "from-blue-500 to-blue-600 bg-blue-50 text-blue-600",
    green: "from-green-500 to-green-600 bg-green-50 text-green-600",
    purple: "from-purple-500 to-purple-600 bg-purple-50 text-purple-600",
    orange: "from-orange-500 to-orange-600 bg-orange-50 text-orange-600",
    red: "from-red-500 to-red-600 bg-red-50 text-red-600",
  };

  const bgColors = {
    blue: "bg-blue-50",
    green: "bg-green-50",
    purple: "bg-purple-50",
    orange: "bg-orange-50",
    red: "bg-red-50",
  };

  const textColors = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
    red: "text-red-600",
  };

  return (
    <AnimatedCard delay={delay} className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <p className={cn("text-sm mt-1", trend.value >= 0 ? "text-green-600" : "text-red-600")}>
              {trend.value >= 0 ? "+" : ""}
              {trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn("p-4 rounded-xl", bgColors[color])}>{icon}</div>
      </div>
      <div className={cn("h-2 bg-gradient-to-r rounded-full", colors[color].split(" ")[0], colors[color].split(" ")[1])} />
    </AnimatedCard>
  );
}
