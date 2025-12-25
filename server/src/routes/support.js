import express from 'express';
import crypto from 'crypto';
import SupportTicket from '../models/SupportTicket.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { triggerUserEvent } from '../utils/realtime.js';

const router = express.Router();

const hasProjectAccess = (project, user) => {
  if (!project || !user) return false;
  const userId = user._id.toString();
  return (
    project.owner.toString() === userId ||
    project.contractor?.toString() === userId ||
    project.team.some((member) => member.user.toString() === userId) ||
    ['admin', 'superadmin'].includes(user.role)
  );
};

const isStaffUser = (user) => {
  return ['admin', 'superadmin'].includes(user.role);
};

const generateTicketNumber = () => {
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  const datePart = Date.now().toString().slice(-6);
  return `T-${datePart}-${suffix}`;
};

/**
 * GET /api/support/my-tickets
 * Get all tickets created by the current user
 */
router.get('/my-tickets', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = { user: req.userId };
    if (status && status !== 'all') {
      query.status = status;
    }

    const pageNumber = Math.max(1, parseInt(page, 10));
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNumber - 1) * limitNumber;

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .populate('project', 'name')
        .populate('user', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNumber),
      SupportTicket.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          pages: Math.ceil(total / limitNumber),
        },
      },
    });
  } catch (error) {
    console.error('Get my tickets error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tickets.',
    });
  }
});

/**
 * GET /api/support/project/:projectId
 * Get support tickets for a project
 */
router.get('/project/:projectId', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found.',
      });
    }

    if (!hasProjectAccess(project, req.user)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this project.',
      });
    }

    const isOwnerOrAdmin =
      project.owner.toString() === req.userId.toString() ||
      isStaffUser(req.user);

    const pageNumber = Math.max(1, parseInt(page, 10));
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNumber - 1) * limitNumber;

    const query = { project: project._id };
    if (!isOwnerOrAdmin) {
      query.user = req.userId;
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .populate('user', 'name email avatar')
        .populate('assignedTo', 'name email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNumber),
      SupportTicket.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          pages: Math.ceil(total / limitNumber),
        },
      },
    });
  } catch (error) {
    console.error('Get support tickets error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch support tickets.',
    });
  }
});

/**
 * GET /api/support/:id
 * Get a single ticket with all details
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('project', 'name owner')
      .populate('user', 'name email avatar')
      .populate('assignedTo', 'name email avatar')
      .populate('attachments')
      .populate('replies.user', 'name email avatar')
      .populate('replies.attachments');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found.',
      });
    }

    // Check access
    const project = await Project.findById(ticket.project._id || ticket.project);
    const hasAccess =
      ticket.user._id.toString() === req.userId.toString() ||
      hasProjectAccess(project, req.user) ||
      isStaffUser(req.user);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this ticket.',
      });
    }

    res.json({
      success: true,
      data: { ticket },
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ticket.',
    });
  }
});

/**
 * POST /api/support
 * Create a support ticket
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { project, subject, category, message, attachments = [], priority } = req.body;

    if (!project || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Project, subject, and message are required.',
      });
    }

    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({
        success: false,
        error: 'Project not found.',
      });
    }

    if (!hasProjectAccess(projectDoc, req.user)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this project.',
      });
    }

    const ticket = new SupportTicket({
      ticketNumber: generateTicketNumber(),
      project,
      user: req.userId,
      subject,
      category: category || 'General',
      message,
      priority: priority || 'medium',
      attachments,
    });

    await ticket.save();

    const populatedTicket = await SupportTicket.findById(ticket._id)
      .populate('user', 'name email')
      .populate('project', 'name');

    res.status(201).json({
      success: true,
      message: 'Support ticket created.',
      data: { ticket: populatedTicket },
    });
  } catch (error) {
    console.error('Create support ticket error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create support ticket.',
    });
  }
});

/**
 * POST /api/support/:id/reply
 * Add a reply to a ticket
 */
