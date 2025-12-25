import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema({
  contractor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: [true, 'Bid amount is required'],
    min: [0, 'Bid amount must be positive'],
  },
  proposal: {
    type: String,
    required: [true, 'Proposal description is required'],
    maxlength: [2000, 'Proposal cannot exceed 2000 characters'],
  },
  estimatedDuration: {
    type: String,
    maxlength: [100, 'Duration cannot exceed 100 characters'],
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending',
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  respondedAt: Date,
  responseNote: String,
});

const jobSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Job poster is required'],
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    budget: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 },
      currency: { type: String, default: 'INR' },
      type: {
        type: String,
        enum: ['fixed', 'hourly', 'negotiable'],
        default: 'fixed',
      },
    },
    requiredSpecializations: [{
      type: String,
      trim: true,
    }],
    location: {
      address: String,
      city: String,
      state: String,
      pincode: String,
    },
    timeline: {
      startDate: Date,
      endDate: Date,
      duration: String,
      flexibility: {
        type: String,
        enum: ['fixed', 'flexible', 'asap'],
        default: 'flexible',
      },
    },
    workType: {
      type: String,
      enum: ['full_construction', 'renovation', 'repair', 'consultation', 'supervision', 'specific_task'],
      default: 'specific_task',
    },
    status: {
      type: String,
      enum: ['draft', 'open', 'in_review', 'assigned', 'in_progress', 'completed', 'cancelled'],
      default: 'open',
    },
    bids: [bidSchema],
    acceptedBid: {
      type: mongoose.Schema.Types.ObjectId,
    },
    assignedContractor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedAt: Date,
    completedAt: Date,
    cancellationReason: String,
    requirements: [{
      item: String,
      description: String,
    }],
    attachments: [{
      name: String,
      url: String,
      type: String,
      uploadedAt: { type: Date, default: Date.now },
    }],
    viewCount: { type: Number, default: 0 },
    bidCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
jobSchema.index({ project: 1 });
jobSchema.index({ postedBy: 1 });
jobSchema.index({ assignedContractor: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ 'location.city': 1 });
jobSchema.index({ requiredSpecializations: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ title: 'text', description: 'text' });

// Virtual for budget range display
jobSchema.virtual('budgetDisplay').get(function () {
  if (!this.budget) return 'Not specified';
  const { min, max, currency } = this.budget;
  if (min && max) {
    return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
  }
  if (min) return `${currency} ${min.toLocaleString()}+`;
  if (max) return `Up to ${currency} ${max.toLocaleString()}`;
  return 'Negotiable';
});

// Virtual for pending bids count
jobSchema.virtual('pendingBidsCount').get(function () {
  return this.bids.filter(b => b.status === 'pending').length;
});

// Pre-save hook to update bid count
jobSchema.pre('save', function (next) {
  this.bidCount = this.bids.length;
  next();
});

// Method to submit a bid
jobSchema.methods.submitBid = function (contractorId, bidData) {
  // Check if contractor already bid
  const existingBid = this.bids.find(
    b => b.contractor.toString() === contractorId.toString()
  );
  if (existingBid) {
    throw new Error('You have already submitted a bid for this job');
  }

  // Check if job is open for bids
  if (this.status !== 'open') {
    throw new Error('This job is not accepting bids');
  }

  this.bids.push({
    contractor: contractorId,
    ...bidData,
  });
  return this.save();
};

// Method to accept a bid
jobSchema.methods.acceptBid = function (bidId, note = '') {
  const bid = this.bids.id(bidId);
  if (!bid) {
    throw new Error('Bid not found');
  }

  // Reject all other bids
  this.bids.forEach(b => {
    if (b._id.toString() === bidId.toString()) {
      b.status = 'accepted';
      b.respondedAt = new Date();
      b.responseNote = note;
    } else if (b.status === 'pending') {
      b.status = 'rejected';
      b.respondedAt = new Date();
      b.responseNote = 'Another bid was accepted';
    }
  });

  this.acceptedBid = bidId;
  this.assignedContractor = bid.contractor;
  this.assignedAt = new Date();
  this.status = 'assigned';

  return this.save();
};

// Method to reject a bid
jobSchema.methods.rejectBid = function (bidId, note = '') {
  const bid = this.bids.id(bidId);
  if (!bid) {
    throw new Error('Bid not found');
  }

  bid.status = 'rejected';
  bid.respondedAt = new Date();
  bid.responseNote = note;

  return this.save();
};

// Method to withdraw a bid
jobSchema.methods.withdrawBid = function (bidId, contractorId) {
  const bid = this.bids.id(bidId);
  if (!bid) {
    throw new Error('Bid not found');
  }

  if (bid.contractor.toString() !== contractorId.toString()) {
    throw new Error('You can only withdraw your own bids');
  }

  if (bid.status !== 'pending') {
    throw new Error('Only pending bids can be withdrawn');
  }

  bid.status = 'withdrawn';
  return this.save();
};

// Static method to get jobs for contractor
jobSchema.statics.findOpenJobs = function (options = {}) {
  const query = { status: 'open' };

  if (options.specializations && options.specializations.length > 0) {
    query.requiredSpecializations = { $in: options.specializations };
  }

  if (options.city) {
    query['location.city'] = { $regex: options.city, $options: 'i' };
  }

  if (options.budgetMin) {
    query['budget.max'] = { $gte: options.budgetMin };
  }

  if (options.budgetMax) {
    query['budget.min'] = { $lte: options.budgetMax };
  }

  return this.find(query)
    .populate('postedBy', 'name avatar')
    .populate('project', 'name type location')
    .sort({ createdAt: -1 });
};

// Static method to get jobs posted by a customer
jobSchema.statics.findByPoster = function (userId) {
  return this.find({ postedBy: userId })
    .populate('assignedContractor', 'name avatar rating company')
    .sort({ createdAt: -1 });
};

// Static method to get jobs where contractor has bid
jobSchema.statics.findByBidder = function (contractorId) {
  return this.find({ 'bids.contractor': contractorId })
    .populate('postedBy', 'name avatar')
    .populate('project', 'name type')
    .sort({ 'bids.submittedAt': -1 });
};

// Static method to get assigned jobs for contractor
jobSchema.statics.findAssigned = function (contractorId) {
  return this.find({
    assignedContractor: contractorId,
    status: { $in: ['assigned', 'in_progress'] },
  })
    .populate('postedBy', 'name avatar phone')
    .populate('project', 'name type location budget')
    .sort({ assignedAt: -1 });
};

const Job = mongoose.model('Job', jobSchema);

export default Job;
