// Framer Motion animation variants
import type { Transition, Variants } from "framer-motion";

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
};

export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: "easeOut" as const }
};

export const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.3, ease: "easeOut" as const }
};

export const slideInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.3, ease: "easeOut" as const }
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 }
};

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const listItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 }
};

export const pageTransition = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.2, ease: "easeOut" as const }
};

// Transition presets
export const springTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30
};

export const easeTransition: Transition = {
  duration: 0.3,
  ease: "easeInOut"
};

export const fastTransition: Transition = {
  duration: 0.15,
  ease: "easeOut"
};

// Hover and tap animations for interactive elements
export const buttonHover = {
  scale: 1.02
};

export const buttonTap = {
  scale: 0.98
};

export const cardHover = {
  y: -2
};
