export async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("/service-worker.js", { scope: "/" });
      console.info("Service worker registered");
    } catch (error) {
      console.error("Service worker registration failed", error);
    }
  }
}

export function getLastSynced(): number | null {
  const value = localStorage.getItem("matters-last-synced");
  return value ? Number(value) : null;
}

export function setLastSynced(timestamp: number) {
  localStorage.setItem("matters-last-synced", `${timestamp}`);
}

export function queueAction(action: unknown) {
  const existing = localStorage.getItem("matters-offline-queue");
  const queue = existing ? (JSON.parse(existing) as unknown[]) : [];
  queue.push(action);
  localStorage.setItem("matters-offline-queue", JSON.stringify(queue));
}
