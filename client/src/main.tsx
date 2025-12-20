import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import NotificationProvider from "@/components/notification-provider";
import { OfflineProvider } from "@/hooks/use-offline";
import { ThemeProvider } from "@/hooks/use-theme";
import { registerServiceWorker } from "@/lib/offline-manager";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <OfflineProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </OfflineProvider>
    </ThemeProvider>
  </React.StrictMode>
);

void registerServiceWorker();
