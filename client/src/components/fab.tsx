import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type FabProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    label?: string;
  }
>;

export function Fab({ children, className, label, ...props }: FabProps) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "fixed z-30 flex items-center rounded-full bg-[#cfe0ad] font-semibold text-black shadow-[0_8px_24px_rgba(0,0,0,0.3)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition active:scale-95 hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cfe0ad]",
        "bottom-20 xs:bottom-24 sm:bottom-28 md:bottom-6",
        "right-3 xs:right-4 sm:right-5 md:right-6",
        "gap-1.5 xs:gap-2 px-3 py-2 xs:px-4 xs:py-2.5 sm:px-5 sm:py-3",
        "text-sm xs:text-base",
        className
      )}
      aria-label={label ?? "Quick action"}
    >
      {children}
      {label && <span className="hidden xs:inline">{label}</span>}
    </button>
  );
}
