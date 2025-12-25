import express from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth.js';
import { triggerUserEvent } from '../utils/realtime.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Project from '../models/Project.js';

const router = express.Router();

/**
 * GET /api/messages/conversations
 * Get all conversations for the current user
 */
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const conversations = await Message.getConversations(req.userId);

    res.json({
      success: true,
      data: { conversations },
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversations.',
    });
  }
});

/**
 * GET /api/messages/conversation/:recipientId
 * Get messages with a specific user
 */
router.get('/conversation/:recipientId', authenticate, async (req, res) => {
  try {
    const { recipientId } = req.params;
    const { projectId, page = 1, limit = 50 } = req.query;

    // Validate recipient exists
    const recipient = await User.findById(recipientId).select('name email avatar role');
    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: 'User not found.',
      });
    }

    const participants = [req.userId, recipientId].sort();
    const query = {
      participants: { $all: participants, $size: 2 },
      deletedFor: { $ne: req.userId },
    };

    if (projectId) {
      query.project = projectId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [messages, total] = await Promise.all([
      Message.find(query)
        .populate('sender', 'name email avatar')
        .populate('replyTo', 'content sender')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Message.countDocuments(query),
    ]);

    // Mark messages as read
    await Message.updateMany(
      {
        ...query,
        sender: { $ne: req.userId },
        'readBy.user': { $ne: req.userId },
      },
      {
        $push: { readBy: { user: req.userId, readAt: new Date() } },
      }
    );

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Return in chronological order
        recipient,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages.',
    });
  }
});

/**
 * POST /api/messages/send
 * Send a message to another user
 */
router.post('/send', authenticate, async (req, res) => {
  try {
    const { recipientId, content, projectId, messageType = 'text', attachments = [], replyTo } = req.body;

    if (!recipientId || !content?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Recipient and message content are required.',
      });
    }

    // Validate recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: 'Recipient not found.',
      });
    }

    // Validate project if provided
    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found.',
        });
      }
    }

    const participants = [req.userId, recipientId].sort();

    const message = new Message({
      participants,
      project: projectId || null,
      type: projectId ? 'project' : 'direct',
      sender: req.userId,
      content: content.trim(),
      messageType,
      attachments,
      replyTo,
      readBy: [{ user: req.userId, readAt: new Date() }], // Sender has read it
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email avatar')
      .populate('replyTo', 'content sender');

    // Trigger real-time notification to recipient
    await triggerUserEvent(recipientId, 'message.new', {
      message: populatedMessage,
      sender: {
        _id: req.userId,
        name: req.user.name,
        avatar: req.user.avatar,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully.',
      data: { message: populatedMessage },
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message.',
    });
  }
});

/**
 * PATCH /api/messages/:id
 * Edit a message
 */
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required.',
      });
    }

    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found.',
      });
    }

    // Only sender can edit
    if (message.sender.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You can only edit your own messages.',
      });
    }

    // Can only edit within 15 minutes
    const fifteenMinutes = 15 * 60 * 1000;
    if (Date.now() - message.createdAt.getTime() > fifteenMinutes) {
      return res.status(400).json({
        success: false,
        error: 'Messages can only be edited within 15 minutes.',
      });
    }

    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email avatar');

    // Notify other participants
    for (const participantId of message.participants) {
      if (participantId.toString() !== req.userId.toString()) {
        await triggerUserEvent(participantId, 'message.edited', {
          message: populatedMessage,
        });
      }
    }

    res.json({
      success: true,
      message: 'Message updated successfully.',
      data: { message: populatedMessage },
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to edit message.',
    });
  }
});

/**
 * DELETE /api/messages/:id
 * Delete a message (soft delete for the user)
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found.',
      });
    }

    // Check if user is a participant
    const isParticipant = message.participants.some(
      (p) => p.toString() === req.userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        error: 'You are not part of this conversation.',
      });
    }

    // Soft delete - add user to deletedFor array
    if (!message.deletedFor.includes(req.userId)) {
      message.deletedFor.push(req.userId);
      await message.save();
    }

    res.json({
      success: true,
      message: 'Message deleted successfully.',
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete message.',
    });
  }
});

/**
 * POST /api/messages/read/:recipientId
 * Mark all messages in a conversation as read
 */
router.post('/read/:recipientId', authenticate, async (req, res) => {
  try {
    const { recipientId } = req.params;
    const { projectId } = req.body;

    const participants = [req.userId, recipientId].sort();
    const query = {
      participants: { $all: participants, $size: 2 },
      sender: { $ne: req.userId },
      'readBy.user': { $ne: req.userId },
    };

    if (projectId) {
      query.project = projectId;
    }

    await Message.updateMany(query, {
      $push: { readBy: { user: req.userId, readAt: new Date() } },
    });

    res.json({
      success: true,
      message: 'Messages marked as read.',
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark messages as read.',
    });
  }
});

/**
 * GET /api/messages/unread-count
 * Get total unread message count for user
 */
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      participants: req.userId,
      sender: { $ne: req.userId },
      'readBy.user': { $ne: req.userId },
      deletedFor: { $ne: req.userId },
    });

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get unread count.',
    });
  }
});

/**
 * GET /api/messages/contacts
 * Get list of users the current user can message
 */
router.get('/contacts', authenticate, async (req, res) => {
  try {
    const { search } = req.query;

    // Get users from projects this user is part of
    const projects = await Project.find({
      $or: [
        { owner: req.userId },
        { contractor: req.userId },
        { 'team.user': req.userId },
      ],
    }).select('owner contractor team');

    // Collect all user IDs from projects
    const userIds = new Set();
    projects.forEach((project) => {
      if (project.owner) userIds.add(project.owner.toString());
      if (project.contractor) userIds.add(project.contractor.toString());
      project.team?.forEach((member) => {
        if (member.user) userIds.add(member.user.toString());
      });
    });

    // Remove current user
    userIds.delete(req.userId.toString());

    // Build query
    const query = {
      _id: { $in: Array.from(userIds) },
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'contractor.company': { $regex: search, $options: 'i' } },
      ];
    }

    const contacts = await User.find(query)
      .select('name email avatar role contractor.company contractor.specializations')
      .sort({ name: 1 })
      .limit(50);

    res.json({
      success: true,
      data: { contacts },
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contacts.',
    });
  }
});

export default router;
