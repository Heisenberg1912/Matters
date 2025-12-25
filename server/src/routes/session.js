import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'matters-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Default users for each role
const DEFAULT_USERS = [
  {
    email: 'customer@matters.com',
    password: 'customer123',
    name: 'John Customer',
    role: 'user',
  },
  {
    email: 'contractor@matters.com',
    password: 'contractor123',
    name: 'Mike Contractor',
    role: 'contractor',
    contractor: {
      isVerified: true,
      bio: 'Experienced construction contractor with 10+ years in residential projects.',
      yearsExperience: 10,
      availabilityStatus: 'available',
      hourlyRate: 75,
      dailyRate: 500,
      completedProjects: 25,
    },
    specializations: ['Residential', 'Renovation', 'Plumbing'],
  },
  {
    email: 'admin@matters.com',
    password: 'admin123',
    name: 'Sarah Admin',
    role: 'admin',
  },
];

// Seed default users on startup
const seedDefaultUsers = async () => {
  try {
    for (const userData of DEFAULT_USERS) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        await User.create({
          ...userData,
          isVerified: true,
          isActive: true,
        });
        console.log(`Created default user: ${userData.email}`);
      }
    }
  } catch (error) {
    console.error('Error seeding default users:', error);
  }
};

// Call seed on module load
seedDefaultUsers();

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// POST /api/session/login - Login with email/password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt:', { email, passwordLength: password?.length });

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.',
      });
    }

    // Find user with password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      console.log('User inactive:', email);
      return res.status(401).json({
        success: false,
        error: 'Account is disabled. Please contact support.',
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        token,
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

// POST /api/session/register - Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone, role, company, specializations } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required.',
      });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long.',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email already exists.',
      });
    }

    // Create user data
    const userData = {
      email: email.toLowerCase(),
      password,
      name,
      phone,
      role: role || 'user',
      isVerified: true, // Auto-verify for now
      isActive: true,
    };

    // Add contractor-specific fields if role is contractor
    if (role === 'contractor') {
      if (company) {
        userData.company = company;
      }
      if (specializations && Array.isArray(specializations)) {
        userData.specializations = specializations;
      }
      userData.contractor = {
        isVerified: false,
        availabilityStatus: 'available',
        completedProjects: 0,
        activeProjects: 0,
        totalEarnings: 0,
      };
    }

    // Create user (password will be hashed by pre-save hook)
    const user = await User.create(userData);

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      data: {
        user: user.toJSON(),
        token,
      },
      message: 'Registration successful. Welcome to Matters!',
    });
  } catch (error) {
    console.error('Registration error:', error);

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', '),
      });
    }

    res.status(500).json({
      success: false,
      error: 'Registration failed. Please try again.',
    });
  }
});

// POST /api/session/logout - Logout (invalidate token client-side)
router.post('/logout', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed.',
    });
  }
});

// GET /api/session - Get current user
router.get('/', authenticate, async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user.toJSON() },
  });
});

// PATCH /api/session - Update profile fields
router.patch('/', authenticate, async (req, res) => {
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
    console.error('Update session user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update session user.',
    });
  }
});

// GET /api/session/credentials - Get demo credentials (for display on login page)
router.get('/credentials', (req, res) => {
  res.json({
    success: true,
    data: {
      credentials: DEFAULT_USERS.map(u => ({
        email: u.email,
        password: u.password,
        role: u.role,
        name: u.name,
      })),
    },
  });
});

// POST /api/session/forgot-password - Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required.',
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token before storing in database
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save token and expiry (1 hour from now)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = expiresAt;
    await user.save();

    // Verify token was saved correctly
    console.log('Password reset token generated and saved:');
    console.log('- User:', user.email);
    console.log('- Token (first 10 chars):', resetToken.substring(0, 10) + '...');
    console.log('- Hashed token (first 10 chars):', hashedToken.substring(0, 10) + '...');
    console.log('- Expires at:', expiresAt);

    // Create reset URL (use frontend URL in production)
    const frontendUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Send password reset email
    const emailSent = await sendPasswordResetEmail(user.email, user.name, resetUrl);

    // Also log to console for development
    console.log('\n==============================================');
    console.log('PASSWORD RESET REQUEST');
    console.log('==============================================');
    console.log(`User: ${user.name} (${user.email})`);
    console.log(`Reset Link: ${resetUrl}`);
    console.log(`Email sent: ${emailSent ? 'Yes' : 'No (check email configuration)'}`);
    console.log(`Token expires in 1 hour`);
    console.log('==============================================\n');

    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process password reset request.',
    });
  }
});

// GET /api/session/verify-reset-token - Verify password reset token
router.get('/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Reset token is required.',
      });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // First, find user with this token (regardless of expiry) to help debug
    const userWithToken = await User.findOne({
      passwordResetToken: hashedToken,
    });

    if (!userWithToken) {
      console.log('Token verification failed: No user found with this token hash');
      console.log('Provided token (first 10 chars):', token.substring(0, 10) + '...');
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token.',
      });
    }

    // Check if token has expired
    const now = new Date();
    if (!userWithToken.passwordResetExpires || userWithToken.passwordResetExpires < now) {
      console.log('Token verification failed: Token expired');
      console.log('Token expired at:', userWithToken.passwordResetExpires);
      console.log('Current time:', now);
      return res.status(400).json({
        success: false,
        error: 'Reset token has expired. Please request a new password reset link.',
      });
    }

    console.log('Token verification successful for user:', userWithToken.email);

    res.json({
      success: true,
      message: 'Reset token is valid.',
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify reset token.',
    });
  }
});

// POST /api/session/reset-password - Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: 'Token and new password are required.',
      });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long.',
      });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token.',
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // Remove all refresh tokens (logout from all devices)
    user.refreshTokens = [];

    await user.save();

    console.log(`Password reset successful for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password.',
    });
  }
});

// POST /api/session/test-email - Test email configuration (development only)
router.post('/test-email', async (req, res) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Email address (to) is required',
      });
    }

    const { sendEmail } = await import('../services/emailService.js');

    const testResult = await sendEmail({
      to,
      subject: 'Test Email from Matters',
      html: '<h1>Success!</h1><p>Your email configuration is working correctly.</p>',
      text: 'Success! Your email configuration is working correctly.',
    });

    console.log('Test email result:', testResult);

    res.json({
      success: true,
      emailSent: testResult,
      message: testResult
        ? 'Test email sent successfully! Check your inbox.'
        : 'Email service not configured. Check server logs for details.',
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
