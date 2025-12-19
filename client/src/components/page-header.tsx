import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SheetTrigger } from "@/components/ui/sheet";
import ProjectSwitcher from "@/components/project-switcher";
import { useAuth } from "@/context/AuthContext";
import { useProject } from "@/context/ProjectContext";
import { useProjectStore } from "@/store";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title?: string;
  showModeToggle?: boolean;
  showNotifications?: boolean;
  notificationCount?: number;
  onNotificationClick?: () => void;
  className?: string;
}

export default function PageHeader({
  title,
  showModeToggle = true,
  showNotifications = false,
  notificationCount = 0,
  onNotificationClick,
  className,
}: PageHeaderProps) {
  const { user } = useAuth();
  const { currentProject } = useProject();
  const mode = useProjectStore((state) => state.mode);
  const setMode = useProjectStore((state) => state.setMode);

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
      </div>

      {/* Mode Toggle */}
      {showModeToggle && (
        <div className="flex rounded-full border border-[#2a2a2a] bg-[#0c0c0c] p-1 xs:p-1.5 sm:p-2 text-[0.65rem] xs:text-xs sm:text-sm md:text-base font-semibold sm:ml-auto self-start sm:self-auto w-fit">
          {(["construction", "refurbish"] as const).map((state) => (
            <button
              key={state}
              type="button"
              onClick={() => setMode(state)}
              className={cn(
                "rounded-full px-2.5 py-1 xs:px-3 xs:py-1.5 sm:px-4 sm:py-2 md:px-6 transition active:scale-95 touch-target focus-ring",
                mode === state ? "bg-[var(--pill,#cfe0ad)] text-black" : "text-white"
              )}
            >
              <span className="hidden sm:inline">{state.toUpperCase()}</span>
              <span className="sm:hidden">{state === "construction" ? "BUILD" : "REFURB"}</span>
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
