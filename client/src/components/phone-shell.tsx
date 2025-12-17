import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

export default function PhoneShell({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "flex h-[2868px] w-[1320px] flex-col overflow-hidden rounded-[120px] border border-[#050505] bg-[#020202] text-white shadow-[0_60px_120px_rgba(0,0,0,0.55)]",
        className
      )}
    >
      {children}
    </div>
  );
}
