import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
  variant?: "card" | "text" | "circle" | "button";
}

export function LoadingSkeleton({ className, count = 1, variant = "card" }: LoadingSkeletonProps) {
  const variants = {
    card: "h-32 rounded-xl",
    text: "h-4 rounded",
    circle: "h-12 w-12 rounded-full",
    button: "h-10 rounded-lg",
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: index * 0.1,
          }}
          className={cn("bg-gradient-to-r from-gray-200 to-gray-300", variants[variant], className)}
        />
      ))}
    </>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-xl p-6 shadow-md space-y-3"
        >
          <div className="flex items-center gap-4">
            <LoadingSkeleton variant="circle" />
            <div className="flex-1 space-y-2">
              <LoadingSkeleton variant="text" className="w-1/2" />
              <LoadingSkeleton variant="text" className="w-1/3" />
            </div>
          </div>
          <LoadingSkeleton variant="text" className="w-full" />
          <LoadingSkeleton variant="text" className="w-3/4" />
          <div className="flex gap-2">
            <LoadingSkeleton variant="button" className="flex-1" />
            <LoadingSkeleton variant="button" className="flex-1" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

interface PageLoadingProps {
  message?: string;
}

export function PageLoading({ message = "Loading..." }: PageLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear",
          }}
          className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full"
        />
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-gray-600 font-medium"
        >
          {message}
        </motion.p>
      </motion.div>
    </div>
  );
}
