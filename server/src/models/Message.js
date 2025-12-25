import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    // Conversation participants (sorted for consistency)
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }],
    // For group chats or project-based chats
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    // Conversation type
    type: {
      type: String,
      enum: ['direct', 'project', 'support'],
      default: 'direct',
    },
    // The actual message
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    // Message type
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'system'],
      default: 'text',
    },
    // Attachments
    attachments: [{
      filename: String,
      originalName: String,
      mimeType: String,
      size: Number,
      url: String,
    }],
    // Read receipts
    readBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      readAt: {
        type: Date,
        default: Date.now,
      },
    }],
    // For replies
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    // Soft delete
    deletedFor: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
messageSchema.index({ participants: 1, createdAt: -1 });
messageSchema.index({ project: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });

// Static method to get or create conversation
messageSchema.statics.getConversation = async function(userId1, userId2, projectId = null) {
  const participants = [userId1, userId2].sort();

  const query = {
    participants: { $all: participants, $size: 2 },
  };

  if (projectId) {
    query.project = projectId;
  }

  // Get latest message for the conversation
  const latestMessage = await this.findOne(query)
    .sort({ createdAt: -1 })
    .populate('sender', 'name email avatar')
    .lean();

  return latestMessage;
};

// Static method to get all conversations for a user
messageSchema.statics.getConversations = async function(userId) {
  const conversations = await this.aggregate([
    {
      $match: {
        participants: new mongoose.Types.ObjectId(userId),
        deletedFor: { $ne: new mongoose.Types.ObjectId(userId) },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $group: {
        _id: {
          participants: '$participants',
          project: '$project',
        },
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ['$sender', new mongoose.Types.ObjectId(userId)] },
                  {
                    $not: {
                      $in: [new mongoose.Types.ObjectId(userId), '$readBy.user'],
                    },
                  },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $sort: { 'lastMessage.createdAt': -1 },
    },
    {
      $limit: 50,
    },
  ]);

  // Populate user details
  const Message = this;
  const populatedConversations = await Promise.all(
    conversations.map(async (conv) => {
      const otherUserId = conv._id.participants.find(
        (p) => p.toString() !== userId.toString()
      );

      const User = mongoose.model('User');
      const otherUser = await User.findById(otherUserId)
        .select('name email avatar role contractor.company')
        .lean();

      let project = null;
      if (conv._id.project) {
        const Project = mongoose.model('Project');
        project = await Project.findById(conv._id.project)
          .select('name')
          .lean();
      }

      return {
        id: `${conv._id.participants.sort().join('-')}${conv._id.project ? `-${conv._id.project}` : ''}`,
        otherUser,
        project,
        lastMessage: {
          content: conv.lastMessage.content,
          createdAt: conv.lastMessage.createdAt,
          sender: conv.lastMessage.sender,
        },
        unreadCount: conv.unreadCount,
      };
    })
  );

  return populatedConversations;
};

// Instance method to mark as read
messageSchema.methods.markAsRead = async function(userId) {
  const alreadyRead = this.readBy.some(
    (r) => r.user.toString() === userId.toString()
  );

  if (!alreadyRead && this.sender.toString() !== userId.toString()) {
    this.readBy.push({ user: userId, readAt: new Date() });
    await this.save();
  }

  return this;
};

const Message = mongoose.model('Message', messageSchema);

export default Message;
