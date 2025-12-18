import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

type OfflineAction = {
  id: string;
  type: string;
  payload?: unknown;
};

type OfflineContextValue = {
  isOnline: boolean;
  queue: OfflineAction[];
  lastSynced: number | null;
  enqueue: (action: OfflineAction) => void;
  clearQueue: () => void;
  syncNow: () => void;
};

const OfflineContext = createContext<OfflineContextValue | null>(null);
const STORAGE_KEY = "matters-offline-queue";

export function OfflineProvider({ children }: PropsWithChildren) {
  const [queue, setQueue] = useState<OfflineAction[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as OfflineAction[]) : [];
  });
  const [lastSynced, setLastSynced] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  }, [queue]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const enqueue = useCallback((action: OfflineAction) => {
    setQueue((prev) => [...prev, action]);
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  const syncNow = useCallback(() => {
    if (!queue.length) {
      setLastSynced(Date.now());
      return;
    }
    // Here we would send queued actions to the server. For now we clear and mark synced.
    setQueue([]);
    setLastSynced(Date.now());
  }, [queue.length]);

  const value = useMemo(
    () => ({
      isOnline,
      queue,
      lastSynced,
      enqueue,
      clearQueue,
      syncNow
    }),
    [isOnline, queue, lastSynced, enqueue, clearQueue, syncNow]
  );

  return createElement(OfflineContext.Provider, { value }, children);
}

export function useOffline() {
  const ctx = useContext(OfflineContext);
  if (!ctx) {
    throw new Error("useOffline must be used within OfflineProvider");
  }
  return ctx;
}
