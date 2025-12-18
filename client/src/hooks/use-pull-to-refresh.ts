import type { TouchEvent } from "react";
import { useCallback, useMemo, useRef, useState } from "react";

type UsePullToRefreshOptions = {
  threshold?: number;
};

export function usePullToRefresh(onRefresh: () => Promise<void> | void, options: UsePullToRefreshOptions = {}) {
  const { threshold = 60 } = options;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef<number | null>(null);

  const reset = () => {
    setPullDistance(0);
    startY.current = null;
  };

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
    reset();
  }, [isRefreshing, onRefresh]);

  const bind = useMemo(
    () => ({
      onTouchStart: (e: TouchEvent) => {
        if (e.currentTarget.scrollTop > 0) return;
        startY.current = e.touches[0].clientY;
      },
      onTouchMove: (e: TouchEvent) => {
        if (startY.current === null) return;
        const delta = e.touches[0].clientY - startY.current;
        if (delta > 0) {
          setPullDistance(Math.min(delta, threshold * 2));
        }
      },
      onTouchEnd: () => {
        if (pullDistance >= threshold) {
          void handleRefresh();
        } else {
          reset();
        }
      }
    }),
    [handleRefresh, pullDistance, threshold]
  );

  return {
    isRefreshing,
    pullDistance,
    bind,
    reset
  };
}
