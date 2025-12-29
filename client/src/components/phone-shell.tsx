import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

export default function PhoneShell({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "flex w-full flex-col overflow-hidden bg-[#020202] text-white min-h-[100dvh]",
        className
      )}
    >
      {children}
    </div>
  );
}
