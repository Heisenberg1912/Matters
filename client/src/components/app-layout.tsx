import { Outlet } from "react-router-dom";
import BottomNav from "./bottom-nav";

/**
 * Main app layout that wraps all authenticated pages
 * Provides consistent bottom navigation across all screens
 */
export default function AppLayout() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#010101]">
      {/* Page content */}
      <div className="flex-1">
        <Outlet />
      </div>

      {/* Bottom Navigation - always visible */}
      <BottomNav />
    </div>
  );
}
