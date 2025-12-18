import { cn } from "@/lib/utils";

type LoadingSpinnerProps = {
  size?: number;
  className?: string;
};

export function LoadingSpinner({ size = 32, className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn("animate-spin rounded-full border-2 border-[#cfe0ad] border-t-transparent", className)}
      style={{ width: size, height: size }}
      aria-label="Loading"
    />
  );
}
