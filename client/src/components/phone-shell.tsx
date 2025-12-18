import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

export default function PhoneShell({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "flex w-full flex-col overflow-hidden bg-[#020202] text-white",
        "min-h-[100dvh] sm:min-h-[720px]",
        "max-w-full sm:max-w-screen-md md:max-w-screen-lg xl:max-w-[1320px]",
        "rounded-none sm:rounded-[40px] md:rounded-[60px] lg:rounded-[80px] xl:rounded-[100px]",
        "border-0 sm:border sm:border-[#050505]",
        "shadow-none sm:shadow-[0_40px_80px_rgba(0,0,0,0.45)] lg:shadow-[0_60px_120px_rgba(0,0,0,0.55)]",
        className
      )}
    >
      {children}
    </div>
  );
}
