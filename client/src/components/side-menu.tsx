import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const menuItems = [
  { label: "Your Subscription", path: "/subscription" },
  { label: "Hire a Contractor", path: "/hire-contractor" },
  { label: "Privacy Policy", path: "/privacy-policy" },
  { label: "News & Updates", path: "/news-updates" },
  { label: "Visit Builtattic", path: "/visit-builtattic" },
  { label: "Settings", path: "/settings" },
];

interface SideMenuProps {
  className?: string;
}

export default function SideMenu({ className }: SideMenuProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <SheetContent className={className}>
      <div className="space-y-5 xs:space-y-6 sm:space-y-8 md:space-y-10 text-base xs:text-lg sm:text-xl md:text-2xl pt-6 xs:pt-8 sm:pt-10">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={cn(
              "w-full text-left font-medium transition",
              "hover:text-[#cfe0ad] active:scale-[0.98]",
              "touch-target focus-ring rounded-lg -ml-2 pl-2"
            )}
          >
            {item.label}
          </button>
        ))}

        <div className="mt-10 xs:mt-14 sm:mt-20 md:mt-24 flex items-center gap-3 xs:gap-4 sm:gap-5 md:gap-6 rounded-[24px] xs:rounded-[32px] sm:rounded-[40px] md:rounded-[50px] border border-[#1f1f1f] bg-[#0a0a0a] p-4 xs:p-5 sm:p-6 md:p-8">
          <Avatar className="h-10 w-10 xs:h-12 xs:w-12 sm:h-14 sm:w-14 md:h-16 md:w-16">
            <AvatarFallback>{user?.name?.slice(0, 1) || "G"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm xs:text-base sm:text-lg md:text-xl font-semibold">
              {user?.name || "Guest #0102"}
            </p>
            <button
              onClick={() => navigate("/settings")}
              className="text-[0.65rem] xs:text-xs sm:text-sm text-muted hover:text-[#cfe0ad] transition focus-ring rounded"
            >
              View Profile
            </button>
          </div>
        </div>
      </div>
    </SheetContent>
  );
}
