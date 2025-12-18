import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, actionLabel, onAction, icon, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#1f1f1f] bg-[#0b0b0b] px-6 py-10 text-center text-white",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#141414] text-2xl">{icon ?? "🌑"}</div>
      <p className="text-xl font-semibold">{title}</p>
      {description && <p className="text-sm text-[#9a9a9a]">{description}</p>}
      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 rounded-full bg-[#cfe0ad] px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
