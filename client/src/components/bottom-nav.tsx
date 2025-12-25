import {
  Boxes,
  Briefcase,
  Building2,
  ClipboardList,
  Hammer,
  Home,
  LayoutDashboard,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

type NavItem = {
  to: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
};

// Customer navigation
const customerNavItems: NavItem[] = [
  { to: "/customer/dashboard", label: "DASHBOARD", shortLabel: "HOME", icon: LayoutDashboard },
  { to: "/customer/bids", label: "BIDS", shortLabel: "BIDS", icon: ClipboardList },
  { to: "/home", label: "PROJECTS", shortLabel: "PROJ", icon: Building2 },
  { to: "/customer/post-job", label: "POST JOB", shortLabel: "POST", icon: Briefcase },
];

// Contractor navigation
const contractorNavItems: NavItem[] = [
  { to: "/contractor/dashboard", label: "HOME", shortLabel: "HOME", icon: Home },
  { to: "/contractor/jobs", label: "JOBS", shortLabel: "JOBS", icon: Briefcase },
  { to: "/contractor/assignments", label: "PROJECTS", shortLabel: "WORK", icon: Hammer },
  { to: "/contractor/earnings", label: "EARNINGS", shortLabel: "EARN", icon: Wallet },
];

// Admin navigation
const adminNavItems: NavItem[] = [
  { to: "/admin/dashboard", label: "DASHBOARD", shortLabel: "HOME", icon: LayoutDashboard },
  { to: "/admin/users", label: "USERS", shortLabel: "USERS", icon: Users },
  { to: "/admin/projects", label: "PROJECTS", shortLabel: "PROJ", icon: Building2 },
  { to: "/admin/analytics", label: "ANALYTICS", shortLabel: "STATS", icon: TrendingUp },
];

// Haptic feedback for supported devices
const triggerHaptic = () => {
  if (navigator.vibrate) {
    navigator.vibrate(10);
  }
};

export default function BottomNav() {
  const { isCustomer, isContractor, isAdmin } = useAuth();

  // Get nav items based on role
  const getNavItems = (): NavItem[] => {
    if (isAdmin) return adminNavItems;
    if (isContractor) return contractorNavItems;
    return customerNavItems;
  };

  const navItems = getNavItems();

  return (
    <nav className="sticky bottom-0 z-30 bg-[#090909] safe-bottom">
      <div
        className={cn(
          "mx-auto grid w-full max-w-[980px] grid-cols-4 border-t border-border",
          "px-2 py-3 xs:px-3 xs:py-4 sm:px-4 sm:py-5 md:py-6",
          "text-[0.6rem] xs:text-[0.65rem] sm:text-xs tracking-[0.1em] xs:tracking-[0.15em] sm:tracking-[0.2em] text-muted"
        )}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={triggerHaptic}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 xs:gap-1 rounded-xl px-1 xs:px-2 py-1",
                "transition active:scale-95 touch-target focus-ring no-select",
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
