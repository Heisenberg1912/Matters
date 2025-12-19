import express from 'express';
import Stage from '../models/Stage.js';
import Project from '../models/Project.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/stages/project/:projectId
 * Get all stages for a project
 */
router.get('/project/:projectId', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found.',
      });
    }

    const stages = await Stage.findByProject(req.params.projectId)
      .populate('uploads')
      .populate('bills')
      .populate('tasks.assignee', 'name email avatar');

    res.json({
      success: true,
      data: { stages },
    });
  } catch (error) {
    console.error('Get stages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stages.',
    });
  }
});

/**
 * GET /api/stages/:id
 * Get single stage by ID
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const stage = await Stage.findById(req.params.id)
      .populate('project', 'name owner')
      .populate('uploads')
      .populate('bills')
      .populate('tasks.assignee', 'name email avatar')
      .populate('checklist.completedBy', 'name email')
      .populate('notes.author', 'name email avatar');

    if (!stage) {
      return res.status(404).json({
        success: false,
        error: 'Stage not found.',
      });
    }

    res.json({
      success: true,
      data: { stage },
    });
  } catch (error) {
    console.error('Get stage error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stage.',
    });
  }
});

/**
 * POST /api/stages
 * Create new stage
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      project: projectId,
      name,
      description,
      type,
      order,
      startDate,
      expectedEndDate,
      budget,
      tasks,
      checklist,
      color,
      icon,
    } = req.body;

    if (!projectId || !name) {
      return res.status(400).json({
        success: false,
        error: 'Project ID and stage name are required.',
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found.',
      });
    }

    // Determine order if not provided
    let stageOrder = order;
    if (stageOrder === undefined) {
      const lastStage = await Stage.findOne({ project: projectId }).sort({
        order: -1,
      });
      stageOrder = lastStage ? lastStage.order + 1 : 0;
    }

    const stage = new Stage({
      project: projectId,
      name,
      description,
      type,
      order: stageOrder,
      startDate,
      expectedEndDate,
      budget,
      tasks,
      checklist,
      color,
      icon,
    });

    await stage.save();

    // Add stage to project
    project.stages.push(stage._id);
    await project.save();

    res.status(201).json({
      success: true,
      message: 'Stage created successfully.',
      data: { stage },
    });
  } catch (error) {
    console.error('Create stage error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create stage.',
    });
  }
});

/**
 * PATCH /api/stages/:id
 * Update stage
 */
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const stage = await Stage.findById(req.params.id);

    if (!stage) {
      return res.status(404).json({
        success: false,
        error: 'Stage not found.',
      });
    }

    const allowedFields = [
      'name',
      'description',
      'type',
      'status',
      'progress',
      'order',
      'startDate',
      'expectedEndDate',
      'budget',
      'tasks',
      'checklist',
      'dependencies',
      'color',
      'icon',
      'weather',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Handle status change
    if (updates.status === 'completed' && stage.status !== 'completed') {
      updates.actualEndDate = new Date();
      updates.progress = 100;

      // Update project metrics
      const project = await Project.findById(stage.project);
      if (project) {
        project.metrics.completedStages += 1;

        // Check if this was the current stage and move to next
        if (
          project.currentStage &&
          project.currentStage.toString() === stage._id.toString()
        ) {
          const nextStage = await Stage.findOne({
            project: project._id,
            order: { $gt: stage.order },
            status: { $ne: 'completed' },
          }).sort({ order: 1 });

          if (nextStage) {
            project.currentStage = nextStage._id;
          }
        }

        await project.save();
      }
    }

    // Handle status change to in_progress
    if (
      updates.status === 'in_progress' &&
      stage.status !== 'in_progress' &&
      !stage.startDate
    ) {
      updates.startDate = new Date();
    }

    const updatedStage = await Stage.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('tasks.assignee', 'name email avatar')
      .populate('checklist.completedBy', 'name email');

    res.json({
      success: true,
      message: 'Stage updated successfully.',
      data: { stage: updatedStage },
    });
  } catch (error) {
    console.error('Update stage error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update stage.',
    });
  }
});

/**
 * DELETE /api/stages/:id
 * Delete stage
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const stage = await Stage.findById(req.params.id);

    if (!stage) {
      return res.status(404).json({
        success: false,
        error: 'Stage not found.',
      });
    }

    // Remove from project
    await Project.findByIdAndUpdate(stage.project, {
      $pull: { stages: stage._id },
    });

    await stage.deleteOne();

    res.json({
      success: true,
      message: 'Stage deleted successfully.',
    });
  } catch (error) {
    console.error('Delete stage error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete stage.',
    });
  }
});

/**
 * POST /api/stages/:id/tasks
 * Add task to stage
 */
