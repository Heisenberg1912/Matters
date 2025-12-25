import mongoose from 'mongoose';

const progressUpdateSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
    },
    stage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stage',
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
    },
    contractor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Contractor reference is required'],
    },
    type: {
      type: String,
      enum: ['daily', 'weekly', 'milestone', 'issue', 'completion', 'general'],
      required: [true, 'Update type is required'],
      default: 'general',
    },
    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    photos: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Upload',
    }],
    photoUrls: [{
      url: String,
      caption: String,
      uploadedAt: { type: Date, default: Date.now },
    }],
    workDone: [{
      task: { type: String, required: true },
      status: {
        type: String,
        enum: ['completed', 'in_progress', 'blocked'],
        default: 'completed',
      },
      notes: String,
    }],
    materialsUsed: [{
      name: { type: String, required: true },
      quantity: { type: Number, required: true, min: 0 },
      unit: { type: String, default: 'units' },
      cost: { type: Number, min: 0 },
    }],
    issues: [{
      description: { type: String, required: true },
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
      },
      resolved: { type: Boolean, default: false },
      resolvedAt: Date,
      resolution: String,
    }],
    weather: {
      condition: String,
      temperature: Number,
      humidity: Number,
      impact: {
        type: String,
        enum: ['none', 'minor', 'moderate', 'severe'],
        default: 'none',
      },
    },
    workersOnSite: {
      type: Number,
      min: 0,
      default: 0,
    },
    hoursWorked: {
      type: Number,
      min: 0,
      default: 0,
    },
    progressPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    nextSteps: {
      type: String,
      maxlength: [1000, 'Next steps cannot exceed 1000 characters'],
    },
    blockers: [{
      description: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
      },
      resolved: { type: Boolean, default: false },
    }],
    customerVisible: {
      type: Boolean,
      default: true,
    },
    customerAcknowledged: {
      type: Boolean,
      default: false,
    },
    acknowledgedAt: Date,
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    comments: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text: String,
      createdAt: { type: Date, default: Date.now },
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
progressUpdateSchema.index({ project: 1, createdAt: -1 });
progressUpdateSchema.index({ contractor: 1 });
progressUpdateSchema.index({ stage: 1 });
progressUpdateSchema.index({ job: 1 });
progressUpdateSchema.index({ type: 1 });
progressUpdateSchema.index({ createdAt: -1 });

// Virtual for total materials cost
progressUpdateSchema.virtual('totalMaterialsCost').get(function () {
  if (!this.materialsUsed || this.materialsUsed.length === 0) return 0;
  return this.materialsUsed.reduce((sum, m) => sum + (m.cost || 0), 0);
});

// Virtual for has unresolved issues
progressUpdateSchema.virtual('hasUnresolvedIssues').get(function () {
  return this.issues.some(i => !i.resolved);
});

// Virtual for unresolved issues count
progressUpdateSchema.virtual('unresolvedIssuesCount').get(function () {
  return this.issues.filter(i => !i.resolved).length;
});

// Method to add comment
progressUpdateSchema.methods.addComment = function (userId, text) {
  this.comments.push({ user: userId, text });
  return this.save();
};

// Method to acknowledge update
progressUpdateSchema.methods.acknowledge = function (userId) {
  this.customerAcknowledged = true;
  this.acknowledgedAt = new Date();
  this.acknowledgedBy = userId;
  return this.save();
};

// Method to resolve issue
progressUpdateSchema.methods.resolveIssue = function (issueIndex, resolution) {
  if (this.issues[issueIndex]) {
    this.issues[issueIndex].resolved = true;
    this.issues[issueIndex].resolvedAt = new Date();
    this.issues[issueIndex].resolution = resolution;
    return this.save();
  }
  throw new Error('Issue not found');
};

// Static method to get updates by project
progressUpdateSchema.statics.findByProject = function (projectId, options = {}) {
  const query = { project: projectId };

  if (options.type) {
    query.type = options.type;
  }

  if (options.contractorId) {
    query.contractor = options.contractorId;
  }

  if (options.customerVisible !== undefined) {
    query.customerVisible = options.customerVisible;
  }

  const limit = options.limit || 50;
  const skip = options.skip || 0;

  return this.find(query)
    .populate('contractor', 'name avatar company')
    .populate('stage', 'name type')
    .populate('photos', 'url thumbnailUrl originalName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get updates by contractor
progressUpdateSchema.statics.findByContractor = function (contractorId, options = {}) {
  const query = { contractor: contractorId };

  if (options.projectId) {
    query.project = options.projectId;
  }

  const limit = options.limit || 50;
  const skip = options.skip || 0;

  return this.find(query)
    .populate('project', 'name type')
    .populate('stage', 'name type')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get summary for project
progressUpdateSchema.statics.getProjectSummary = async function (projectId) {
  const result = await this.aggregate([
    { $match: { project: new mongoose.Types.ObjectId(projectId) } },
    {
      $group: {
        _id: null,
        totalUpdates: { $sum: 1 },
        totalHoursWorked: { $sum: '$hoursWorked' },
        avgWorkersOnSite: { $avg: '$workersOnSite' },
        totalIssues: { $sum: { $size: '$issues' } },
        unresolvedIssues: {
          $sum: {
            $size: {
              $filter: {
                input: '$issues',
                cond: { $eq: ['$$this.resolved', false] },
              },
            },
          },
        },
        lastUpdate: { $max: '$createdAt' },
      },
    },
  ]);

  return result[0] || {
    totalUpdates: 0,
    totalHoursWorked: 0,
    avgWorkersOnSite: 0,
    totalIssues: 0,
    unresolvedIssues: 0,
    lastUpdate: null,
  };
};

const ProgressUpdate = mongoose.model('ProgressUpdate', progressUpdateSchema);

export default ProgressUpdate;
