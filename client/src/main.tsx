import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import "./index.css";
import NotificationProvider from "@/components/notification-provider";
import { OfflineProvider } from "@/hooks/use-offline";
import { ThemeProvider } from "@/hooks/use-theme";
import { registerServiceWorker } from "@/lib/offline-manager";

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
if (!clerkKey) {
  console.warn("Missing VITE_CLERK_PUBLISHABLE_KEY for Clerk.");
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkKey || ""} afterSignOutUrl="/login">
      <ThemeProvider>
        <OfflineProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </OfflineProvider>
      </ThemeProvider>
    </ClerkProvider>
  </React.StrictMode>
);

void registerServiceWorker();
