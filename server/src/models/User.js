import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    avatar: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'contractor', 'admin', 'superadmin'],
      default: process.env.DEFAULT_ROLE || 'user',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    refreshTokens: [{
      token: String,
      expiresAt: Date,
      device: String,
      createdAt: { type: Date, default: Date.now },
    }],
    passwordResetToken: String,
    passwordResetExpires: Date,
    verificationToken: String,
    verificationExpires: Date,
    lastLogin: Date,
    preferences: {
      notifications: { type: Boolean, default: true },
      emailUpdates: { type: Boolean, default: true },
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    },
    // Contractor-specific fields
    company: {
      name: String,
      address: String,
      license: String,
      gstin: String,
      website: String,
    },
    specializations: [String],
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    contractor: {
      isVerified: { type: Boolean, default: false },
      verifiedAt: Date,
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      bio: { type: String, maxlength: 1000 },
      yearsExperience: { type: Number, min: 0 },
      portfolioImages: [String],
      availabilityStatus: {
        type: String,
        enum: ['available', 'busy', 'on_leave'],
        default: 'available',
      },
      hourlyRate: { type: Number, min: 0 },
      dailyRate: { type: Number, min: 0 },
      completedProjects: { type: Number, default: 0 },
      activeProjects: { type: Number, default: 0 },
      totalEarnings: { type: Number, default: 0 },
      serviceAreas: [{
        city: String,
        state: String,
      }],
      documents: [{
        type: { type: String, enum: ['license', 'insurance', 'certification', 'id_proof', 'other'] },
        name: String,
        url: String,
        verified: { type: Boolean, default: false },
        uploadedAt: { type: Date, default: Date.now },
      }],
    },
    // Subscription fields
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'pro', 'enterprise'],
        default: 'free',
      },
      status: {
        type: String,
        enum: ['active', 'canceled', 'expired'],
        default: 'active',
      },
      startDate: {
        type: Date,
        default: Date.now,
      },
      endDate: Date,
      assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      notes: String,
    },
    // Usage tracking
    usage: {
      projectCount: { type: Number, default: 0 },
      storageUsed: { type: Number, default: 0 }, // bytes
      teamMembersCount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.refreshTokens;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.verificationToken;
        delete ret.verificationExpires;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index for faster queries (email and googleId already indexed via unique: true)
userSchema.index({ role: 1 });
userSchema.index({ 'contractor.isVerified': 1, role: 1 });
userSchema.index({ 'contractor.availabilityStatus': 1 });
userSchema.index({ specializations: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Add refresh token
userSchema.methods.addRefreshToken = function (token, expiresAt, device = 'unknown') {
  // Remove expired tokens
  this.refreshTokens = this.refreshTokens.filter((rt) => rt.expiresAt > new Date());

  // Limit to 5 active sessions
  if (this.refreshTokens.length >= 5) {
    this.refreshTokens.shift();
  }

  this.refreshTokens.push({ token, expiresAt, device });
  return this.save();
};

// Remove refresh token
userSchema.methods.removeRefreshToken = function (token) {
  this.refreshTokens = this.refreshTokens.filter((rt) => rt.token !== token);
  return this.save();
};

// Remove all refresh tokens (logout from all devices)
userSchema.methods.removeAllRefreshTokens = function () {
  this.refreshTokens = [];
  return this.save();
};

// Check if user has a specific role
userSchema.methods.hasRole = function (roles) {
  if (typeof roles === 'string') {
    return this.role === roles;
  }
  return roles.includes(this.role);
};

// Static method to find by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

const User = mongoose.model('User', userSchema);

export default User;
