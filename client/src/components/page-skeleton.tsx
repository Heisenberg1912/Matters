import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PageSkeletonProps {
  /** Number of card sections to show */
  sections?: number;
  /** Show a header skeleton */
  showHeader?: boolean;
  /** Show stat cards at the top */
  showStats?: boolean;
  /** Number of stat cards */
  statsCount?: number;
  /** Custom class name */
  className?: string;
}

export function PageSkeleton({
  sections = 3,
  showHeader = true,
  showStats = false,
  statsCount = 4,
  className,
}: PageSkeletonProps) {
  return (
    <div className={cn("space-y-6 xs:space-y-8", className)}>
      {showHeader && (
        <div className="space-y-2">
          <Skeleton className="h-8 xs:h-10 w-48 xs:w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
      )}

      {showStats && (
        <div className="grid grid-cols-2 gap-3 xs:gap-4 md:grid-cols-4">
          {Array.from({ length: statsCount }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-24 xs:h-28 sm:h-32 rounded-xl xs:rounded-2xl"
            />
          ))}
        </div>
      )}

      {Array.from({ length: sections }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-32 xs:h-40 sm:h-48 rounded-2xl xs:rounded-3xl" />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({
  items = 5,
  className,
}: {
  items?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3 xs:space-y-4", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-20 xs:h-24 sm:h-28 rounded-xl xs:rounded-2xl"
        />
      ))}
    </div>
  );
}

export function GridSkeleton({
  items = 6,
  cols = 2,
  className,
}: {
  items?: number;
  cols?: 2 | 3 | 4;
  className?: string;
}) {
  const colsClass = {
    2: "grid-cols-2",
    3: "grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-3 xs:gap-4", colsClass[cols], className)}>
      {Array.from({ length: items }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-[120px] xs:h-[150px] sm:h-[200px] rounded-xl xs:rounded-2xl"
        />
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl xs:rounded-3xl border border-[#242424] bg-[#101010] p-4 xs:p-5 sm:p-6",
        className
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-24 xs:h-32 w-full rounded-xl" />
    </div>
  );
}
