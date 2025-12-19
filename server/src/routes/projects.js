import express from 'express';
import crypto from 'crypto';
import Project from '../models/Project.js';
import Stage from '../models/Stage.js';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { triggerProjectEvent, triggerUserEvent } from '../utils/realtime.js';
import { hashToken } from '../utils/jwt.js';
import { sendProjectInvitation } from '../utils/email.js';

const router = express.Router();

/**
 * GET /api/projects
 * Get all projects for current user
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, type, search, page = 1, limit = 20 } = req.query;

    const query = {
      $or: [
        { owner: req.userId },
        { contractor: req.userId },
        { 'team.user': req.userId },
      ],
    };

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('owner', 'name email avatar')
        .populate('contractor', 'name email avatar')
        .populate('currentStage', 'name status progress')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Project.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects.',
    });
  }
});

/**
 * GET /api/projects/:id
 * Get single project by ID
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar phone')
      .populate('contractor', 'name email avatar phone company')
      .populate('currentStage')
      .populate('stages')
      .populate('team.user', 'name email avatar');

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found.',
      });
    }

    // Check access
    const hasAccess =
      project.owner._id.toString() === req.userId.toString() ||
      project.contractor?._id?.toString() === req.userId.toString() ||
      project.team.some((t) => t.user._id.toString() === req.userId.toString()) ||
      ['admin', 'superadmin'].includes(req.user.role);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this project.',
      });
    }

    res.json({
      success: true,
      data: { project },
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project.',
    });
  }
});

/**
 * GET /api/projects/:id/team
 * Get project team members and invites
 */
router.get('/:id/team', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar phone')
      .populate('contractor', 'name email avatar phone company')
      .populate('team.user', 'name email avatar');

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found.',
      });
    }

    const hasAccess =
      project.owner._id.toString() === req.userId.toString() ||
      project.contractor?._id?.toString() === req.userId.toString() ||
      project.team.some((t) => t.user._id.toString() === req.userId.toString()) ||
      ['admin', 'superadmin'].includes(req.user.role);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this project.',
      });
    }

    res.json({
      success: true,
      data: { team: project.team, invites: project.invites },
    });
  } catch (error) {
    console.error('Get project team error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project team.',
    });
  }
});

/**
 * POST /api/projects
 * Create new project
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      priority,
      location,
      budget,
      timeline,
      tags,
      coverImage,
      createDefaultStages = true,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Project name is required.',
      });
    }

    const project = new Project({
      name,
      description,
      type,
      priority,
      location,
      budget,
      timeline,
      tags,
      coverImage,
      owner: req.userId,
    });

    await project.save();

    // Create default stages if requested
    if (createDefaultStages) {
      const defaultStages = Stage.getDefaultStages();
      const stages = await Stage.insertMany(
        defaultStages.map((stage) => ({
          ...stage,
          project: project._id,
        }))
      );

      project.stages = stages.map((s) => s._id);
      project.currentStage = stages[0]._id;
      await project.save();
    }

    // Populate and return
    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('stages')
      .populate('currentStage');

    await Promise.all([
      triggerProjectEvent(project._id, 'project.created', { project: populatedProject }),
      triggerUserEvent(req.userId, 'project.created', { project: populatedProject }),
    ]);

    res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      data: { project: populatedProject },
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project.',
    });
  }
});

/**
 * PATCH /api/projects/:id
 * Update project
 */
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found.',
      });
    }

    // Check ownership
    const isOwner = project.owner.toString() === req.userId.toString();
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Only the project owner can update this project.',
      });
    }

    const allowedFields = [
      'name',
      'description',
      'status',
      'priority',
      'type',
      'location',
      'budget',
      'timeline',
      'tags',
      'coverImage',
      'contractor',
      'currentStage',
      'settings',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('owner', 'name email avatar')
      .populate('contractor', 'name email avatar')
      .populate('currentStage')
      .populate('stages');

    await triggerProjectEvent(project._id, 'project.updated', { project: updatedProject });

    res.json({
      success: true,
      message: 'Project updated successfully.',
      data: { project: updatedProject },
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update project.',
    });
  }
});

/**
 * DELETE /api/projects/:id
 * Delete project
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found.',
      });
    }

    // Check ownership
    const isOwner = project.owner.toString() === req.userId.toString();
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Only the project owner can delete this project.',
      });
    }

    // Delete associated stages
    await Stage.deleteMany({ project: project._id });

    // Delete the project
    await project.deleteOne();

    await Promise.all([
      triggerProjectEvent(project._id, 'project.deleted', { projectId: project._id }),
      triggerUserEvent(req.userId, 'project.deleted', { projectId: project._id }),
    ]);

    res.json({
      success: true,
      message: 'Project deleted successfully.',
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete project.',
    });
  }
});

/**
 * POST /api/projects/:id/team
 * Add team member to project
 */
