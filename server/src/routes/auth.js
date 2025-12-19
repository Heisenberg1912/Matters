import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import Project from '../models/Project.js';
import {
  generateTokenPair,
  verifyRefreshToken,
  generateResetToken,
  generateVerificationToken,
  hashToken,
  getRefreshTokenExpiry,
} from '../utils/jwt.js';
import { authenticate, rateLimit } from '../middleware/auth.js';
import { sendEmail } from '../utils/email.js';
import { triggerProjectEvent } from '../utils/realtime.js';

const router = express.Router();

const acceptProjectInvitesForUser = async (user) => {
  const inviteProjects = await Project.find({
    'invites.email': user.email,
    'invites.status': 'pending',
    'invites.expiresAt': { $gt: new Date() },
  });

  for (const project of inviteProjects) {
    const invite = project.invites.find(
      (item) => item.email === user.email && item.status === 'pending' && item.expiresAt > new Date()
    );

    if (!invite) {
      continue;
    }

    const alreadyOnTeam = project.team.some(
      (member) => member.user.toString() === user._id.toString()
    );

    if (!alreadyOnTeam) {
      project.team.push({ user: user._id, role: invite.role, addedAt: new Date() });
    }

    invite.status = 'accepted';
    invite.acceptedAt = new Date();
    invite.acceptedBy = user._id;

    await project.save();
    await triggerProjectEvent(project._id, 'team.updated', { team: project.team });
  }
};

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', rateLimit({ max: 5, windowMs: 60 * 60 * 1000 }), async (req, res) => {
  try {
    const { email, password, name, phone, role } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters.',
      });
    }

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists.',
      });
    }

    // Create user
    const user = new User({
      email,
      password,
      name,
      phone,
      role: role === 'contractor' ? 'contractor' : 'user',
      authProvider: 'local',
    });

    // Generate verification token
    const { token: verificationToken, hashedToken } = generateVerificationToken();
    user.verificationToken = hashedToken;
    user.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await user.save();

    await acceptProjectInvitesForUser(user);

    // Generate tokens
    const tokens = generateTokenPair(user._id, { role: user.role });

    // Add refresh token to user
    await user.addRefreshToken(
      tokens.refreshToken,
      getRefreshTokenExpiry(),
      req.headers['user-agent']
    );

    // Send verification email (non-blocking)
    const verificationUrl = `${process.env.CLIENT_BASE_URL}/verify-email?token=${verificationToken}`;
    sendEmail({
      to: user.email,
      subject: 'Verify your email - Matters',
      html: `
        <h1>Welcome to Matters!</h1>
        <p>Hi ${user.name},</p>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        <p>This link expires in 24 hours.</p>
      `,
    }).catch(console.error);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      data: {
        user: user.toJSON(),
        ...tokens,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed. Please try again.',
    });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', rateLimit({ max: 10, windowMs: 15 * 60 * 1000 }), async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.',
      });
    }

    // Find user with password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Your account has been deactivated.',
      });
    }

    if (user.authProvider === 'google' && !user.password) {
      return res.status(400).json({
        success: false,
        error: 'This account uses Google sign-in. Please login with Google.',
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    // Generate tokens
    const tokens = generateTokenPair(user._id, { role: user.role });

    // Update last login and add refresh token
    user.lastLogin = new Date();
    await user.save();
    await user.addRefreshToken(
      tokens.refreshToken,
      getRefreshTokenExpiry(),
      req.headers['user-agent']
    );

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: user.toJSON(),
        ...tokens,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.',
    });
  }
});

/**
 * POST /api/auth/google
 * Login/Register with Google
 */
