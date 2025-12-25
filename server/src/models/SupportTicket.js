import mongoose from 'mongoose';

const replySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    attachments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Upload',
    }],
    isStaff: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved', 'closed'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    attachments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Upload',
    }],
    replies: [replySchema],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: Date,
    closedAt: Date,
    lastReplyAt: Date,
    lastReplyBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

supportTicketSchema.index({ project: 1, createdAt: -1 });
supportTicketSchema.index({ user: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, createdAt: -1 });
supportTicketSchema.index({ assignedTo: 1, status: 1 });

// Instance method to add reply
supportTicketSchema.methods.addReply = async function(userId, message, attachments = [], isStaff = false) {
  this.replies.push({
    user: userId,
    message,
    attachments,
    isStaff,
  });
  this.lastReplyAt = new Date();
  this.lastReplyBy = userId;

  // Auto-update status if staff replies to pending ticket
  if (isStaff && this.status === 'pending') {
    this.status = 'in_progress';
  }

  return this.save();
};

// Instance method to resolve ticket
supportTicketSchema.methods.resolve = async function(userId) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  return this.save();
};

// Instance method to close ticket
supportTicketSchema.methods.close = async function(userId) {
  this.status = 'closed';
  this.closedAt = new Date();
  return this.save();
};

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

export default SupportTicket;
