import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren
} from "react";
import toast from "react-hot-toast";

type NotificationType = "success" | "error" | "info" | "warning";

export type NotificationPayload = {
  id?: string;
  type?: NotificationType;
  message: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
};

export type NotificationItem = NotificationPayload & {
  id: string;
  createdAt: number;
  read?: boolean;
};

type NotificationContextValue = {
  notifications: NotificationItem[];
  showToast: (payload: NotificationPayload) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: PropsWithChildren) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const lastToastRef = useRef<string | null>(null);

  const showToast = useCallback((payload: NotificationPayload) => {
    const id = payload.id ?? (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
    const item: NotificationItem = {
      ...payload,
      id,
      createdAt: Date.now()
    };
    setNotifications((prev) => [item, ...prev].slice(0, 50));
    lastToastRef.current = id;

    const icon = payload.type === "success" ? "✅" : payload.type === "error" ? "⚠️" : payload.type === "warning" ? "ℹ️" : "💡";

    toast(`${payload.message}${payload.description ? ` – ${payload.description}` : ""}`, {
      id,
      duration: payload.duration ?? 3500,
      icon
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const value = useMemo(
    () => ({
      notifications,
      showToast,
      markAsRead,
      clearAll
    }),
    [notifications, showToast, markAsRead, clearAll]
  );

  return createElement(NotificationContext.Provider, { value }, children);
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
}
