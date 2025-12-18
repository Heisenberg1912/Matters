import type { PropsWithChildren } from "react";
import { NotificationProvider as NotificationContextProvider } from "@/hooks/use-notifications";
import ToastViewport from "./toast";

export default function NotificationProvider({ children }: PropsWithChildren) {
  return (
    <NotificationContextProvider>
      {children}
      <ToastViewport />
    </NotificationContextProvider>
  );
}
