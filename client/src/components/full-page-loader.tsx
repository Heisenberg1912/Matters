import { Loader2 } from "lucide-react";

interface FullPageLoaderProps {
  label?: string;
}

export default function FullPageLoader({ label = "Loading..." }: FullPageLoaderProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#010101]">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#cfe0ad]" />
        <p className="text-sm text-[#bdbdbd]">{label}</p>
      </div>
    </div>
  );
}
