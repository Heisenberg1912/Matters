import { cn } from "@/lib/utils";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-lg bg-[#1c1c1c]", className)} />;
}
