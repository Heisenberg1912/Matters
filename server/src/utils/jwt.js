import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Generate access token (short-lived)
export const generateAccessToken = (userId, additionalPayload = {}) => {
  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_ACCESS_EXP || '15m';

  return jwt.sign(
    {
      userId,
      type: 'access',
      ...additionalPayload,
    },
    secret,
    { expiresIn }
  );
};

// Generate refresh token (long-lived)
export const generateRefreshToken = (userId, additionalPayload = {}) => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_REFRESH_EXP || process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

  return jwt.sign(
    {
      userId,
      type: 'refresh',
      jti: crypto.randomUUID(), // Unique token ID
      ...additionalPayload,
    },
    secret,
    { expiresIn }
  );
};

// Verify access token
export const verifyAccessToken = (token) => {
  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  return jwt.verify(token, secret);
};

// Verify refresh token
export const verifyRefreshToken = (token) => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  return jwt.verify(token, secret);
};

// Generate token pair (access + refresh)
export const generateTokenPair = (userId, additionalPayload = {}) => {
  const accessToken = generateAccessToken(userId, additionalPayload);
  const refreshToken = generateRefreshToken(userId, additionalPayload);

  // Calculate expiry dates
  const accessTokenExp = process.env.JWT_ACCESS_EXP || '15m';
  const refreshTokenExp = process.env.JWT_REFRESH_EXP || '30d';

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresIn: accessTokenExp,
    refreshTokenExpiresIn: refreshTokenExp,
    tokenType: 'Bearer',
  };
};

// Generate password reset token
export const generateResetToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  return {
    token,
    hashedToken,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  };
};

// Generate email verification token
export const generateVerificationToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  return {
    token,
    hashedToken,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  };
};

// Hash a token (for storing reset/verification tokens)
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Decode token without verification (to get payload)
export const decodeToken = (token) => {
  return jwt.decode(token);
};

// Get token expiry date
export const getTokenExpiry = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch {
    return null;
  }
};

// Check if token is expired
export const isTokenExpired = (token) => {
  const expiry = getTokenExpiry(token);
  if (!expiry) return true;
  return expiry < new Date();
};

// Parse duration string to milliseconds
export const parseDuration = (duration) => {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 0;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * (multipliers[unit] || 0);
};

// Get refresh token expiry date
export const getRefreshTokenExpiry = () => {
  const duration = process.env.JWT_REFRESH_EXP || process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';
  const ms = parseDuration(duration);
  return new Date(Date.now() + ms);
};

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
  generateResetToken,
  generateVerificationToken,
  hashToken,
  decodeToken,
  getTokenExpiry,
  isTokenExpired,
  getRefreshTokenExpiry,
};
