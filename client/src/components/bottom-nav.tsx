import { Boxes, Home, UserRound, Wallet } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/home", label: "HOME", icon: Home },
  { to: "/budget", label: "BUDGET", icon: Wallet },
  { to: "/inventory", label: "INVENTORY", icon: Boxes },
  { to: "/contractor", label: "CONTRACTOR", icon: UserRound }
];

export default function BottomNav() {
  return (
    <nav className="sticky bottom-0 z-30 bg-[#090909]">
      <div className="mx-auto grid w-full max-w-[980px] grid-cols-4 border-t border-border px-4 py-6 text-xs tracking-[0.2em] text-muted">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 rounded-xl px-2 py-1 transition",
                isActive ? "text-[var(--pill,#cfe0ad)]" : "text-[#bdbdbd]"
              )
            }
          >
            <item.icon size={28} strokeWidth={1.4} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
