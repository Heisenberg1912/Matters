import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import Project from '../models/Project.js';
import Stage from '../models/Stage.js';
import Upload from '../models/Upload.js';

const router = express.Router();

// Generate share link for a project (authenticated - project owner only)
router.post('/projects/:id/share', authenticate, async (req, res) => {
  try {
    const { expiresIn, allowedSections, password } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    // Check if user is the owner
    if (project.owner.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Only project owner can share the project',
      });
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');

    // Calculate expiry date if provided
    let expiresAt = null;
    if (expiresIn) {
      const days = parseInt(expiresIn);
      if (!isNaN(days) && days > 0) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
      }
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Default allowed sections
    const sections = allowedSections && allowedSections.length > 0
      ? allowedSections
      : ['overview', 'progress', 'photos', 'timeline'];

    // Update project with public access settings
    project.publicAccess = {
      enabled: true,
      token,
      expiresAt,
      allowedSections: sections,
      password: hashedPassword,
      viewCount: 0,
      createdAt: new Date(),
      createdBy: req.userId,
    };

    await project.save();

    const shareUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/portal/${token}`;

    res.json({
      success: true,
      data: {
        token,
        shareUrl,
        expiresAt,
        allowedSections: sections,
        isPasswordProtected: !!password,
      },
    });
  } catch (error) {
    console.error('Error creating share link:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create share link',
    });
  }
});

// Update share settings
router.patch('/projects/:id/share', authenticate, async (req, res) => {
  try {
    const { enabled, expiresIn, allowedSections, password, removePassword } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    if (project.owner.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Only project owner can update share settings',
      });
    }

    if (!project.publicAccess?.token) {
      return res.status(400).json({
        success: false,
        error: 'No share link exists for this project',
      });
    }

    // Update enabled status
    if (typeof enabled === 'boolean') {
      project.publicAccess.enabled = enabled;
    }

    // Update expiry
    if (expiresIn !== undefined) {
      if (expiresIn === null || expiresIn === 0) {
        project.publicAccess.expiresAt = null;
      } else {
        const days = parseInt(expiresIn);
        if (!isNaN(days) && days > 0) {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + days);
          project.publicAccess.expiresAt = expiresAt;
        }
      }
    }

    // Update allowed sections
    if (allowedSections && allowedSections.length > 0) {
      project.publicAccess.allowedSections = allowedSections;
    }

    // Update password
    if (removePassword) {
      project.publicAccess.password = null;
    } else if (password) {
      project.publicAccess.password = await bcrypt.hash(password, 10);
    }

    await project.save();

    res.json({
      success: true,
      data: {
        enabled: project.publicAccess.enabled,
        token: project.publicAccess.token,
        expiresAt: project.publicAccess.expiresAt,
        allowedSections: project.publicAccess.allowedSections,
        isPasswordProtected: !!project.publicAccess.password,
        viewCount: project.publicAccess.viewCount,
      },
    });
  } catch (error) {
    console.error('Error updating share settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update share settings',
    });
  }
});

// Revoke share link
router.delete('/projects/:id/share', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    if (project.owner.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Only project owner can revoke share link',
      });
    }

    project.publicAccess = {
      enabled: false,
      token: null,
      expiresAt: null,
      allowedSections: [],
      password: null,
      viewCount: 0,
    };

    await project.save();

    res.json({
      success: true,
      message: 'Share link revoked successfully',
    });
  } catch (error) {
    console.error('Error revoking share link:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke share link',
    });
  }
});

// Get share settings for a project (authenticated owner only)
router.get('/projects/:id/share', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    if (project.owner.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Only project owner can view share settings',
      });
    }

    if (!project.publicAccess?.token) {
      return res.json({
        success: true,
        data: {
          enabled: false,
          hasShareLink: false,
        },
      });
    }

    const shareUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/portal/${project.publicAccess.token}`;

    res.json({
      success: true,
      data: {
        enabled: project.publicAccess.enabled,
        hasShareLink: true,
        token: project.publicAccess.token,
        shareUrl,
        expiresAt: project.publicAccess.expiresAt,
        allowedSections: project.publicAccess.allowedSections,
        isPasswordProtected: !!project.publicAccess.password,
        viewCount: project.publicAccess.viewCount,
        createdAt: project.publicAccess.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching share settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch share settings',
    });
  }
});

