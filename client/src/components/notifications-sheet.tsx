import { Bell, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

export interface Notification {
  id: number | string;
  title: string;
  message: string;
  time: string;
  unread?: boolean;
}

interface NotificationsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: Notification[];
  onNotificationClick?: (notification: Notification) => void;
  onViewAll?: () => void;
}

export default function NotificationsSheet({
  open,
  onOpenChange,
  notifications,
  onNotificationClick,
  onViewAll,
}: NotificationsSheetProps) {
  const { showToast } = useNotifications();
  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleNotificationClick = (notification: Notification) => {
    if (onNotificationClick) {
      onNotificationClick(notification);
    } else {
      showToast({
        type: "info",
        message: notification.title,
        description: notification.message,
      });
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[70dvh]">
        {/* Drag Handle */}
        <div className="flex justify-center pt-2 pb-4">
          <div className="h-1 w-10 rounded-full bg-[#3a3a3a]" />
        </div>

        <SheetHeader className="flex-row items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-[#1a1a1a]">
              <Bell className="h-5 w-5 text-[#cfe0ad]" />
            </div>
            <SheetTitle className="text-lg xs:text-xl font-semibold">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-sm font-normal text-[#888]">
                  ({unreadCount} new)
                </span>
              )}
            </SheetTitle>
          </div>
          <SheetClose asChild>
            <button
              className="p-2 rounded-full hover:bg-[#1a1a1a] transition touch-target focus-ring"
              aria-label="Close notifications"
            >
              <X className="h-5 w-5 text-[#888]" />
            </button>
          </SheetClose>
        </SheetHeader>

        <div className="max-h-[50dvh] overflow-y-auto -mx-5 xs:-mx-6 sm:-mx-8 md:-mx-10 touch-scroll">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="h-12 w-12 mx-auto text-[#3a3a3a] mb-4" />
              <p className="text-sm text-[#888]">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notif, idx) => (
              <button
                key={notif.id}
                className={cn(
                  "w-full p-4 xs:p-5 text-left transition touch-target",
                  "border-b border-[#1a1a1a] last:border-b-0",
                  "hover:bg-[#151515] active:bg-[#1a1a1a]",
                  notif.unread && "bg-[#0f1510]"
                )}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="flex items-start gap-3">
                  {notif.unread && (
                    <span className="h-2 w-2 rounded-full bg-[#cfe0ad] mt-2 shrink-0 animate-pulse" />
                  )}
                  <div className={cn("flex-1 min-w-0", !notif.unread && "ml-5")}>
                    <p className="text-sm xs:text-base font-semibold text-white truncate">
                      {notif.title}
                    </p>
                    <p className="text-xs xs:text-sm text-[#888] line-clamp-2 mt-0.5">
                      {notif.message}
                    </p>
                  </div>
                  <span className="text-[0.65rem] xs:text-xs text-[#666] shrink-0">
                    {notif.time}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="pt-4 border-t border-[#1a1a1a] mt-4">
            <button
              onClick={() => {
                onViewAll?.();
                onOpenChange(false);
              }}
              className="w-full py-3 text-sm xs:text-base font-semibold text-[#cfe0ad] hover:bg-[#151515] rounded-xl transition touch-target focus-ring"
            >
              View All Notifications
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
