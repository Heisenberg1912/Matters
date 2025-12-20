import User from '../models/User.js';

const GUEST_EMAIL = process.env.GUEST_USER_EMAIL || 'guest@matters.local';
const GUEST_NAME = process.env.GUEST_USER_NAME || 'Guest User';
const GUEST_ROLE = process.env.GUEST_USER_ROLE || 'user';

let cachedGuestUser = null;

const getOrCreateGuestUser = async () => {
  if (cachedGuestUser) {
    return cachedGuestUser;
  }

  let user = await User.findOne({ email: GUEST_EMAIL });

  if (!user) {
    user = await User.create({
      email: GUEST_EMAIL,
      name: GUEST_NAME,
      role: GUEST_ROLE,
      authProvider: 'local',
      isVerified: true,
      isActive: true,
    });
  } else if (!user.isActive) {
    user.isActive = true;
    await user.save();
  }

  cachedGuestUser = user;
  return user;
};

// Attach a guest user to every request (login is disabled).
export const authenticate = async (req, res, next) => {
  try {
    const user = await getOrCreateGuestUser();
    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    console.error('Guest auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize guest session.',
    });
  }
};

// Optional authentication (always attaches guest user when possible)
export const optionalAuth = async (req, res, next) => {
  try {
    const user = await getOrCreateGuestUser();
    req.user = user;
    req.userId = user._id;
  } catch (error) {
    console.warn('Optional guest auth failed:', error);
  }
  next();
};

// Check for specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to perform this action.',
      });
    }

    next();
  };
};

// Check if user is admin or superadmin
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required.',
    });
  }

  if (!['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required.',
    });
  }

  next();
};

// Check if user is superadmin only
export const isSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required.',
    });
  }

  if (req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      error: 'Superadmin access required.',
    });
  }

  next();
};

// Check plan limits before allowing resource creation
export const checkPlanLimits = (limitType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required.',
        });
      }

      // Import models dynamically to avoid circular dependencies
      const { default: Plan } = await import('../models/Plan.js');
      const { default: Project } = await import('../models/Project.js');

      const plan = await Plan.getPlanById(req.user.subscription?.plan || 'free');
      if (!plan) {
        return res.status(500).json({
          success: false,
          error: 'Could not determine user plan.',
        });
      }

      const limits = plan.limits || {};

      switch (limitType) {
        case 'projects': {
          if (limits.projects === -1) return next(); // Unlimited
          const projectCount = await Project.countDocuments({ owner: req.userId });
          if (projectCount >= limits.projects) {
            return res.status(403).json({
              success: false,
              error: `You have reached the maximum number of projects (${limits.projects}) for your ${plan.name} plan. Please upgrade to create more projects.`,
              code: 'PLAN_LIMIT_EXCEEDED',
              limitType: 'projects',
              current: projectCount,
              limit: limits.projects,
            });
          }
          break;
        }

        case 'teamMembers': {
          if (limits.teamMembers === -1) return next(); // Unlimited
          const projectId = req.params.id || req.body.projectId;
          if (projectId) {
            const project = await Project.findById(projectId);
            if (project && project.team.length >= limits.teamMembers) {
              return res.status(403).json({
                success: false,
                error: `You have reached the maximum number of team members (${limits.teamMembers}) per project for your ${plan.name} plan. Please upgrade to add more team members.`,
                code: 'PLAN_LIMIT_EXCEEDED',
                limitType: 'teamMembers',
                current: project.team.length,
                limit: limits.teamMembers,
              });
            }
          }
          break;
        }

        case 'storage': {
          if (limits.storage === -1) return next(); // Unlimited
          const storageUsed = req.user.usage?.storageUsed || 0;
          const storageLimitBytes = limits.storage * 1024 * 1024 * 1024; // Convert GB to bytes
          const fileSize = req.body.fileSize || 0;
          if (storageUsed + fileSize > storageLimitBytes) {
            return res.status(403).json({
              success: false,
              error: `You have reached the storage limit (${limits.storage} GB) for your ${plan.name} plan. Please upgrade for more storage.`,
              code: 'PLAN_LIMIT_EXCEEDED',
              limitType: 'storage',
              current: storageUsed,
              limit: storageLimitBytes,
            });
          }
          break;
        }

        default:
          break;
      }

      next();
    } catch (error) {
      console.error('Plan limits check error:', error);
      next(); // Allow through on error to not block operations
    }
  };
};

// Check if user owns the resource or is admin
export const isOwnerOrAdmin = (ownerField = 'owner') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
    }

    // Admins can access everything
    if (['admin', 'superadmin'].includes(req.user.role)) {
      return next();
    }

    // Check if resource owner matches current user
    const resourceOwnerId = req.resource?.[ownerField];
    if (resourceOwnerId && resourceOwnerId.toString() === req.user._id.toString()) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'You do not have permission to access this resource.',
    });
  };
};

// Rate limiting middleware (simple in-memory implementation)
const rateLimitStore = new Map();

export const rateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // max requests per window
    message = 'Too many requests, please try again later.',
  } = options;

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const record = rateLimitStore.get(key);

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }

    if (record.count >= max) {
      return res.status(429).json({
        success: false,
        error: message,
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
    }

    record.count++;
    next();
  };
};

// Clean up rate limit store periodically
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

cleanupInterval.unref();

export default authenticate;