router.post('/google', async (req, res) => {
  try {
    const { credential, clientId } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        error: 'Google credential is required.',
      });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: clientId || process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email not provided by Google.',
      });
    }

    // Find or create user
    let user = await User.findOne({
      $or: [{ googleId }, { email: email.toLowerCase() }],
    });

    let isNewUser = false;

    if (!user) {
      // Create new user
      user = new User({
        email,
        name,
        googleId,
        avatar: picture,
        authProvider: 'google',
        isVerified: true, // Google accounts are pre-verified
      });
      await user.save();
      isNewUser = true;
    } else {
      // Update existing user with Google info if not already linked
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (!user.avatar && picture) {
        user.avatar = picture;
      }
      if (!user.isVerified) {
        user.isVerified = true;
      }
      user.lastLogin = new Date();
      await user.save();
    }

    await acceptProjectInvitesForUser(user);

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Your account has been deactivated.',
      });
    }

    // Generate tokens
    const tokens = generateTokenPair(user._id, { role: user.role });

    await user.addRefreshToken(
      tokens.refreshToken,
      getRefreshTokenExpiry(),
      req.headers['user-agent']
    );

    res.json({
      success: true,
      message: isNewUser ? 'Account created successfully.' : 'Login successful.',
      data: {
        user: user.toJSON(),
        isNewUser,
        ...tokens,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Google authentication failed.',
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required.',
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token.',
        code: 'REFRESH_TOKEN_INVALID',
      });
    }

    // Find user and check if refresh token exists
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

    // Check if refresh token is in user's token list
    const tokenExists = user.refreshTokens.some(
      (rt) => rt.token === refreshToken && rt.expiresAt > new Date()
    );

    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token not found or expired.',
        code: 'REFRESH_TOKEN_REVOKED',
      });
    }

    // Generate new token pair
    const tokens = generateTokenPair(user._id, { role: user.role });

    // Remove old refresh token and add new one
    await user.removeRefreshToken(refreshToken);
    await user.addRefreshToken(
      tokens.refreshToken,
      getRefreshTokenExpiry(),
      req.headers['user-agent']
    );

    res.json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed.',
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout (revoke refresh token)
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    const { refreshToken, logoutAll } = req.body;

    if (logoutAll) {
      await req.user.removeAllRefreshTokens();
    } else if (refreshToken) {
      await req.user.removeRefreshToken(refreshToken);
    }

    res.json({
      success: true,
      message: logoutAll ? 'Logged out from all devices.' : 'Logged out successfully.',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed.',
    });
  }
});

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', rateLimit({ max: 3, windowMs: 60 * 60 * 1000 }), async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required.',
      });
    }

    const user = await User.findByEmail(email);

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists, a password reset link has been sent.',
      });
    }

    if (user.authProvider === 'google' && !user.password) {
      return res.json({
        success: true,
        message: 'This account uses Google sign-in. Please login with Google.',
      });
    }

    // Generate reset token
    const { token, hashedToken, expiresAt } = generateResetToken();
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = expiresAt;
    await user.save();

    // Send reset email
    const resetUrl = `${process.env.PASSWORD_RESET_URL || process.env.CLIENT_RESET_URL}?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: 'Password Reset - Matters',
      html: `
        <h1>Password Reset Request</h1>
        <p>Hi ${user.name},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });

    res.json({
      success: true,
      message: 'If an account exists, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process request.',
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: 'Token and password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters.',
      });
    }

    const hashedToken = hashToken(token);

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token.',
      });
    }

    // Update password and clear reset token
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Revoke all refresh tokens for security
    await user.removeAllRefreshTokens();

    res.json({
      success: true,
      message: 'Password reset successful. Please login with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Password reset failed.',
    });
  }
});

/**
 * POST /api/auth/verify-email
 * Verify email with token
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Verification token is required.',
      });
    }

    const hashedToken = hashToken(token);

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token.',
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully.',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Email verification failed.',
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: { user: req.user.toJSON() },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user.',
    });
  }
});

/**
 * PATCH /api/auth/me
 * Update current user
 */
router.patch('/me', authenticate, async (req, res) => {
  try {
    const allowedFields = ['name', 'phone', 'avatar', 'preferences', 'company', 'specializations'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: { user: user.toJSON() },
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user.',
    });
  }
});

/**
 * POST /api/auth/change-password
 * Change password (authenticated)
 */
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters.',
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!user.password) {
      return res.status(400).json({
        success: false,
        error: 'This account uses Google sign-in and has no password.',
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect.',
      });
    }

    user.password = newPassword;
    await user.save();

    // Revoke all refresh tokens except current one
    await user.removeAllRefreshTokens();

    // Generate new token pair
    const tokens = generateTokenPair(user._id, { role: user.role });
    await user.addRefreshToken(
      tokens.refreshToken,
      getRefreshTokenExpiry(),
      req.headers['user-agent']
    );

    res.json({
      success: true,
      message: 'Password changed successfully.',
      data: tokens,
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password.',
    });
  }
});

export default router;
