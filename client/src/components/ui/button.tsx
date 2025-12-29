import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cfe0ad] focus-visible:ring-offset-2 focus-visible:ring-offset-[#010101] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[#cfe0ad] to-[#bdd49b] text-[#010101] shadow-lg shadow-[#cfe0ad]/20 hover:shadow-xl hover:shadow-[#cfe0ad]/30 hover:from-[#bfd09d] hover:to-[#adc48b]",
        outline:
          "border-2 border-[#cfe0ad]/50 bg-[#cfe0ad]/5 text-[#cfe0ad] hover:bg-[#cfe0ad] hover:text-[#010101] hover:border-[#cfe0ad]",
        secondary:
          "bg-neutral-800 border border-neutral-700 text-white hover:bg-neutral-700 hover:border-neutral-600",
        destructive:
          "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/20 hover:from-red-600 hover:to-red-700",
        ghost:
          "text-neutral-300 hover:bg-neutral-800/50 hover:text-white",
        link:
          "text-[#cfe0ad] underline-offset-4 hover:underline p-0",
        success:
          "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/20 hover:from-green-600 hover:to-green-700",
        warning:
          "bg-gradient-to-r from-amber-500 to-amber-600 text-[#010101] shadow-lg shadow-amber-500/20 hover:from-amber-600 hover:to-amber-700",
      },
      size: {
        default: "px-5 py-2.5 xs:px-6 xs:py-3 text-sm xs:text-base min-h-[44px] xs:min-h-[48px]",
        sm: "px-3.5 py-2 xs:px-4 xs:py-2.5 text-xs xs:text-sm min-h-[36px] xs:min-h-[40px]",
        lg: "px-7 py-3.5 xs:px-8 xs:py-4 text-base xs:text-lg min-h-[52px] xs:min-h-[56px]",
        xl: "px-8 py-4 xs:px-10 xs:py-5 text-lg xs:text-xl min-h-[56px] xs:min-h-[64px]",
        icon: "h-10 w-10 xs:h-12 xs:w-12 p-0",
        "icon-sm": "h-8 w-8 xs:h-10 xs:w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 xs:w-5 xs:h-5 animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

// Animated button with framer-motion
interface AnimatedButtonProps
  extends Omit<HTMLMotionProps<"button">, "children">,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15 }}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 xs:w-5 xs:h-5 animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && (
              <motion.span
                className="shrink-0"
                initial={{ x: 0 }}
                whileHover={{ x: -2 }}
              >
                {leftIcon}
              </motion.span>
            )}
            {children}
            {rightIcon && (
              <motion.span
                className="shrink-0"
                initial={{ x: 0 }}
                whileHover={{ x: 2 }}
              >
                {rightIcon}
              </motion.span>
            )}
          </>
        )}
      </motion.button>
    );
  }
);
AnimatedButton.displayName = "AnimatedButton";

// Icon button variant
interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  icon: React.ReactNode;
  label: string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "ghost", icon, label, ...props }, ref) => {
    return (
      <button
        className={cn(
          buttonVariants({ variant, size: "icon", className }),
          "rounded-xl"
        )}
        ref={ref}
        aria-label={label}
        {...props}
      >
        {icon}
      </button>
    );
  }
);
IconButton.displayName = "IconButton";

export { Button, AnimatedButton, IconButton, buttonVariants };
