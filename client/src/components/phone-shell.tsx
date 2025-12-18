import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

export default function PhoneShell({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "flex min-h-[720px] w-full max-w-screen-md sm:max-w-screen-lg xl:max-w-[1320px] flex-col overflow-hidden rounded-3xl sm:rounded-[80px] xl:rounded-[120px] border border-[#050505] bg-[#020202] text-white shadow-[0_60px_120px_rgba(0,0,0,0.55)]",
        className
      )}
    >
      {children}
    </div>
  );
}
