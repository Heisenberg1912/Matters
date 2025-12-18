import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

export function Skeleton({ className, shimmer = true, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-[#1a1a1a]",
        shimmer && "animate-skeleton-shimmer bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] bg-[length:200%_100%]",
        className
      )}
      {...props}
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-[24px] border border-[#242424] bg-[#101010] p-4 xs:p-5 sm:p-6", className)}>
      <Skeleton className="h-4 w-3/4 mb-3" />
      <Skeleton className="h-3 w-1/2 mb-4" />
      <Skeleton className="h-24 xs:h-32 sm:h-40 w-full rounded-xl" />
    </div>
  );
}

export function SkeletonStageSlider() {
  return (
    <div className="flex flex-col rounded-[16px] xs:rounded-[20px] sm:rounded-[30px] md:rounded-[40px] border border-[#1f1f1f] bg-[#050505] p-3 xs:p-4 sm:p-6 md:p-8 lg:p-10">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-7 xs:h-8 xs:w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full" />
        <Skeleton className="h-3 w-24 xs:w-32" />
        <Skeleton className="h-7 w-7 xs:h-8 xs:w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-4 w-3/4 mx-auto" />
      <div className="mt-6 xs:mt-8 flex justify-center">
        <Skeleton className="h-28 w-28 xs:h-36 xs:w-36 sm:h-48 sm:w-48 md:h-60 md:w-60 lg:h-72 lg:w-72 rounded-full" />
      </div>
      <div className="mt-4 xs:mt-5 sm:mt-8 flex justify-center gap-2">
        <Skeleton className="h-2 w-2 rounded-full" />
        <Skeleton className="h-2 w-2 rounded-full" />
        <Skeleton className="h-2 w-2 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonProgressStats() {
  return (
    <div className="flex flex-col rounded-[16px] xs:rounded-[24px] sm:rounded-[40px] md:rounded-[50px] lg:rounded-[60px] border border-[#1f1f1f] bg-[#050505] p-3 xs:p-4 sm:p-6 md:p-8 lg:p-10">
      <div className="flex flex-col xs:flex-row items-center gap-3 xs:gap-4 sm:gap-6">
        <Skeleton className="h-20 w-20 xs:h-24 xs:w-24 sm:h-32 sm:w-32 md:h-40 md:w-40 lg:h-56 lg:w-56 rounded-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <Skeleton className="mt-4 h-16 xs:h-20 sm:h-24 md:h-32 w-1/2" />
      <Skeleton className="mt-2 h-4 w-2/3" />
      <Skeleton className="mt-6 h-4 xs:h-5 sm:h-6 w-full rounded-full" />
    </div>
  );
}

export function SkeletonInsightCard() {
  return (
    <div className="flex h-auto min-h-[260px] xs:min-h-[300px] sm:min-h-[400px] flex-col rounded-[16px] xs:rounded-[24px] sm:rounded-[34px] border border-[#1f1f1f] bg-[#101010] p-4 xs:p-5 sm:p-7">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-5 w-3/4" />
      <Skeleton className="mt-2 h-3 w-full" />
      <Skeleton className="mt-auto h-24 xs:h-32 sm:h-44 w-full rounded-xl" />
      <div className="mt-3 flex justify-center gap-2">
        <Skeleton className="h-2 w-2 rounded-full" />
        <Skeleton className="h-2 w-2 rounded-full" />
        <Skeleton className="h-2 w-2 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonResourceCard() {
  return (
    <Skeleton className="h-[120px] xs:h-[150px] sm:h-[220px] md:h-[300px] lg:h-[380px] xl:h-[430px] rounded-[12px] xs:rounded-[16px] sm:rounded-[24px] md:rounded-[34px]" />
  );
}
