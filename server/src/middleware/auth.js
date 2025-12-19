import jwt from 'jsonwebtoken';
import User from '../models/User.js';

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

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET
      );

      const user = await User.findById(decoded.userId);

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
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expired.',
          code: 'TOKEN_EXPIRED',
        });
      }
      throw jwtError;
    }
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
      const decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET
      );

      const user = await User.findById(decoded.userId);

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
