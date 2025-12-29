import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronLeft, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SheetTrigger } from "@/components/ui/sheet";
import ProjectSwitcher from "@/components/project-switcher";
import { useAuth } from "@/context/AuthContext";
import { useProject } from "@/context/ProjectContext";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title?: string;
  showNotifications?: boolean;
  notificationCount?: number;
  onNotificationClick?: () => void;
  className?: string;
  /** Show back button */
  showBackButton?: boolean;
  /** Custom back handler (defaults to navigate(-1)) */
  onBack?: () => void;
}

export default function PageHeader({
  title,
  showNotifications = false,
  notificationCount = 0,
  onNotificationClick,
  className,
  showBackButton = false,
  onBack,
}: PageHeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentProject } = useProject();

  const handleBack = useCallback(() => {
    // Haptic feedback for mobile
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  }, [onBack, navigate]);

  return (
    <header
      className={cn(
        "flex flex-col gap-3 xs:gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6",
        "rounded-b-[30px] xs:rounded-b-[40px] sm:rounded-b-[50px] md:rounded-b-[60px]",
        "border-b border-[#1f1f1f] bg-[#050505]",
        "px-4 py-4 xs:px-5 xs:py-5 sm:px-6 sm:py-8 md:px-10 md:py-10 lg:px-24 lg:py-16",
        className
      )}
    >
      <div className="flex items-center gap-3 xs:gap-4 sm:gap-6 flex-1">
        {/* Back Button */}
        {showBackButton && (
          <button
            type="button"
            onClick={handleBack}
            className="shrink-0 p-2 -ml-2 rounded-full text-white hover:bg-[#1a1a1a] active:scale-95 transition touch-target focus-ring"
            aria-label="Go back"
          >
            <ChevronLeft className="h-6 w-6 xs:h-7 xs:w-7" />
          </button>
        )}

        <SheetTrigger asChild>
          <button type="button" className="shrink-0 touch-target focus-ring rounded-full">
            <Avatar className="h-10 w-10 xs:h-12 xs:w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 border-2 border-[#232323]">
              <AvatarFallback className="text-sm xs:text-base sm:text-lg md:text-xl">
                {user?.name?.slice(0, 1) || "G"}
              </AvatarFallback>
            </Avatar>
          </button>
        </SheetTrigger>

        <div className="flex flex-col text-white min-w-0 flex-1">
          <span className="text-base xs:text-lg sm:text-2xl md:text-3xl font-semibold truncate">
            Oh Hi, {user?.name?.split(" ")[0] || "Guest"}!
          </span>
          <span className="text-[0.6rem] xs:text-xs sm:text-sm uppercase tracking-[0.15em] xs:tracking-[0.25em] sm:tracking-[0.35em] text-[#c7c7c7] truncate">
            {title || currentProject?.name || "Select a project"}
          </span>
          <ProjectSwitcher className="mt-2 w-fit" />
        </div>

        {/* Notifications Bell */}
        {showNotifications && (
          <button
            type="button"
            onClick={onNotificationClick}
            aria-label="Open notifications"
            className="relative p-2 rounded-full border border-[#2a2a2a] bg-[#0c0c0c] transition hover:border-[#3a3a3a] active:scale-95 touch-target focus-ring"
          >
            <Bell className="h-5 w-5 xs:h-6 xs:w-6 text-white" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 xs:h-5 xs:w-5 flex items-center justify-center rounded-full bg-[#cfe0ad] text-[0.6rem] xs:text-xs font-bold text-black animate-pulse-glow">
                {notificationCount}
              </span>
            )}
          </button>
        )}
        {/* Settings Button */}
        <button
          type="button"
          onClick={() => navigate("/settings")}
          aria-label="Settings"
          className="p-2 rounded-full border border-[#2a2a2a] bg-[#0c0c0c] transition hover:border-[#3a3a3a] active:scale-95 touch-target focus-ring"
        >
          <Settings className="h-5 w-5 xs:h-6 xs:w-6 text-white" />
        </button>
      </div>
    </header>
  );
}
