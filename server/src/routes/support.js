import express from 'express';
import crypto from 'crypto';
import SupportTicket from '../models/SupportTicket.js';
import Project from '../models/Project.js';
import { authenticate } from '../middleware/auth.js';

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

const generateTicketNumber = () => {
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  const datePart = Date.now().toString().slice(-6);
  return `T-${datePart}-${suffix}`;
};

/**
 * GET /api/support/project/:projectId
 * Get support tickets for a project
 */
router.get('/project/:projectId', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
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
      ['admin', 'superadmin'].includes(req.user.role);

    const pageNumber = Math.max(1, parseInt(page, 10));
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNumber - 1) * limitNumber;

    const query = { project: project._id };
    if (!isOwnerOrAdmin) {
      query.user = req.userId;
    }

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .sort({ createdAt: -1 })
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
      category,
      message,
      priority,
      attachments,
    });

    await ticket.save();

    res.status(201).json({
      success: true,
      message: 'Support ticket created.',
      data: { ticket },
    });
  } catch (error) {
    console.error('Create support ticket error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create support ticket.',
    });
  }
});

export default router;
