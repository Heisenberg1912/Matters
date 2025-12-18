import { Boxes, Home, UserRound, Wallet } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/home", label: "HOME", shortLabel: "HOME", icon: Home },
  { to: "/budget", label: "BUDGET", shortLabel: "BUDGET", icon: Wallet },
  { to: "/inventory", label: "INVENTORY", shortLabel: "ITEMS", icon: Boxes },
  { to: "/contractor", label: "CONTRACTOR", shortLabel: "TEAM", icon: UserRound }
];

export default function BottomNav() {
  return (
    <nav className="sticky bottom-0 z-30 bg-[#090909] safe-bottom">
      <div className={cn(
        "mx-auto grid w-full max-w-[980px] grid-cols-4 border-t border-border",
        "px-2 py-3 xs:px-3 xs:py-4 sm:px-4 sm:py-5 md:py-6",
        "text-[0.6rem] xs:text-[0.65rem] sm:text-xs tracking-[0.1em] xs:tracking-[0.15em] sm:tracking-[0.2em] text-muted"
      )}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 xs:gap-1 rounded-xl px-1 xs:px-2 py-1 transition active:scale-95",
                isActive ? "text-[var(--pill,#cfe0ad)]" : "text-[#bdbdbd]"
              )
            }
          >
            <item.icon className="h-5 w-5 xs:h-6 xs:w-6 sm:h-7 sm:w-7" strokeWidth={1.4} />
            <span className="hidden xs:inline">{item.label}</span>
            <span className="xs:hidden">{item.shortLabel}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