router.post('/:id/tasks', authenticate, async (req, res) => {
  try {
    const stage = await Stage.findById(req.params.id);

    if (!stage) {
      return res.status(404).json({
        success: false,
        error: 'Stage not found.',
      });
    }

    const { title, description, assignee, dueDate, priority } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Task title is required.',
      });
    }

    await stage.addTask({
      title,
      description,
      assignee,
      dueDate,
      priority,
    });

    const updatedStage = await Stage.findById(stage._id).populate(
      'tasks.assignee',
      'name email avatar'
    );

    res.status(201).json({
      success: true,
      message: 'Task added successfully.',
      data: { tasks: updatedStage.tasks },
    });
  } catch (error) {
    console.error('Add task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add task.',
    });
  }
});

/**
 * PATCH /api/stages/:id/tasks/:taskId
 * Update task status
 */
router.patch('/:id/tasks/:taskId', authenticate, async (req, res) => {
  try {
    const stage = await Stage.findById(req.params.id);

    if (!stage) {
      return res.status(404).json({
        success: false,
        error: 'Stage not found.',
      });
    }

    const task = stage.tasks.id(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found.',
      });
    }

    // Update task fields
    const { title, description, status, assignee, dueDate, priority } =
      req.body;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) {
      task.status = status;
      if (status === 'completed') {
        task.completedAt = new Date();
      }
    }
    if (assignee !== undefined) task.assignee = assignee;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (priority !== undefined) task.priority = priority;

    await stage.save();

    const updatedStage = await Stage.findById(stage._id).populate(
      'tasks.assignee',
      'name email avatar'
    );

    res.json({
      success: true,
      message: 'Task updated successfully.',
      data: { task: updatedStage.tasks.id(req.params.taskId) },
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update task.',
    });
  }
});

/**
 * DELETE /api/stages/:id/tasks/:taskId
 * Delete task
 */
router.delete('/:id/tasks/:taskId', authenticate, async (req, res) => {
  try {
    const stage = await Stage.findById(req.params.id);

    if (!stage) {
      return res.status(404).json({
        success: false,
        error: 'Stage not found.',
      });
    }

    stage.tasks.pull(req.params.taskId);
    await stage.save();

    res.json({
      success: true,
      message: 'Task deleted successfully.',
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete task.',
    });
  }
});

/**
 * POST /api/stages/:id/checklist
 * Add checklist item
 */
router.post('/:id/checklist', authenticate, async (req, res) => {
  try {
    const stage = await Stage.findById(req.params.id);

    if (!stage) {
      return res.status(404).json({
        success: false,
        error: 'Stage not found.',
      });
    }

    const { item } = req.body;

    if (!item) {
      return res.status(400).json({
        success: false,
        error: 'Checklist item is required.',
      });
    }

    stage.checklist.push({ item });
    await stage.save();

    res.status(201).json({
      success: true,
      message: 'Checklist item added successfully.',
      data: { checklist: stage.checklist },
    });
  } catch (error) {
    console.error('Add checklist item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add checklist item.',
    });
  }
});

/**
 * PATCH /api/stages/:id/checklist/:itemId/toggle
 * Toggle checklist item
 */
router.patch('/:id/checklist/:itemId/toggle', authenticate, async (req, res) => {
  try {
    const stage = await Stage.findById(req.params.id);

    if (!stage) {
      return res.status(404).json({
        success: false,
        error: 'Stage not found.',
      });
    }

    await stage.toggleChecklistItem(req.params.itemId, req.userId);

    const updatedStage = await Stage.findById(stage._id).populate(
      'checklist.completedBy',
      'name email'
    );

    res.json({
      success: true,
      message: 'Checklist item toggled.',
      data: { checklist: updatedStage.checklist },
    });
  } catch (error) {
    console.error('Toggle checklist item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle checklist item.',
    });
  }
});

/**
 * POST /api/stages/:id/notes
 * Add note to stage
 */
router.post('/:id/notes', authenticate, async (req, res) => {
  try {
    const stage = await Stage.findById(req.params.id);

    if (!stage) {
      return res.status(404).json({
        success: false,
        error: 'Stage not found.',
      });
    }

    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Note content is required.',
      });
    }

    stage.notes.push({
      content,
      author: req.userId,
    });
    await stage.save();

    const updatedStage = await Stage.findById(stage._id).populate(
      'notes.author',
      'name email avatar'
    );

    res.status(201).json({
      success: true,
      message: 'Note added successfully.',
      data: { notes: updatedStage.notes },
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add note.',
    });
  }
});

/**
 * POST /api/stages/reorder
 * Reorder stages
 */
router.post('/reorder', authenticate, async (req, res) => {
  try {
    const { projectId, stageOrder } = req.body;

    if (!projectId || !stageOrder || !Array.isArray(stageOrder)) {
      return res.status(400).json({
        success: false,
        error: 'Project ID and stage order array are required.',
      });
    }

    // Update each stage's order
    const updatePromises = stageOrder.map((stageId, index) =>
      Stage.findByIdAndUpdate(stageId, { order: index })
    );

    await Promise.all(updatePromises);

    const stages = await Stage.findByProject(projectId);

    res.json({
      success: true,
      message: 'Stages reordered successfully.',
      data: { stages },
    });
  } catch (error) {
    console.error('Reorder stages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reorder stages.',
    });
  }
});

export default router;
