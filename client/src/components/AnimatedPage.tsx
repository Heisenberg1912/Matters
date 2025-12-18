import { motion } from 'framer-motion';
import { pageTransition } from '@/lib/animations';
import { ReactNode } from 'react';

interface AnimatedPageProps {
  children: ReactNode;
}

export function AnimatedPage({ children }: AnimatedPageProps) {
  return (
    <motion.div
      initial={pageTransition.initial}
      animate={pageTransition.animate}
      exit={pageTransition.exit}
      transition={pageTransition.transition}
    >
      {children}
    </motion.div>
  );
}
