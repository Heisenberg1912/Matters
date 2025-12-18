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
        "fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-[#cfe0ad] px-5 py-3 text-base font-semibold text-black shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cfe0ad]",
        className
      )}
      aria-label={label ?? "Quick action"}
    >
      {children}
      {label && <span>{label}</span>}
    </button>
  );
}
