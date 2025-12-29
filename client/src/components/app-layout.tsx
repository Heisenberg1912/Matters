import { Outlet } from "react-router-dom";
import BottomNav from "./bottom-nav";

/**
 * Main app layout that wraps all authenticated pages
 * Provides consistent bottom navigation across all screens
 */
export default function AppLayout() {
  return (
    <div className="min-h-[100dvh] w-full bg-[#010101]">
      {/* Page content with bottom padding for fixed nav */}
      <div className="w-full pb-20 xs:pb-24 sm:pb-28">
        <Outlet />
      </div>

      {/* Bottom Navigation - fixed at bottom */}
      <BottomNav />
    </div>
  );
}
