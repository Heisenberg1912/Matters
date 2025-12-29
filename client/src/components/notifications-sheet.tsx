import { Bell, X, Check, CheckCheck, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
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
  onMarkAllAsRead?: () => void;
  onClearAll?: () => void;
  onViewAll?: () => void;
}

export default function NotificationsSheet({
  open,
  onOpenChange,
  notifications,
  onNotificationClick,
  onMarkAllAsRead,
  onClearAll,
  onViewAll,
}: NotificationsSheetProps) {
  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleNotificationClick = (notification: Notification) => {
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
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
          <div className="flex items-center gap-2">
            {unreadCount > 0 && onMarkAllAsRead && (
              <button
                onClick={onMarkAllAsRead}
                className="p-2 rounded-full hover:bg-[#1a1a1a] transition touch-target focus-ring"
                aria-label="Mark all as read"
                title="Mark all as read"
              >
                <CheckCheck className="h-5 w-5 text-[#cfe0ad]" />
              </button>
            )}
            {notifications.length > 0 && onClearAll && (
              <button
                onClick={onClearAll}
                className="p-2 rounded-full hover:bg-[#1a1a1a] transition touch-target focus-ring"
                aria-label="Clear all notifications"
                title="Clear all"
              >
                <Trash2 className="h-5 w-5 text-[#888]" />
              </button>
            )}
            <SheetClose asChild>
              <button
                className="p-2 rounded-full hover:bg-[#1a1a1a] transition touch-target focus-ring"
                aria-label="Close notifications"
              >
                <X className="h-5 w-5 text-[#888]" />
              </button>
            </SheetClose>
          </div>
        </SheetHeader>

        <div className="max-h-[50dvh] overflow-y-auto -mx-5 xs:-mx-6 sm:-mx-8 md:-mx-10 touch-scroll">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="h-12 w-12 mx-auto text-[#3a3a3a] mb-4" />
              <p className="text-sm text-[#888]">No notifications yet</p>
              <p className="text-xs text-[#666] mt-1">
                You'll see updates about your projects here
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
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
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[0.65rem] xs:text-xs text-[#666]">
                      {notif.time}
                    </span>
                    {notif.unread && (
                      <Check className="h-4 w-4 text-[#666] hover:text-[#cfe0ad]" />
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {notifications.length > 0 && onViewAll && (
          <div className="pt-4 border-t border-[#1a1a1a] mt-4">
            <button
              onClick={() => {
                onViewAll();
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