router.post('/:id/reply', authenticate, async (req, res) => {
  try {
    const { message, attachments = [] } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required.',
      });
    }

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found.',
      });
    }

    // Check access
    const project = await Project.findById(ticket.project);
    const hasAccess =
      ticket.user.toString() === req.userId.toString() ||
      hasProjectAccess(project, req.user) ||
      isStaffUser(req.user);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this ticket.',
      });
    }

    // Don't allow replies on closed tickets
    if (ticket.status === 'closed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot reply to a closed ticket.',
      });
    }

    await ticket.addReply(
      req.userId,
      message.trim(),
      attachments,
      isStaffUser(req.user)
    );

    const updatedTicket = await SupportTicket.findById(ticket._id)
      .populate('replies.user', 'name email avatar');

    // Notify ticket owner if staff replied
    if (isStaffUser(req.user) && ticket.user.toString() !== req.userId.toString()) {
      await triggerUserEvent(ticket.user, 'support.reply', {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        message: 'You have a new reply on your support ticket.',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Reply added successfully.',
      data: { ticket: updatedTicket },
    });
  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add reply.',
    });
  }
});

/**
 * PATCH /api/support/:id
 * Update ticket status or details
 */
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { status, priority, assignedTo, category } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found.',
      });
    }

    // Only ticket owner can update priority/category, staff can update anything
    const isOwner = ticket.user.toString() === req.userId.toString();
    const isStaff = isStaffUser(req.user);

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this ticket.',
      });
    }

    // Apply updates
    if (priority && (isOwner || isStaff)) {
      ticket.priority = priority;
    }
    if (category && (isOwner || isStaff)) {
      ticket.category = category;
    }

    // Staff-only updates
    if (isStaff) {
      if (status) {
        ticket.status = status;
        if (status === 'resolved') {
          ticket.resolvedAt = new Date();
        }
        if (status === 'closed') {
          ticket.closedAt = new Date();
        }
      }
      if (assignedTo !== undefined) {
        ticket.assignedTo = assignedTo || null;
      }
    }

    await ticket.save();

    const updatedTicket = await SupportTicket.findById(ticket._id)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email');

    // Notify user of status change
    if (status && isStaff && ticket.user.toString() !== req.userId.toString()) {
      await triggerUserEvent(ticket.user, 'support.status', {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        status,
        message: `Your ticket status has been updated to: ${status}`,
      });
    }

    res.json({
      success: true,
      message: 'Ticket updated successfully.',
      data: { ticket: updatedTicket },
    });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update ticket.',
    });
  }
});

/**
 * POST /api/support/:id/resolve
 * Mark a ticket as resolved
 */
router.post('/:id/resolve', authenticate, async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found.',
      });
    }

    // Only staff or ticket owner can resolve
    const isOwner = ticket.user.toString() === req.userId.toString();
    const isStaff = isStaffUser(req.user);

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to resolve this ticket.',
      });
    }

    await ticket.resolve(req.userId);

    res.json({
      success: true,
      message: 'Ticket resolved successfully.',
      data: { ticket },
    });
  } catch (error) {
    console.error('Resolve ticket error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve ticket.',
    });
  }
});

/**
 * POST /api/support/:id/close
 * Close a ticket
 */
router.post('/:id/close', authenticate, async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found.',
      });
    }

    // Only staff can close tickets
    if (!isStaffUser(req.user)) {
      return res.status(403).json({
        success: false,
        error: 'Only staff can close tickets.',
      });
    }

    await ticket.close(req.userId);

    res.json({
      success: true,
      message: 'Ticket closed successfully.',
      data: { ticket },
    });
  } catch (error) {
    console.error('Close ticket error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to close ticket.',
    });
  }
});

/**
 * GET /api/support/stats
 * Get support ticket statistics (admin only)
 */
router.get('/admin/stats', authenticate, async (req, res) => {
  try {
    if (!isStaffUser(req.user)) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required.',
      });
    }

    const [
      totalTickets,
      pendingTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      urgentTickets,
    ] = await Promise.all([
      SupportTicket.countDocuments(),
      SupportTicket.countDocuments({ status: 'pending' }),
      SupportTicket.countDocuments({ status: 'in_progress' }),
      SupportTicket.countDocuments({ status: 'resolved' }),
      SupportTicket.countDocuments({ status: 'closed' }),
      SupportTicket.countDocuments({ priority: 'urgent', status: { $in: ['pending', 'in_progress'] } }),
    ]);

    // Get tickets by category
    const byCategory = await SupportTicket.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Get recent tickets
    const recentTickets = await SupportTicket.find()
      .populate('user', 'name email')
      .populate('project', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        overview: {
          total: totalTickets,
          pending: pendingTickets,
          inProgress: inProgressTickets,
          resolved: resolvedTickets,
          closed: closedTickets,
          urgent: urgentTickets,
        },
        byCategory,
        recentTickets,
      },
    });
  } catch (error) {
    console.error('Get support stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics.',
    });
  }
});

export default router;
