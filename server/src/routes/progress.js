import express from 'express';
import { authenticate, isContractor, isContractorOrAdmin, isCustomerOrAdmin } from '../middleware/auth.js';
import ProgressUpdate from '../models/ProgressUpdate.js';
import Project from '../models/Project.js';
import Job from '../models/Job.js';
import { triggerUserEvent, triggerProjectEvent } from '../utils/realtime.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/progress/project/:projectId - Get progress updates for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const { type, limit = 50, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Verify access to project
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    // Check access: owner, contractor, team member, or admin
    const isOwner = project.owner.toString() === req.userId.toString();
    const isProjectContractor = project.contractor?.toString() === req.userId.toString();
    const isTeamMember = project.team.some(t => t.user.toString() === req.userId.toString());
    const isAdminUser = ['admin', 'superadmin'].includes(req.user.role);

    if (!isOwner && !isProjectContractor && !isTeamMember && !isAdminUser) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this project',
      });
    }

    const options = { limit: parseInt(limit), skip };
    if (type) options.type = type;

    // For customers, only show customer-visible updates
    if (req.user.role === 'user') {
      options.customerVisible = true;
    }

    const [updates, total, summary] = await Promise.all([
      ProgressUpdate.findByProject(req.params.projectId, options),
      ProgressUpdate.countDocuments({
        project: req.params.projectId,
        ...(options.type ? { type: options.type } : {}),
        ...(options.customerVisible !== undefined ? { customerVisible: options.customerVisible } : {}),
      }),
      ProgressUpdate.getProjectSummary(req.params.projectId),
    ]);

    res.json({
      success: true,
      data: {
        updates,
        summary,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching progress updates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch progress updates',
    });
  }
});

// GET /api/progress/my-updates - Contractor's own updates
router.get('/my-updates', isContractor, async (req, res) => {
  try {
    const { projectId, limit = 50, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const options = { limit: parseInt(limit), skip };
    if (projectId) options.projectId = projectId;

    const [updates, total] = await Promise.all([
      ProgressUpdate.findByContractor(req.userId, options),
      ProgressUpdate.countDocuments({
        contractor: req.userId,
        ...(projectId ? { project: projectId } : {}),
      }),
    ]);

    res.json({
      success: true,
      data: {
        updates,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching my updates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch your updates',
    });
  }
});

// GET /api/progress/:id - Get single progress update
router.get('/:id', async (req, res) => {
  try {
    const update = await ProgressUpdate.findById(req.params.id)
      .populate('contractor', 'name avatar company')
      .populate('project', 'name type owner contractor')
      .populate('stage', 'name type')
      .populate('photos', 'url thumbnailUrl originalName')
      .populate('comments.user', 'name avatar');

    if (!update) {
      return res.status(404).json({
        success: false,
        error: 'Progress update not found',
      });
    }

    // Check access
    const project = update.project;
    const isOwner = project.owner.toString() === req.userId.toString();
    const isProjectContractor = project.contractor?.toString() === req.userId.toString();
    const isUpdateContractor = update.contractor._id.toString() === req.userId.toString();
    const isAdminUser = ['admin', 'superadmin'].includes(req.user.role);

    if (!isOwner && !isProjectContractor && !isUpdateContractor && !isAdminUser) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this update',
      });
    }

    res.json({
      success: true,
      data: update,
    });
  } catch (error) {
    console.error('Error fetching progress update:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch progress update',
    });
  }
});

// POST /api/progress - Submit a progress update (contractors only)
router.post('/', isContractor, async (req, res) => {
  try {
    const {
      projectId,
      stageId,
      jobId,
      type,
      title,
      description,
      photoUrls,
      workDone,
      materialsUsed,
      issues,
      weather,
      workersOnSite,
      hoursWorked,
      progressPercentage,
      nextSteps,
      blockers,
      customerVisible,
    } = req.body;

    // Verify project access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    // Check if contractor is assigned to project
    const isProjectContractor = project.contractor?.toString() === req.userId.toString();

    // Or check if contractor is assigned via a job
    let isJobContractor = false;
    if (jobId) {
      const job = await Job.findById(jobId);
      if (job && job.assignedContractor?.toString() === req.userId.toString()) {
        isJobContractor = true;
      }
    } else {
      // Check if any job in project is assigned to this contractor
      const assignedJob = await Job.findOne({
        project: projectId,
        assignedContractor: req.userId,
        status: { $in: ['assigned', 'in_progress'] },
      });
      if (assignedJob) {
        isJobContractor = true;
      }
    }

    if (!isProjectContractor && !isJobContractor) {
      return res.status(403).json({
        success: false,
        error: 'You are not assigned to this project',
      });
    }

    const progressUpdate = await ProgressUpdate.create({
      project: projectId,
      stage: stageId,
      job: jobId,
      contractor: req.userId,
      type: type || 'general',
      title,
      description,
      photoUrls,
      workDone,
      materialsUsed,
      issues,
      weather,
      workersOnSite,
      hoursWorked,
      progressPercentage,
      nextSteps,
      blockers,
      customerVisible: customerVisible !== false,
    });

    await progressUpdate.populate('contractor', 'name avatar company');
    await progressUpdate.populate('project', 'name type');

    // Send notification to project owner
    try {
      await triggerUserEvent(project.owner.toString(), 'progress-update', {
        updateId: progressUpdate._id,
        projectId: project._id,
        projectName: project.name,
        type: progressUpdate.type,
        contractor: {
          id: req.userId,
          name: req.user.name,
          avatar: req.user.avatar,
        },
        description: description?.substring(0, 100),
        photoCount: photoUrls?.length || 0,
      });

      // Also trigger project event for all team members
      await triggerProjectEvent(project._id.toString(), 'progress-update', {
        updateId: progressUpdate._id,
        type: progressUpdate.type,
        contractor: req.user.name,
        description: description?.substring(0, 100),
      });
    } catch (notifError) {
      console.error('Failed to send notification:', notifError);
    }

    res.status(201).json({
      success: true,
      data: progressUpdate,
      message: 'Progress update submitted successfully',
    });
  } catch (error) {
    console.error('Error creating progress update:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit progress update',
    });
  }
});