// ============ PUBLIC PORTAL ROUTES (No auth required) ============

// Verify password for protected portal
router.post('/portal/:token/verify', async (req, res) => {
  try {
    const { password } = req.body;

    const project = await Project.findOne({
      'publicAccess.token': req.params.token,
      'publicAccess.enabled': true,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired share link',
      });
    }

    // Check expiry
    if (project.publicAccess.expiresAt && new Date() > project.publicAccess.expiresAt) {
      return res.status(410).json({
        success: false,
        error: 'This share link has expired',
      });
    }

    // If no password set, return success
    if (!project.publicAccess.password) {
      return res.json({
        success: true,
        data: { verified: true },
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(password || '', project.publicAccess.password);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password',
      });
    }

    res.json({
      success: true,
      data: { verified: true },
    });
  } catch (error) {
    console.error('Error verifying password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify password',
    });
  }
});

// Get public project data (no auth required)
router.get('/portal/:token', async (req, res) => {
  try {
    const project = await Project.findOne({
      'publicAccess.token': req.params.token,
      'publicAccess.enabled': true,
    }).populate('owner', 'name avatar');

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired share link',
      });
    }

    // Check expiry
    if (project.publicAccess.expiresAt && new Date() > project.publicAccess.expiresAt) {
      return res.status(410).json({
        success: false,
        error: 'This share link has expired',
      });
    }

    // Increment view count
    project.publicAccess.viewCount += 1;
    await project.save();

    const allowedSections = project.publicAccess.allowedSections || [];
    const data = {
      name: project.name,
      isPasswordProtected: !!project.publicAccess.password,
      allowedSections,
    };

    // Only include sections that are allowed
    if (allowedSections.includes('overview')) {
      data.overview = {
        description: project.description,
        status: project.status,
        type: project.type,
        mode: project.mode,
        location: project.location?.city || project.location?.address,
        owner: project.owner?.name,
        createdAt: project.createdAt,
      };
    }

    if (allowedSections.includes('progress')) {
      data.progress = {
        percentage: project.progress?.percentage || 0,
        completedStages: project.metrics?.completedStages || 0,
        totalStages: project.stages?.length || 0,
      };

      // Get stage details
      if (project.stages?.length > 0) {
        const stages = await Stage.find({ _id: { $in: project.stages } })
          .select('name type status progress startDate endDate')
          .sort({ order: 1 });

        data.progress.stages = stages.map(s => ({
          name: s.name,
          type: s.type,
          status: s.status,
          progress: s.progress?.percentage || 0,
        }));
      }
    }

    if (allowedSections.includes('timeline')) {
      data.timeline = {
        startDate: project.timeline?.startDate,
        expectedEndDate: project.timeline?.expectedEndDate,
        daysRemaining: project.daysRemaining,
      };
    }

    if (allowedSections.includes('photos')) {
      // Get recent photos
      const photos = await Upload.find({
        project: project._id,
        fileType: 'image',
        category: { $in: ['progress_photo', 'site_photo'] },
      })
        .select('name url thumbnailUrl createdAt')
        .sort({ createdAt: -1 })
        .limit(20);

      data.photos = photos;
    }

    if (allowedSections.includes('budget_summary')) {
      data.budgetSummary = {
        estimated: project.budget?.estimated || 0,
        spent: project.budget?.spent || 0,
        currency: project.budget?.currency || 'INR',
        utilization: project.budgetUtilization || 0,
      };
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching public project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project',
    });
  }
});

export default router;
