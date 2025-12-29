import type { PropsWithChildren, ReactNode } from "react";
import PhoneShell from "@/components/phone-shell";
import BottomNav from "@/components/bottom-nav";
import PageHeader from "@/components/page-header";
import SideMenu from "@/components/side-menu";
import Breadcrumbs from "@/components/breadcrumbs";
import { AnimatedPage } from "@/components/AnimatedPage";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
  /** Title shown in header subtitle area */
  title?: string;
  /** Show the construction/refurbish mode toggle */
  showModeToggle?: boolean;
  /** Show the bottom navigation */
  showBottomNav?: boolean;
  /** Custom header component (replaces default PageHeader) */
  customHeader?: ReactNode;
  /** Show notifications bell in header */
  showNotifications?: boolean;
  /** Notification count for badge */
  notificationCount?: number;
  /** Callback when notification bell is clicked */
  onNotificationClick?: () => void;
  /** Additional class names for the main content area */
  contentClassName?: string;
  /** Whether to wrap in AnimatedPage for transitions */
  animated?: boolean;
  /** Additional elements to render (FAB, modals, etc) */
  extras?: ReactNode;
  /** Show breadcrumbs navigation */
  showBreadcrumbs?: boolean;
  /** Override breadcrumb label for current page */
  breadcrumbLabel?: string;
  /** Show back button in header */
  showBackButton?: boolean;
  /** Custom back handler */
  onBack?: () => void;
}

export default function PageLayout({
  children,
  title,
  showModeToggle = true,
  showBottomNav = false,
  customHeader,
  showNotifications = false,
  notificationCount = 0,
  onNotificationClick,
  contentClassName,
  animated = true,
  extras,
  showBreadcrumbs = false,
  breadcrumbLabel,
  showBackButton = false,
  onBack,
}: PropsWithChildren<PageLayoutProps>) {
  const content = (
    <PhoneShell>
      <Sheet>
        <div className="flex h-full flex-col">
          {/* Header */}
          {customHeader ?? (
            <PageHeader
              title={title}
              showModeToggle={showModeToggle}
              showNotifications={showNotifications}
              notificationCount={notificationCount}
              onNotificationClick={onNotificationClick}
              showBackButton={showBackButton}
              onBack={onBack}
            />
          )}

          {/* Breadcrumbs */}
          {showBreadcrumbs && (
            <div className="px-3 xs:px-4 sm:px-6 md:px-10 lg:px-24 bg-[#050505]">
              <Breadcrumbs currentLabel={breadcrumbLabel} />
            </div>
          )}

          {/* Main Content */}
          <main
            className={cn(
              "flex-1 overflow-y-auto touch-scroll page-scroll",
              "px-3 xs:px-4 sm:px-6 md:px-10 lg:px-24",
              "pb-20 xs:pb-24 sm:pb-28 md:pb-32",
              contentClassName
            )}
          >
            <div className="mx-auto w-full max-w-6xl">
              {children}
            </div>
          </main>

          {/* Extras (FAB, etc) */}
          {extras}

          {/* Bottom Navigation */}
          {showBottomNav && <BottomNav />}
        </div>

        {/* Side Menu */}
        <SideMenu />
      </Sheet>
    </PhoneShell>
  );

  if (animated) {
    return <AnimatedPage>{content}</AnimatedPage>;
  }

  return content;
}
