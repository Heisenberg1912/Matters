import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full text-base font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cfe0ad] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#cfe0ad] text-black hover:bg-[#cfe0ad]/90",
        outline:
          "border border-[#cfe0ad] bg-[#cfe0ad]/10 text-[#cfe0ad] hover:bg-[#cfe0ad] hover:text-black",
        secondary:
          "border border-[#b8d4f1] bg-[#b8d4f1]/10 text-[#b8d4f1] hover:bg-[#b8d4f1] hover:text-black",
        destructive: "bg-[#f87171] text-white hover:bg-[#f87171]/90",
        ghost: "text-white hover:bg-[#2a2a2a]",
        link: "text-[#cfe0ad] underline-offset-4 hover:underline"
      },
      size: {
        default: "px-6 py-3",
        sm: "px-4 py-2 text-sm",
        lg: "px-8 py-4 text-lg",
        icon: "h-12 w-12"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
