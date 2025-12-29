import { motion } from "framer-motion";
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
import { NavLink, useLocation } from "react-router-dom";
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
    navigator.vibrate(8);
  }
};

export default function BottomNav() {
  const { isCustomer, isContractor, isAdmin } = useAuth();
  const location = useLocation();

  // Get nav items based on role
  const getNavItems = (): NavItem[] => {
    if (isAdmin) return adminNavItems;
    if (isContractor) return contractorNavItems;
    return customerNavItems;
  };

  const navItems = getNavItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 safe-bottom">
      {/* Gradient blur backdrop */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-[#090909]/95 to-[#090909]/80 backdrop-blur-xl" />

      {/* Top border glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#cfe0ad]/20 to-transparent" />

      <div
        className={cn(
          "relative mx-auto grid w-full max-w-[980px] grid-cols-4",
          "px-2 py-2.5 xs:px-3 xs:py-3 sm:px-4 sm:py-4 md:py-5",
          "text-[0.55rem] xs:text-[0.6rem] sm:text-xs tracking-[0.08em] xs:tracking-[0.12em] sm:tracking-[0.15em]"
        )}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.to ||
            (item.to !== "/" && location.pathname.startsWith(item.to));

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={triggerHaptic}
              className={cn(
                "relative flex flex-col items-center gap-0.5 xs:gap-1 rounded-xl xs:rounded-2xl px-1 xs:px-2 py-2 xs:py-2.5",
                "transition-all duration-200 touch-target focus-ring no-select",
                isActive ? "text-[#cfe0ad]" : "text-neutral-500 hover:text-neutral-300"
              )}
            >
              {/* Active indicator background */}
              {isActive && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute inset-0 rounded-xl xs:rounded-2xl bg-[#cfe0ad]/10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}

              {/* Icon container */}
              <motion.div
                className="relative z-10"
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.1 }}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 xs:h-6 xs:w-6 sm:h-7 sm:w-7 transition-all duration-200",
                    isActive ? "stroke-[2]" : "stroke-[1.5]"
                  )}
                />

                {/* Active glow effect */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-[#cfe0ad] blur-md opacity-30"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1.5 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.div>

              {/* Label */}
              <motion.span
                className={cn(
                  "relative z-10 font-medium transition-all duration-200",
                  isActive ? "opacity-100" : "opacity-70"
                )}
                animate={{ y: isActive ? 0 : 1 }}
              >
                <span className="hidden xs:inline">{item.label}</span>
                <span className="xs:hidden">{item.shortLabel}</span>
              </motion.span>

              {/* Active dot indicator */}
              {isActive && (
                <motion.div
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#cfe0ad]"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
