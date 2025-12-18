import { useCallback, useMemo, useRef, useState } from "react";

type UseLongPressOptions = {
  delay?: number;
};

export function useLongPress(onLongPress: () => void, { delay = 600 }: UseLongPressOptions = {}) {
  const timer = useRef<number>();
  const [pressing, setPressing] = useState(false);

  const start = useCallback(() => {
    setPressing(true);
    timer.current = window.setTimeout(() => {
      onLongPress();
    }, delay);
  }, [delay, onLongPress]);

  const clear = useCallback(() => {
    setPressing(false);
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = undefined;
    }
  }, []);

  const bind = useMemo(
    () => ({
      onMouseDown: start,
      onMouseUp: clear,
      onMouseLeave: clear,
      onTouchStart: start,
      onTouchEnd: clear,
      onTouchCancel: clear
    }),
    [start, clear]
  );

  return { bind, pressing, clear };
}