router.post('/:id/team', authenticate, async (req, res) => {
  try {
    const { userId, email, role = 'viewer' } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found.',
      });
    }

    // Check ownership
    const isOwner = project.owner.toString() === req.userId.toString();
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Only the project owner can add team members.',
      });
    }

    if (!userId && !email) {
      return res.status(400).json({
        success: false,
        error: 'User ID or email is required.',
      });
    }

    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      const user = await User.findByEmail(normalizedEmail);

      if (user) {
        await project.addTeamMember(user._id, role);

        const updatedProject = await Project.findById(project._id).populate(
          'team.user',
          'name email avatar'
        );

        await triggerProjectEvent(project._id, 'team.updated', { team: updatedProject.team });

        const newMember = updatedProject.team.find(
          (member) => member.user._id.toString() === user._id.toString()
        );

        return res.json({
          success: true,
          message: 'Team member added successfully.',
          data: { member: newMember },
        });
      }

      const existingInvite = project.invites.find(
        (invite) =>
          invite.email === normalizedEmail &&
          invite.status === 'pending' &&
          invite.expiresAt > new Date()
      );

      if (existingInvite) {
        return res.json({
          success: true,
          message: 'Invitation already sent.',
          data: {
            invite: {
              email: existingInvite.email,
              role: existingInvite.role,
              expiresAt: existingInvite.expiresAt,
            },
          },
        });
      }

      const inviteToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = hashToken(inviteToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      project.invites.push({
        email: normalizedEmail,
        role,
        token: hashedToken,
        invitedBy: req.userId,
        expiresAt,
      });

      await project.save();

      const inviterName = req.user?.name || 'A project owner';
      const baseUrl = process.env.CLIENT_INVITE_URL || process.env.CLIENT_BASE_URL || process.env.APP_BASE_URL || '';
      const inviteUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/accept-invite?token=${inviteToken}` : inviteToken;

      sendProjectInvitation({
        to: normalizedEmail,
        projectName: project.name,
        inviterName,
        role,
        inviteUrl,
      }).catch((err) => console.error('Invite email failed:', err));

      return res.status(202).json({
        success: true,
        message: 'Invitation sent successfully.',
        data: { invite: { email: normalizedEmail, role, expiresAt } },
      });
    }

    await project.addTeamMember(userId, role);

    const updatedProject = await Project.findById(project._id).populate(
      'team.user',
      'name email avatar'
    );

    await triggerProjectEvent(project._id, 'team.updated', { team: updatedProject.team });

    const addedMember = updatedProject.team.find(
      (member) => member.user._id.toString() === userId.toString()
    );

    res.json({
      success: true,
      message: 'Team member added successfully.',
      data: { member: addedMember },
    });
  } catch (error) {
    console.error('Add team member error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add team member.',
    });
  }
});

/**
 * DELETE /api/projects/:id/team/:userId
 * Remove team member from project
 */
router.delete('/:id/team/:userId', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found.',
      });
    }

    // Check ownership
    const isOwner = project.owner.toString() === req.userId.toString();
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Only the project owner can remove team members.',
      });
    }

    await project.removeTeamMember(req.params.userId);

    await triggerProjectEvent(project._id, 'team.updated', { team: project.team });

    res.json({
      success: true,
      message: 'Team member removed successfully.',
    });
  } catch (error) {
    console.error('Remove team member error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove team member.',
    });
  }
});

/**
 * POST /api/projects/invites/accept
 * Accept a project invitation
 */
router.post('/invites/accept', authenticate, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Invitation token is required.',
      });
    }

    const hashedToken = hashToken(token);

    const project = await Project.findOne({
      'invites.token': hashedToken,
      'invites.status': 'pending',
      'invites.expiresAt': { $gt: new Date() },
    });

    if (!project) {
      return res.status(400).json({
        success: false,
        error: 'Invitation is invalid or expired.',
      });
    }

    const invite = project.invites.find(
      (item) => item.token === hashedToken && item.status === 'pending'
    );

    if (!invite) {
      return res.status(400).json({
        success: false,
        error: 'Invitation is invalid or expired.',
      });
    }

    await project.addTeamMember(req.userId, invite.role);

    invite.status = 'accepted';
    invite.acceptedAt = new Date();
    invite.acceptedBy = req.userId;

    await project.save();

    await triggerProjectEvent(project._id, 'team.updated', { team: project.team });

    res.json({
      success: true,
      message: 'Invitation accepted successfully.',
      data: { projectId: project._id },
    });
  } catch (error) {
    console.error('Accept invite error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept invitation.',
    });
  }
});

/**
 * GET /api/projects/:id/stats
 * Get project statistics
 */
router.get('/:id/stats', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found.',
      });
    }

    // Get stages statistics
    const stages = await Stage.find({ project: project._id });
    const stageStats = {
      total: stages.length,
      completed: stages.filter((s) => s.status === 'completed').length,
      inProgress: stages.filter((s) => s.status === 'in_progress').length,
      pending: stages.filter((s) => s.status === 'pending').length,
    };

    // Calculate overall progress
    const overallProgress =
      stages.length > 0
        ? Math.round(
            stages.reduce((acc, s) => acc + s.progress, 0) / stages.length
          )
        : 0;

    res.json({
      success: true,
      data: {
        stages: stageStats,
        progress: overallProgress,
        budget: {
          estimated: project.budget.estimated,
          spent: project.budget.spent,
          utilization: project.budgetUtilization,
        },
        timeline: {
          startDate: project.timeline.startDate,
          expectedEndDate: project.timeline.expectedEndDate,
          daysRemaining: project.daysRemaining,
        },
        metrics: project.metrics,
      },
    });
  } catch (error) {
    console.error('Get project stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project statistics.',
    });
  }
});

export default router;
