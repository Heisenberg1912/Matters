import express from 'express';
import Upload from '../models/Upload.js';
import Project from '../models/Project.js';
import Stage from '../models/Stage.js';
import { authenticate } from '../middleware/auth.js';
import { uploadToGoogleDrive, deleteFromGoogleDrive, getFileUrl } from '../utils/googleDrive.js';
import { triggerProjectEvent } from '../utils/realtime.js';
import { upload, handleMulterError } from '../middleware/upload.js';

const router = express.Router();

/**
 * POST /api/uploads/files
 * Upload multiple files to server
 */
router.post('/files', authenticate, upload.array('files', 10), handleMulterError, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded.',
      });
    }

    // Map files to return URLs
    const files = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`, // Relative URL for serving files
    }));

    res.json({
      success: true,
      data: { files },
      message: `${files.length} file(s) uploaded successfully.`,
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: 'File upload failed.',
    });
  }
});

/**
 * GET /api/uploads/project/:projectId
 * Get all uploads for a project
 */
router.get('/project/:projectId', authenticate, async (req, res) => {
  try {
    const { type, category, stage, page = 1, limit = 20 } = req.query;

    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found.',
      });
    }

    const query = { project: req.params.projectId, status: 'ready' };

    if (type) query.type = type;
    if (category) query.category = category;
    if (stage) query.stage = stage;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [uploads, total] = await Promise.all([
      Upload.find(query)
        .populate('uploadedBy', 'name email avatar')
        .populate('stage', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Upload.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        uploads,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get uploads error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch uploads.',
    });
  }
});

/**
 * GET /api/uploads/project/:projectId/stats
 * Get upload statistics for a project
 */
router.get('/project/:projectId/stats', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found.',
      });
    }

    const stats = await Upload.getStorageStats(req.params.projectId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get upload stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch upload statistics.',
    });
  }
});

/**
 * GET /api/uploads/:id
 * Get single upload by ID
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const upload = await Upload.findById(req.params.id)
      .populate('project', 'name owner')
      .populate('stage', 'name')
      .populate('uploadedBy', 'name email avatar')
      .populate('comments.user', 'name email avatar');

    if (!upload) {
      return res.status(404).json({
        success: false,
        error: 'Upload not found.',
      });
    }

    // Increment views
    await upload.incrementViews();

    res.json({
      success: true,
      data: { upload },
    });
  } catch (error) {
    console.error('Get upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch upload.',
    });
  }
});

/**
 * POST /api/uploads
 * Create new upload record (after file is uploaded to storage)
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      project: projectId,
      stage: stageId,
      filename,
      originalName,
      mimeType,
      size,
      type,
      category,
      storage,
      metadata,
      tags,
      description,
    } = req.body;

    if (!projectId || !filename || !mimeType || !size) {
      return res.status(400).json({
        success: false,
        error: 'Project, filename, mimeType, and size are required.',
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found.',
      });
    }

    const upload = new Upload({
      project: projectId,
      stage: stageId,
      uploadedBy: req.userId,
      filename,
      originalName: originalName || filename,
      mimeType,
      size,
      type,
      category,
      storage,
      metadata,
      tags,
      description,
      status: 'ready',
    });

    await upload.save();

    // Update project metrics
    project.metrics.totalUploads += 1;
    await project.save();

    // If stage is specified, add upload reference
    if (stageId) {
      await Stage.findByIdAndUpdate(stageId, {
        $push: { uploads: upload._id },
      });
    }

    const populatedUpload = await Upload.findById(upload._id)
      .populate('uploadedBy', 'name email avatar')
      .populate('stage', 'name');

    await triggerProjectEvent(projectId, 'upload.created', { upload: populatedUpload });

    res.status(201).json({
      success: true,
      message: 'Upload created successfully.',
      data: { upload: populatedUpload },
    });
  } catch (error) {
    console.error('Create upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create upload.',
    });
  }
});

/**
 * POST /api/uploads/upload
 * Upload file to Google Drive and create record
 */
router.post('/upload', authenticate, async (req, res) => {
  try {
    const {
      project: projectId,
      stage: stageId,
      file, // Base64 encoded file
      filename,
      mimeType,
      category,
      tags,
      description,
    } = req.body;

    if (!projectId || !file || !filename || !mimeType) {
      return res.status(400).json({
        success: false,
        error: 'Project, file, filename, and mimeType are required.',
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found.',
      });
    }

    // Decode base64 file
    const buffer = Buffer.from(file, 'base64');
    const size = buffer.length;

    // Upload to Google Drive
    let storageResult;
    try {
      storageResult = await uploadToGoogleDrive({
        filename,
        mimeType,
        buffer,
        folderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
      });
    } catch (uploadError) {
      console.error('Google Drive upload error:', uploadError);
      // Create record with local storage fallback
      storageResult = {
        provider: 'local',
        path: `/uploads/${Date.now()}-${filename}`,
        url: null,
      };
    }

    // Determine file type
    let fileType = 'other';
    if (mimeType.startsWith('image/')) fileType = 'image';
    else if (mimeType.startsWith('video/')) fileType = 'video';
    else if (mimeType.startsWith('audio/')) fileType = 'audio';
    else if (mimeType.includes('pdf') || mimeType.includes('document')) fileType = 'document';

    const upload = new Upload({
      project: projectId,
      stage: stageId,
      uploadedBy: req.userId,
      filename,
      originalName: filename,
      mimeType,
      size,
      type: fileType,
      category: category || 'progress_photo',
      storage: storageResult,
      tags,
      description,
      status: 'ready',
    });

    await upload.save();

    // Update project metrics
    project.metrics.totalUploads += 1;
    await project.save();

    // If stage is specified, add upload reference
    if (stageId) {
      await Stage.findByIdAndUpdate(stageId, {
        $push: { uploads: upload._id },
      });
    }

    const populatedUpload = await Upload.findById(upload._id)
      .populate('uploadedBy', 'name email avatar')
      .populate('stage', 'name');

    await triggerProjectEvent(projectId, 'upload.created', { upload: populatedUpload });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully.',
      data: { upload: populatedUpload },
    });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload file.',
    });
  }
});

/**
 * PATCH /api/uploads/:id
 * Update upload metadata
 */
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const upload = await Upload.findById(req.params.id);

    if (!upload) {
      return res.status(404).json({
        success: false,
        error: 'Upload not found.',
      });
    }

    const allowedFields = ['category', 'tags', 'description', 'isPublic', 'isFavorite'];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const updatedUpload = await Upload.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('uploadedBy', 'name email avatar')
      .populate('stage', 'name');

    await triggerProjectEvent(updatedUpload.project, 'upload.updated', { upload: updatedUpload });

    res.json({
      success: true,
      message: 'Upload updated successfully.',
      data: { upload: updatedUpload },
    });
  } catch (error) {
    console.error('Update upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update upload.',
    });
  }
});

/**
 * DELETE /api/uploads/:id
 * Delete upload
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const upload = await Upload.findById(req.params.id);

    if (!upload) {
      return res.status(404).json({
        success: false,
        error: 'Upload not found.',
      });
    }

    // Delete from Google Drive if applicable
    if (upload.storage?.provider === 'drive' && upload.storage?.fileId) {
      try {
        await deleteFromGoogleDrive(upload.storage.fileId);
      } catch (deleteError) {
        console.error('Google Drive delete error:', deleteError);
      }
    }

    // Update project metrics
    const project = await Project.findById(upload.project);
    if (project) {
      project.metrics.totalUploads -= 1;
      await project.save();
    }

    // Remove from stage if linked
    if (upload.stage) {
      await Stage.findByIdAndUpdate(upload.stage, {
        $pull: { uploads: upload._id },
      });
    }

    await upload.deleteOne();

    await triggerProjectEvent(upload.project, 'upload.deleted', { uploadId: upload._id });

    res.json({
      success: true,
      message: 'Upload deleted successfully.',
    });
  } catch (error) {
    console.error('Delete upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete upload.',
    });
  }
});

/**
 * POST /api/uploads/:id/favorite
 * Toggle favorite status
 */
router.post('/:id/favorite', authenticate, async (req, res) => {
  try {
    const upload = await Upload.findById(req.params.id);

    if (!upload) {
      return res.status(404).json({
        success: false,
        error: 'Upload not found.',
      });
    }

    await upload.toggleFavorite();

    res.json({
      success: true,
      message: upload.isFavorite ? 'Added to favorites.' : 'Removed from favorites.',
      data: { isFavorite: upload.isFavorite },
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle favorite.',
    });
  }
});

/**
 * POST /api/uploads/:id/comment
 * Add comment to upload
 */
router.post('/:id/comment', authenticate, async (req, res) => {
  try {
    const upload = await Upload.findById(req.params.id);

    if (!upload) {
      return res.status(404).json({
        success: false,
        error: 'Upload not found.',
      });
    }

    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Comment content is required.',
      });
    }

    await upload.addComment(req.userId, content);

    const updatedUpload = await Upload.findById(upload._id).populate(
      'comments.user',
      'name email avatar'
    );

    await triggerProjectEvent(upload.project, 'upload.comment.added', {
      uploadId: upload._id,
      comments: updatedUpload.comments,
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully.',
      data: { comments: updatedUpload.comments },
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment.',
    });
  }
});

/**
 * POST /api/uploads/:id/analyze
 * Analyze upload using ML (for images)
 */
router.post('/:id/analyze', authenticate, async (req, res) => {
  try {
    const upload = await Upload.findById(req.params.id);

    if (!upload) {
      return res.status(404).json({
        success: false,
        error: 'Upload not found.',
      });
    }

    if (upload.type !== 'image') {
      return res.status(400).json({
        success: false,
        error: 'Only images can be analyzed.',
      });
    }

    // This would integrate with the ML routes
    // For now, return mock analysis
    const analysisResult = {
      phase: 'structure',
      phaseConfidence: 0.85,
      progressEstimate: 45,
      safetyScore: 0.9,
      qualityScore: 0.88,
      issues: [],
      materials: [
        { name: 'Concrete', confidence: 0.9 },
        { name: 'Steel', confidence: 0.85 },
      ],
    };

    await upload.updateAnalysis(analysisResult);

    await triggerProjectEvent(upload.project, 'upload.analysis.updated', {
      uploadId: upload._id,
      analysis: upload.analysis,
    });

    res.json({
      success: true,
      message: 'Analysis completed.',
      data: { analysis: upload.analysis },
    });
  } catch (error) {
    console.error('Analyze upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze upload.',
    });
  }
});

export default router;
