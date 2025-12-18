import { useState, type PropsWithChildren } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type FilterSheetProps = PropsWithChildren<{
  title?: string;
  triggerLabel?: string;
  onApply?: () => void;
  onClear?: () => void;
}>;

export function FilterSheet({ title = "Filters", triggerLabel = "Filters", onApply, onClear, children }: FilterSheetProps) {
  const [open, setOpen] = useState(false);

  const handleApply = () => {
    onApply?.();
    setOpen(false);
  };

  const handleClear = () => {
    onClear?.();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="rounded-full border border-[#2a2a2a] bg-[#0c0c0c] px-4 py-2 text-sm font-semibold text-white transition hover:border-[#cfe0ad]"
        >
          {triggerLabel}
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="bg-[#080808] text-white sm:max-w-[520px]">
        <SheetHeader>
          <SheetTitle className="text-xl font-semibold">{title}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {children}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#1f1f1f] bg-[#0c0c0c] p-3">
            <button
              type="button"
              className="rounded-full px-4 py-2 text-sm font-semibold text-[#cfe0ad]"
              onClick={handleClear}
            >
              Clear
            </button>
            <button
              type="button"
              className="rounded-full bg-[#cfe0ad] px-5 py-2 text-sm font-semibold text-black"
              onClick={handleApply}
            >
              Apply
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
