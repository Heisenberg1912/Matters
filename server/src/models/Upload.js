import mongoose from 'mongoose';

const uploadSchema = new mongoose.Schema(
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
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    filename: {
      type: String,
      required: [true, 'Filename is required'],
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ['image', 'video', 'document', 'audio', 'other'],
      required: true,
    },
    category: {
      type: String,
      enum: [
        'progress_photo',
        'site_photo',
        'material_photo',
        'document',
        'blueprint',
        'invoice',
        'permit',
        'contract',
        'report',
        'other',
      ],
      default: 'progress_photo',
    },
    storage: {
      provider: {
        type: String,
        enum: ['local', 'drive', 's3', 'cloudinary'],
        default: 'drive',
      },
      path: String,
      fileId: String,
      url: String,
      publicUrl: String,
      thumbnailUrl: String,
    },
    metadata: {
      width: Number,
      height: Number,
      duration: Number,
      encoding: String,
      location: {
        lat: Number,
        lng: Number,
      },
      capturedAt: Date,
      device: String,
    },
    analysis: {
      isAnalyzed: { type: Boolean, default: false },
      phase: String,
      phaseConfidence: Number,
      progressEstimate: Number,
      safetyScore: Number,
      qualityScore: Number,
      issues: [{
        type: String,
        severity: String,
        description: String,
      }],
      materials: [{
        name: String,
        confidence: Number,
      }],
      analyzedAt: Date,
    },
    tags: [String],
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['uploading', 'processing', 'ready', 'failed', 'deleted'],
      default: 'uploading',
    },
    accessToken: String,
    accessTokenExpiry: Date,
    views: {
      type: Number,
      default: 0,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    comments: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      content: String,
      createdAt: { type: Date, default: Date.now },
    }],
    relatedUploads: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Upload',
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
uploadSchema.index({ project: 1 });
uploadSchema.index({ stage: 1 });
uploadSchema.index({ uploadedBy: 1 });
uploadSchema.index({ type: 1 });
uploadSchema.index({ category: 1 });
uploadSchema.index({ status: 1 });
uploadSchema.index({ createdAt: -1 });
uploadSchema.index({ tags: 1 });

// Virtual for formatted size
uploadSchema.virtual('formattedSize').get(function () {
  const bytes = this.size;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Virtual for file extension
uploadSchema.virtual('extension').get(function () {
  return this.filename.split('.').pop().toLowerCase();
});

// Pre-save hook to determine file type
uploadSchema.pre('save', function (next) {
  if (this.isNew && !this.type) {
    const mimeType = this.mimeType.toLowerCase();
    if (mimeType.startsWith('image/')) {
      this.type = 'image';
    } else if (mimeType.startsWith('video/')) {
      this.type = 'video';
    } else if (mimeType.startsWith('audio/')) {
      this.type = 'audio';
    } else if (
      mimeType.includes('pdf') ||
      mimeType.includes('document') ||
      mimeType.includes('spreadsheet') ||
      mimeType.includes('text')
    ) {
      this.type = 'document';
    } else {
      this.type = 'other';
    }
  }
  next();
});

// Method to increment views
uploadSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

// Method to increment downloads
uploadSchema.methods.incrementDownloads = function () {
  this.downloads += 1;
  return this.save();
};

// Method to add comment
uploadSchema.methods.addComment = function (userId, content) {
  this.comments.push({ user: userId, content });
  return this.save();
};

// Method to toggle favorite
uploadSchema.methods.toggleFavorite = function () {
  this.isFavorite = !this.isFavorite;
  return this.save();
};

// Method to update analysis results
uploadSchema.methods.updateAnalysis = function (analysisData) {
  this.analysis = {
    ...this.analysis,
    ...analysisData,
    isAnalyzed: true,
    analyzedAt: new Date(),
  };
  return this.save();
};

// Static method to get uploads by project
uploadSchema.statics.findByProject = function (projectId, options = {}) {
  const query = { project: projectId, status: 'ready' };

  if (options.type) {
    query.type = options.type;
  }
  if (options.category) {
    query.category = options.category;
  }
  if (options.stage) {
    query.stage = options.stage;
  }

  return this.find(query).sort({ createdAt: -1 });
};

// Static method to get storage statistics
uploadSchema.statics.getStorageStats = async function (projectId) {
  const result = await this.aggregate([
    { $match: { project: new mongoose.Types.ObjectId(projectId), status: 'ready' } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalSize: { $sum: '$size' },
      },
    },
  ]);

  const stats = {
    total: { count: 0, size: 0 },
    byType: {},
  };

  result.forEach((item) => {
    stats.byType[item._id] = {
      count: item.count,
      size: item.totalSize,
    };
    stats.total.count += item.count;
    stats.total.size += item.totalSize;
  });

  return stats;
};

const Upload = mongoose.model('Upload', uploadSchema);

export default Upload;
