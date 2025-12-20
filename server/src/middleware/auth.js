import jwt from 'jsonwebtoken';
import { clerkClient, verifyToken } from '@clerk/clerk-sdk-node';
import User from '../models/User.js';

const getPrimaryClerkEmail = (clerkUser) => {
  const primaryEmail = clerkUser.emailAddresses?.find(
    (email) => email.id === clerkUser.primaryEmailAddressId
  );
  return (primaryEmail || clerkUser.emailAddresses?.[0])?.emailAddress?.toLowerCase() || null;
};

const getClerkDisplayName = (clerkUser) => {
  if (clerkUser.fullName) {
    return clerkUser.fullName;
  }
  const parts = [clerkUser.firstName, clerkUser.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : null;
};

const getClerkRole = (clerkUser) => {
  const rawRole =
    clerkUser.publicMetadata?.role ||
    clerkUser.unsafeMetadata?.role ||
    clerkUser.privateMetadata?.role;
  return rawRole === 'contractor' ? 'contractor' : 'user';
};

const VALID_ROLES = ['user', 'contractor', 'admin', 'superadmin'];

const findOrCreateClerkUser = async (clerkUserId) => {
  let user = await User.findOne({ clerkId: clerkUserId });
  if (user) {
    // Normalize invalid role if needed
    if (!VALID_ROLES.includes(user.role)) {
      user.role = 'user';
      await user.save();
    }
    return user;
  }

  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const email = getPrimaryClerkEmail(clerkUser);
  if (!email) {
    throw new Error('Clerk user email is missing.');
  }

  const role = getClerkRole(clerkUser);
  const displayName = getClerkDisplayName(clerkUser) || email.split('@')[0];

  user = await User.findOne({ email });
  if (user) {
    user.clerkId = clerkUserId;
    user.authProvider = 'clerk';
    user.isVerified = true;
    // Normalize invalid role
    if (!VALID_ROLES.includes(user.role)) {
      user.role = role;
    }
    if (!user.avatar && clerkUser.imageUrl) {
      user.avatar = clerkUser.imageUrl;
    }
    if (!user.name && displayName) {
      user.name = displayName;
    }
    await user.save();
    return user;
  }

  user = await User.create({
    email,
    name: displayName,
    avatar: clerkUser.imageUrl || null,
    role,
    authProvider: 'clerk',
    clerkId: clerkUserId,
    isVerified: true,
  });

  return user;
};

const resolveClerkUserFromToken = async (token) => {
  if (!process.env.CLERK_SECRET_KEY) {
    return null;
  }

  const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
  if (!payload?.sub) {
    return null;
  }

  return findOrCreateClerkUser(payload.sub);
};

// Verify access token
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    let user = null;
    let clerkError = null;

    try {
      user = await resolveClerkUserFromToken(token);
    } catch (error) {
      clerkError = error;
    }

    if (!user) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET
        );

        user = await User.findById(decoded.userId);
      } catch (jwtError) {
        if (jwtError.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            error: 'Token expired.',
            code: 'TOKEN_EXPIRED',
          });
        }
        if (clerkError) {
          console.warn('Clerk auth failed:', clerkError.message || clerkError);
        }
        throw jwtError;
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account is deactivated.',
      });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid token.',
    });
  }
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    try {
      let user = await resolveClerkUserFromToken(token);

      if (!user) {
        const decoded = jwt.verify(
          token,
          process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET
        );
        user = await User.findById(decoded.userId);
      }

      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id;
      }
    } catch {
      // Token is invalid or expired, continue without auth
    }

    next();
  } catch (error) {
    next();
  }
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
