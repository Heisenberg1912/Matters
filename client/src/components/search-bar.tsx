import { useState } from "react";
import { cn } from "@/lib/utils";

type SearchBarProps = {
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  className?: string;
};

export function SearchBar({ placeholder = "Search", value, defaultValue, onChange, onSubmit, className }: SearchBarProps) {
  const [internal, setInternal] = useState(defaultValue ?? "");
  const val = value !== undefined ? value : internal;

  const handleChange = (next: string) => {
    if (value === undefined) setInternal(next);
    onChange?.(next);
  };

  return (
    <form
      className={cn("flex items-center gap-3 rounded-full border border-[#1f1f1f] bg-[#0b0b0b] px-4 py-2 text-white shadow-sm", className)}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(val);
      }}
    >
      <span className="text-lg text-[#cfe0ad]">⌕</span>
      <input
        className="w-full bg-transparent text-base text-white outline-none placeholder:text-[#8e8e8e]"
        placeholder={placeholder}
        value={val}
        onChange={(e) => handleChange(e.target.value)}
      />
      <button
        type="submit"
        className="rounded-full bg-[#cfe0ad] px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
        aria-label="Search"
      >
        Go
      </button>
    </form>
  );
}
