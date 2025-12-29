/**
 * Route configuration for breadcrumbs and navigation
 */

export interface RouteConfig {
  label: string;
  parent?: string;
}

/**
 * Maps route paths to human-readable labels for breadcrumbs
 * Dynamic segments (like :jobId) are handled separately
 */
export const routeLabels: Record<string, RouteConfig> = {
  // Root
  '/home': { label: 'Home' },

  // Customer routes
  '/customer': { label: 'Customer', parent: '/home' },
  '/customer/dashboard': { label: 'Dashboard', parent: '/home' },
  '/customer/post-job': { label: 'Post Job', parent: '/customer/dashboard' },
  '/customer/bids': { label: 'View Bids', parent: '/customer/dashboard' },
  '/customer/progress': { label: 'Progress', parent: '/customer/dashboard' },
  '/customer/jobs': { label: 'Jobs', parent: '/customer/dashboard' },

  // Contractor routes
  '/contractor': { label: 'Contractor', parent: '/home' },
  '/contractor/dashboard': { label: 'Dashboard', parent: '/home' },
  '/contractor/jobs': { label: 'Available Jobs', parent: '/contractor/dashboard' },
  '/contractor/bids': { label: 'My Bids', parent: '/contractor/dashboard' },
  '/contractor/assignments': { label: 'Assignments', parent: '/contractor/dashboard' },
  '/contractor/progress': { label: 'Submit Progress', parent: '/contractor/dashboard' },
  '/contractor/earnings': { label: 'Earnings', parent: '/contractor/dashboard' },
  '/contractor/profile': { label: 'Profile', parent: '/contractor/dashboard' },

  // Admin routes
  '/admin': { label: 'Admin', parent: '/home' },
  '/admin/dashboard': { label: 'Dashboard', parent: '/home' },
  '/admin/users': { label: 'Users', parent: '/admin/dashboard' },
  '/admin/projects': { label: 'Projects', parent: '/admin/dashboard' },
  '/admin/contractors': { label: 'Contractors', parent: '/admin/dashboard' },
  '/admin/tickets': { label: 'Tickets', parent: '/admin/dashboard' },
  '/admin/analytics': { label: 'Analytics', parent: '/admin/dashboard' },

  // Shared routes
  '/settings': { label: 'Settings', parent: '/home' },
  '/documents': { label: 'Documents', parent: '/home' },
  '/subscription': { label: 'Subscription', parent: '/home' },
  '/hire-contractor': { label: 'Hire Contractor', parent: '/home' },
  '/analytics': { label: 'Analytics', parent: '/home' },
  '/team': { label: 'Team', parent: '/home' },
  '/budget': { label: 'Budget', parent: '/home' },
  '/inventory': { label: 'Inventory', parent: '/home' },
  '/plans-drawings': { label: 'Plans & Drawings', parent: '/home' },
  '/site-details': { label: 'Site Details', parent: '/home' },
  '/contractor-chat': { label: 'Chat', parent: '/home' },
  '/site-gallery': { label: 'Gallery', parent: '/home' },
  '/schedule': { label: 'Schedule', parent: '/home' },
  '/customer-care': { label: 'Customer Care', parent: '/home' },
  '/news-updates': { label: 'News', parent: '/home' },
  '/reports': { label: 'Reports', parent: '/home' },
  '/privacy-policy': { label: 'Privacy Policy' },
  '/terms': { label: 'Terms of Service' },
};

/**
 * Get the label for a dynamic route segment
 */
export function getDynamicSegmentLabel(segment: string, prevSegment?: string): string {
  // For job IDs, return "Job Details"
  if (prevSegment === 'jobs') {
    return 'Job Details';
  }

  // For user IDs
  if (prevSegment === 'users') {
    return 'User Details';
  }

  // For project IDs
  if (prevSegment === 'projects') {
    return 'Project Details';
  }

  // Default: capitalize the segment
  return segment;
}

/**
 * Check if a segment is a dynamic ID (usually MongoDB ObjectId or UUID)
 */
export function isDynamicSegment(segment: string): boolean {
  // MongoDB ObjectId pattern (24 hex characters)
  if (/^[a-f0-9]{24}$/i.test(segment)) {
    return true;
  }

  // UUID pattern
  if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(segment)) {
    return true;
  }

  // Numeric ID
  if (/^\d+$/.test(segment)) {
    return true;
  }

  return false;
}

/**
 * Get the route label for a given path
 */
export function getRouteLabel(path: string): string {
  const config = routeLabels[path];
  if (config) {
    return config.label;
  }

  // Handle dynamic segments
  const segments = path.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  const prevSegment = segments[segments.length - 2];

  if (isDynamicSegment(lastSegment)) {
    return getDynamicSegmentLabel(lastSegment, prevSegment);
  }

  // Fallback: capitalize and format the last segment
  return lastSegment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
