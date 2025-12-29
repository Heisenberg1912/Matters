import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  routeLabels,
  getRouteLabel,
  isDynamicSegment,
} from "@/config/routes";

interface BreadcrumbItem {
  path: string;
  label: string;
  isLast: boolean;
}

interface BreadcrumbsProps {
  /** Override the current page label */
  currentLabel?: string;
  /** Additional class names */
  className?: string;
  /** Show home icon at start */
  showHomeIcon?: boolean;
}

export default function Breadcrumbs({
  currentLabel,
  className,
  showHomeIcon = true,
}: BreadcrumbsProps) {
  const location = useLocation();

  const breadcrumbs = useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);
    const items: BreadcrumbItem[] = [];

    // Build breadcrumb items from path segments
    let currentPath = "";
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      currentPath += `/${segment}`;
      const isLast = i === segments.length - 1;

      // Skip intermediate role segments like /customer, /contractor, /admin
      // when followed by more specific routes
      if (
        !isLast &&
        ["customer", "contractor", "admin"].includes(segment) &&
        segments[i + 1]
      ) {
        continue;
      }

      // Get label from config or generate one
      let label: string;
      if (isLast && currentLabel) {
        label = currentLabel;
      } else if (isDynamicSegment(segment)) {
        // For dynamic segments, use the previous segment context
        const prevSegment = segments[i - 1];
        if (prevSegment === "jobs") {
          label = "Job Details";
        } else if (prevSegment === "users") {
          label = "User Details";
        } else if (prevSegment === "projects") {
          label = "Project Details";
        } else {
          label = "Details";
        }
      } else {
        label = getRouteLabel(currentPath);
      }

      items.push({
        path: currentPath,
        label,
        isLast,
      });
    }

    return items;
  }, [location.pathname, currentLabel]);

  // Don't render if we're on a root page with no meaningful breadcrumbs
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center gap-1 text-xs xs:text-sm overflow-x-auto scrollbar-none",
        "py-2 xs:py-3",
        className
      )}
    >
      {/* Home link */}
      {showHomeIcon && (
        <>
          <Link
            to="/home"
            className="flex items-center shrink-0 text-muted hover:text-white transition-colors focus-ring rounded"
            aria-label="Home"
          >
            <Home className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
          </Link>
          <ChevronRight className="h-3 w-3 xs:h-3.5 xs:w-3.5 text-muted/50 shrink-0" />
        </>
      )}

      {/* Breadcrumb items */}
      {breadcrumbs.map((item, index) => (
        <div key={item.path} className="flex items-center gap-1 min-w-0">
          {item.isLast ? (
            <span
              className="text-white font-medium truncate max-w-[150px] xs:max-w-[200px]"
              aria-current="page"
            >
              {item.label}
            </span>
          ) : (
            <>
              <Link
                to={item.path}
                className="text-muted hover:text-white transition-colors truncate max-w-[100px] xs:max-w-[150px] focus-ring rounded"
              >
                {item.label}
              </Link>
              <ChevronRight className="h-3 w-3 xs:h-3.5 xs:w-3.5 text-muted/50 shrink-0" />
            </>
          )}
        </div>
      ))}
    </nav>
  );
}