// PATCH /api/progress/:id - Update a progress update (contractor only, within 24h)
router.patch('/:id', isContractor, async (req, res) => {
  try {
    const update = await ProgressUpdate.findById(req.params.id);

    if (!update) {
      return res.status(404).json({
        success: false,
        error: 'Progress update not found',
      });
    }

    // Check ownership
    if (update.contractor.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You can only edit your own updates',
      });
    }

    // Check time limit (24 hours)
    const hoursSinceCreation = (Date.now() - update.createdAt) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      return res.status(400).json({
        success: false,
        error: 'Updates can only be edited within 24 hours of creation',
      });
    }

    const allowedUpdates = [
      'title', 'description', 'photoUrls', 'workDone', 'materialsUsed',
      'issues', 'weather', 'workersOnSite', 'hoursWorked', 'progressPercentage',
      'nextSteps', 'blockers', 'customerVisible',
    ];

    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const updatedProgress = await ProgressUpdate.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('contractor', 'name avatar company')
      .populate('project', 'name type');

    res.json({
      success: true,
      data: updatedProgress,
      message: 'Progress update modified successfully',
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update progress',
    });
  }
});

// DELETE /api/progress/:id - Delete a progress update (contractor only, within 1h)
router.delete('/:id', isContractor, async (req, res) => {
  try {
    const update = await ProgressUpdate.findById(req.params.id);

    if (!update) {
      return res.status(404).json({
        success: false,
        error: 'Progress update not found',
      });
    }

    // Check ownership
    if (update.contractor.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own updates',
      });
    }

    // Check time limit (1 hour)
    const hoursSinceCreation = (Date.now() - update.createdAt) / (1000 * 60 * 60);
    if (hoursSinceCreation > 1) {
      return res.status(400).json({
        success: false,
        error: 'Updates can only be deleted within 1 hour of creation',
      });
    }

    await ProgressUpdate.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Progress update deleted',
    });
  } catch (error) {
    console.error('Error deleting progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete progress update',
    });
  }
});

// POST /api/progress/:id/acknowledge - Customer acknowledges update
router.post('/:id/acknowledge', isCustomerOrAdmin, async (req, res) => {
  try {
    const update = await ProgressUpdate.findById(req.params.id)
      .populate('project', 'owner');

    if (!update) {
      return res.status(404).json({
        success: false,
        error: 'Progress update not found',
      });
    }

    // Check if user owns the project
    if (update.project.owner.toString() !== req.userId.toString() &&
        !['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Only the project owner can acknowledge updates',
      });
    }

    await update.acknowledge(req.userId);

    res.json({
      success: true,
      message: 'Update acknowledged',
    });
  } catch (error) {
    console.error('Error acknowledging update:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge update',
    });
  }
});

// POST /api/progress/:id/comment - Add comment to update
router.post('/:id/comment', async (req, res) => {
  try {
    const update = await ProgressUpdate.findById(req.params.id)
      .populate('project', 'owner contractor');

    if (!update) {
      return res.status(404).json({
        success: false,
        error: 'Progress update not found',
      });
    }

    // Check access
    const project = update.project;
    const isOwner = project.owner.toString() === req.userId.toString();
    const isProjectContractor = project.contractor?.toString() === req.userId.toString();
    const isUpdateContractor = update.contractor.toString() === req.userId.toString();
    const isAdminUser = ['admin', 'superadmin'].includes(req.user.role);

    if (!isOwner && !isProjectContractor && !isUpdateContractor && !isAdminUser) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to comment on this update',
      });
    }

    const { text } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Comment text is required',
      });
    }

    await update.addComment(req.userId, text);

    await update.populate('comments.user', 'name avatar');

    res.status(201).json({
      success: true,
      data: update.comments[update.comments.length - 1],
      message: 'Comment added',
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment',
    });
  }
});

// POST /api/progress/:id/issue/:issueIndex/resolve - Resolve an issue
router.post('/:id/issue/:issueIndex/resolve', isContractorOrAdmin, async (req, res) => {
  try {
    const update = await ProgressUpdate.findById(req.params.id);

    if (!update) {
      return res.status(404).json({
        success: false,
        error: 'Progress update not found',
      });
    }

    // Check if contractor owns the update or is admin
    if (update.contractor.toString() !== req.userId.toString() &&
        !['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'You can only resolve issues on your own updates',
      });
    }

    const { resolution } = req.body;
    await update.resolveIssue(parseInt(req.params.issueIndex), resolution);

    res.json({
      success: true,
      message: 'Issue resolved',
    });
  } catch (error) {
    console.error('Error resolving issue:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to resolve issue',
    });
  }
});

export default router;
