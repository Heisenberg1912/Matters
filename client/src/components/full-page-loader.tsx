import PhoneShell from "@/components/phone-shell";
import { Loader2 } from "lucide-react";

interface FullPageLoaderProps {
  label?: string;
}

export default function FullPageLoader({ label = "Loading..." }: FullPageLoaderProps) {
  return (
    <PhoneShell className="items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#cfe0ad]" />
        <p className="text-sm text-[#bdbdbd]">{label}</p>
      </div>
    </PhoneShell>
  );
}
