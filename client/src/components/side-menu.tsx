import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  Building2,
  ClipboardList,
  FileText,
  Hammer,
  HardHat,
  LayoutDashboard,
  LogOut,
  Settings,
  Star,
  Ticket,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  Activity,
} from "lucide-react";

type MenuItem = {
  label: string;
  path: string;
  icon?: React.ElementType;
  roles?: ("user" | "contractor" | "admin" | "superadmin")[];
};

// Customer menu items
const customerMenuItems: MenuItem[] = [
  { label: "Dashboard", path: "/customer/dashboard", icon: LayoutDashboard },
  { label: "My Projects", path: "/home", icon: Building2 },
  { label: "Post a Job", path: "/customer/post-job", icon: Briefcase },
  { label: "View Bids", path: "/customer/bids", icon: ClipboardList },
  { label: "Progress Tracking", path: "/customer/progress", icon: Activity },
  { label: "Hire a Contractor", path: "/hire-contractor", icon: HardHat },
  { label: "Documents", path: "/documents", icon: FileText },
  { label: "Your Subscription", path: "/subscription", icon: Star },
  { label: "Settings", path: "/settings", icon: Settings },
];

// Contractor menu items
const contractorMenuItems: MenuItem[] = [
  { label: "Dashboard", path: "/contractor/dashboard", icon: LayoutDashboard },
  { label: "Available Jobs", path: "/contractor/jobs", icon: Briefcase },
  { label: "My Bids", path: "/contractor/bids", icon: ClipboardList },
  { label: "My Assignments", path: "/contractor/assignments", icon: Hammer },
  { label: "Submit Progress", path: "/contractor/progress", icon: TrendingUp },
  { label: "Earnings", path: "/contractor/earnings", icon: Wallet },
  { label: "My Profile", path: "/contractor/profile", icon: UserCheck },
  { label: "Settings", path: "/settings", icon: Settings },
];

// Admin menu items
const adminMenuItems: MenuItem[] = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "User Management", path: "/admin/users", icon: Users },
  { label: "Project Oversight", path: "/admin/projects", icon: Building2 },
  { label: "Contractor Verification", path: "/admin/contractors", icon: UserCheck },
  { label: "Support Tickets", path: "/admin/tickets", icon: Ticket },
  { label: "Analytics", path: "/admin/analytics", icon: TrendingUp },
  { label: "Settings", path: "/settings", icon: Settings },
];

// Common menu items for all roles
const commonMenuItems: MenuItem[] = [
  { label: "Privacy Policy", path: "/privacy-policy" },
  { label: "News & Updates", path: "/news-updates" },
];

interface SideMenuProps {
  className?: string;
}

const roleLabels: Record<string, string> = {
  user: "Customer",
  contractor: "Contractor",
  admin: "Admin",
  superadmin: "Super Admin",
};

export default function SideMenu({ className }: SideMenuProps) {
  const navigate = useNavigate();
  const { user, isCustomer, isContractor, isAdmin, logout } = useAuth();

  // Get menu items based on role
  const getMenuItems = (): MenuItem[] => {
    if (isAdmin) return adminMenuItems;
    if (isContractor) return contractorMenuItems;
    return customerMenuItems;
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const menuItems = getMenuItems();
  const currentRole = user?.role || "user";

  return (
    <SheetContent className={className}>
      <div className="space-y-4 xs:space-y-5 sm:space-y-6 md:space-y-8 text-base xs:text-lg sm:text-xl md:text-2xl pt-6 xs:pt-8 sm:pt-10">
        {/* Role Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs px-2 py-1 rounded-full bg-[#cfe0ad]/20 text-[#cfe0ad]">
            {roleLabels[currentRole]}
          </span>
        </div>

        {/* Main Menu Items */}
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full text-left font-medium transition flex items-center gap-3",
                "hover:text-[#cfe0ad] active:scale-[0.98]",
                "touch-target focus-ring rounded-lg -ml-2 pl-2"
              )}
            >
              {Icon && <Icon className="h-5 w-5 opacity-70" />}
              {item.label}
            </button>
          );
        })}

        {/* Divider */}
        <div className="border-t border-[#1f1f1f] my-4" />

        {/* Common Items */}
        {commonMenuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={cn(
              "w-full text-left font-medium transition text-sm opacity-70",
              "hover:text-[#cfe0ad] hover:opacity-100 active:scale-[0.98]",
              "touch-target focus-ring rounded-lg -ml-2 pl-2"
            )}
          >
            {item.label}
          </button>
        ))}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={cn(
            "w-full text-left font-medium transition flex items-center gap-3 text-red-400",
            "hover:text-red-300 active:scale-[0.98]",
            "touch-target focus-ring rounded-lg -ml-2 pl-2"
          )}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>

        {/* User Profile Card */}
        <div className="mt-6 xs:mt-8 sm:mt-10 md:mt-12 flex items-center gap-3 xs:gap-4 sm:gap-5 md:gap-6 rounded-[24px] xs:rounded-[32px] sm:rounded-[40px] md:rounded-[50px] border border-[#1f1f1f] bg-[#0a0a0a] p-4 xs:p-5 sm:p-6 md:p-8">
          <Avatar className="h-10 w-10 xs:h-12 xs:w-12 sm:h-14 sm:w-14 md:h-16 md:w-16">
            <AvatarFallback>{user?.name?.slice(0, 1) || "G"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm xs:text-base sm:text-lg md:text-xl font-semibold">
              {user?.name || "Guest"}
            </p>
            <p className="text-[0.65rem] xs:text-xs sm:text-sm text-muted">
              {user?.email || ""}
            </p>
          </div>
        </div>
      </div>
    </SheetContent>
  );
}
