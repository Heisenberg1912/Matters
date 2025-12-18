import { useMemo, useRef, useState } from "react";
import { useGesture } from "@use-gesture/react";

type SwipeDirection = "left" | "right" | "up" | "down" | null;

type SwipeOptions = {
  onSwipedLeft?: () => void;
  onSwipedRight?: () => void;
  onSwipedUp?: () => void;
  onSwipedDown?: () => void;
  threshold?: number;
  trackMouse?: boolean;
};

/**
 * Lightweight swipe helper built on top of @use-gesture/react.
 * Returns a bind function you can spread on any element that should react to swipes.
 */
export function useSwipe({
  onSwipedLeft,
  onSwipedRight,
  onSwipedUp,
  onSwipedDown,
  threshold = 30,
  trackMouse = true
}: SwipeOptions) {
  const [direction, setDirection] = useState<SwipeDirection>(null);
  const lockRef = useRef(false);

  const bind = useGesture(
    {
      onDragEnd: ({ swipe: [sx, sy], movement: [mx, my] }) => {
        // Prefer the swipe tuple, fall back to movement if swipe isn't set
        const horizontal = Math.abs(mx) > Math.abs(my);
        const vertical = Math.abs(my) > Math.abs(mx);

        if ((sx || sy) && !lockRef.current) {
          if (sx === -1 && onSwipedLeft) onSwipedLeft();
          if (sx === 1 && onSwipedRight) onSwipedRight();
          if (sy === -1 && onSwipedUp) onSwipedUp();
          if (sy === 1 && onSwipedDown) onSwipedDown();
          lockRef.current = true;
          setTimeout(() => {
            lockRef.current = false;
          }, 80);
          setDirection(null);
          return;
        }

        if (horizontal && Math.abs(mx) > threshold) {
          const dir = mx > 0 ? "right" : "left";
          setDirection(dir);
          if (dir === "left" && onSwipedLeft) onSwipedLeft();
          if (dir === "right" && onSwipedRight) onSwipedRight();
        } else if (vertical && Math.abs(my) > threshold) {
          const dir = my > 0 ? "down" : "up";
          setDirection(dir);
          if (dir === "up" && onSwipedUp) onSwipedUp();
          if (dir === "down" && onSwipedDown) onSwipedDown();
        }
        setTimeout(() => setDirection(null), 120);
      }
    },
    {
      drag: {
        threshold,
        filterTaps: true,
        axis: "lock",
        swipe: {
          velocity: 0.2,
          distance: threshold
        }
      },
      eventOptions: { passive: false }
    }
  );

  return useMemo(() => ({ bind, direction }), [bind, direction]);
}
