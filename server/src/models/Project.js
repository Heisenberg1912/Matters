import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [200, 'Project name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project owner is required'],
    },
    contractor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['draft', 'planning', 'in_progress', 'on_hold', 'completed', 'cancelled'],
      default: 'draft',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    type: {
      type: String,
      enum: ['residential', 'commercial', 'industrial', 'renovation', 'other'],
      default: 'residential',
    },
    mode: {
      type: String,
      enum: ['construction', 'refurbish'],
      default: 'construction',
    },
    location: {
      address: String,
      city: String,
      state: String,
      country: { type: String, default: 'India' },
      pincode: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    budget: {
      estimated: { type: Number, default: 0 },
      spent: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
    },
    timeline: {
      startDate: Date,
      expectedEndDate: Date,
      actualEndDate: Date,
    },
    currentStage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stage',
    },
    stages: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stage',
    }],
    team: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, enum: ['manager', 'supervisor', 'worker', 'viewer'] },
      addedAt: { type: Date, default: Date.now },
    }],
    invites: [{
      email: { type: String, required: true, lowercase: true, trim: true },
      role: { type: String, enum: ['manager', 'supervisor', 'worker', 'viewer'], default: 'viewer' },
      token: { type: String, required: true },
      status: { type: String, enum: ['pending', 'accepted', 'expired'], default: 'pending' },
      invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      invitedAt: { type: Date, default: Date.now },
      expiresAt: { type: Date, required: true },
      acceptedAt: Date,
      acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    }],
    tags: [String],
    coverImage: String,
    documents: [{
      name: String,
      url: String,
      type: String,
      uploadedAt: { type: Date, default: Date.now },
    }],
    settings: {
      isPublic: { type: Boolean, default: false },
      allowComments: { type: Boolean, default: true },
      notifications: { type: Boolean, default: true },
    },
    // Public access for client portal
    publicAccess: {
      enabled: { type: Boolean, default: false },
      token: { type: String, unique: true, sparse: true },
      expiresAt: Date,
      allowedSections: [{
        type: String,
        enum: ['overview', 'progress', 'photos', 'timeline', 'budget_summary'],
      }],
      password: String, // Optional password protection (hashed)
      viewCount: { type: Number, default: 0 },
      createdAt: Date,
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    progress: {
      percentage: { type: Number, default: 0, min: 0, max: 100 },
      lastUpdated: Date,
    },
    metrics: {
      totalUploads: { type: Number, default: 0 },
      totalBills: { type: Number, default: 0 },
      completedStages: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
projectSchema.index({ owner: 1 });
projectSchema.index({ contractor: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ 'location.city': 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ name: 'text', description: 'text' });

// Virtual for days remaining
projectSchema.virtual('daysRemaining').get(function () {
  if (!this.timeline?.expectedEndDate) return null;
  const now = new Date();
  const end = new Date(this.timeline.expectedEndDate);
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return diff;
});

// Virtual for budget utilization
projectSchema.virtual('budgetUtilization').get(function () {
  if (!this.budget?.estimated || this.budget.estimated === 0) return 0;
  return Math.round((this.budget.spent / this.budget.estimated) * 100);
});

// Pre-save hook to update progress
projectSchema.pre('save', function (next) {
  if (this.isModified('stages') || this.isModified('metrics.completedStages')) {
    const totalStages = this.stages?.length || 0;
    const completedStages = this.metrics?.completedStages || 0;
    if (totalStages > 0) {
      this.progress.percentage = Math.round((completedStages / totalStages) * 100);
      this.progress.lastUpdated = new Date();
    }
  }
  next();
});

// Static method to get projects by user
projectSchema.statics.findByUser = function (userId, role = 'owner') {
  if (role === 'owner') {
    return this.find({ owner: userId });
  }
  if (role === 'contractor') {
    return this.find({ contractor: userId });
  }
  return this.find({
    $or: [
      { owner: userId },
      { contractor: userId },
      { 'team.user': userId },
    ],
  });
};

// Method to add team member
projectSchema.methods.addTeamMember = function (userId, role = 'viewer') {
  const exists = this.team.some((t) => t.user.toString() === userId.toString());
  if (!exists) {
    this.team.push({ user: userId, role });
  }
  return this.save();
};

// Method to remove team member
projectSchema.methods.removeTeamMember = function (userId) {
  this.team = this.team.filter((t) => t.user.toString() !== userId.toString());
  return this.save();
};

// Method to update budget spent
projectSchema.methods.updateBudgetSpent = async function (amount) {
  this.budget.spent += amount;
  return this.save();
};

const Project = mongoose.model('Project', projectSchema);

export default Project;
