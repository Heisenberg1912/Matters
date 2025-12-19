import express from 'express';
import Bill from '../models/Bill.js';
import Project from '../models/Project.js';
import Stage from '../models/Stage.js';
import { authenticate } from '../middleware/auth.js';
import { triggerProjectEvent } from '../utils/realtime.js';

const router = express.Router();

/**
 * GET /api/budget/project/:projectId
 * Get all bills for a project
 */
router.get('/project/:projectId', authenticate, async (req, res) => {
  try {
    const { status, type, category, page = 1, limit = 20 } = req.query;

    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found.',
      });
    }

    const query = { project: req.params.projectId };

    if (status) {
      query['payment.status'] = status;
    }
    if (type) {
      query.type = type;
    }
    if (category) {
      query.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bills, total] = await Promise.all([
      Bill.find(query)
        .populate('createdBy', 'name email')
        .populate('stage', 'name')
        .sort({ billDate: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Bill.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        bills,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bills.',
    });
  }
});

/**
 * GET /api/budget/project/:projectId/summary
 * Get budget summary for a project
 */
router.get('/project/:projectId/summary', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found.',
      });
    }

    const summary = await Bill.getSummaryByProject(req.params.projectId);

    // Get breakdown by type
    const typeBreakdown = await Bill.aggregate([
      { $match: { project: project._id } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount.total' },
          paid: { $sum: '$payment.paidAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get breakdown by category
    const categoryBreakdown = await Bill.aggregate([
      { $match: { project: project._id } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount.total' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]);

    // Get monthly trend
    const monthlyTrend = await Bill.aggregate([
      { $match: { project: project._id } },
      {
        $group: {
          _id: {
            year: { $year: '$billDate' },
            month: { $month: '$billDate' },
          },
          total: { $sum: '$amount.total' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalBudget: project.budget.estimated,
          totalSpent: summary.totalAmount,
          totalPaid: summary.paidAmount,
          pending: summary.totalAmount - summary.paidAmount,
          billCount: summary.count,
          utilization: project.budget.estimated
            ? Math.round((summary.totalAmount / project.budget.estimated) * 100)
            : 0,
        },
        byType: typeBreakdown,
        byCategory: categoryBreakdown,
        monthlyTrend: monthlyTrend.map((m) => ({
          month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
          total: m.total,
          count: m.count,
        })),
      },
    });
  } catch (error) {
    console.error('Get budget summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch budget summary.',
    });
  }
});

/**
 * GET /api/budget/:id
 * Get single bill by ID
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('project', 'name owner')
      .populate('stage', 'name')
      .populate('createdBy', 'name email avatar')
      .populate('approval.approvedBy', 'name email')
      .populate('approval.rejectedBy', 'name email');

    if (!bill) {
      return res.status(404).json({
        success: false,
        error: 'Bill not found.',
      });
    }

    res.json({
      success: true,
      data: { bill },
    });
  } catch (error) {
    console.error('Get bill error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bill.',
    });
  }
});

/**
 * POST /api/budget
 * Create new bill
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      project: projectId,
      stage: stageId,
      title,
      description,
      type,
      category,
      vendor,
      items,
      amount,
      payment,
      billDate,
      invoiceNumber,
      attachments,
      tags,
      notes,
    } = req.body;

    if (!projectId || !title || !amount?.total) {
      return res.status(400).json({
        success: false,
        error: 'Project, title, and amount are required.',
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found.',
      });
    }

    const bill = new Bill({
      project: projectId,
      stage: stageId,
      createdBy: req.userId,
      title,
      description,
      type,
      category,
      vendor,
      items,
      amount,
      payment,
      billDate,
      invoiceNumber,
      attachments,
      tags,
      notes,
    });

    await bill.save();

    // Update project budget spent
    await project.updateBudgetSpent(bill.amount.total);

    // Update project metrics
    project.metrics.totalBills += 1;
    await project.save();

    // If stage is specified, add bill reference
    if (stageId) {
      await Stage.findByIdAndUpdate(stageId, {
        $push: { bills: bill._id },
        $inc: { 'budget.spent': bill.amount.total },
      });
    }

    const populatedBill = await Bill.findById(bill._id)
      .populate('createdBy', 'name email')
      .populate('stage', 'name');

    await triggerProjectEvent(projectId, 'budget.bill.created', { bill: populatedBill });

    res.status(201).json({
      success: true,
      message: 'Bill created successfully.',
      data: { bill: populatedBill },
    });
  } catch (error) {
    console.error('Create bill error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create bill.',
    });
  }
});

/**
 * PATCH /api/budget/:id
 * Update bill
 */
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        error: 'Bill not found.',
      });
    }

    const allowedFields = [
      'title',
      'description',
      'type',
      'category',
      'vendor',
      'items',
      'amount',
      'payment',
      'billDate',
      'invoiceNumber',
      'attachments',
      'tags',
      'notes',
      'status',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const updatedBill = await Bill.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email')
      .populate('stage', 'name');

    await triggerProjectEvent(updatedBill.project, 'budget.bill.updated', { bill: updatedBill });

    res.json({
      success: true,
      message: 'Bill updated successfully.',
      data: { bill: updatedBill },
    });
  } catch (error) {
    console.error('Update bill error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update bill.',
    });
  }
});

/**
 * DELETE /api/budget/:id
 * Delete bill
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        error: 'Bill not found.',
      });
    }

    // Update project budget
    const project = await Project.findById(bill.project);
    if (project) {
      project.budget.spent -= bill.amount.total;
      project.metrics.totalBills -= 1;
      await project.save();
    }

    // Remove from stage if linked
    if (bill.stage) {
      await Stage.findByIdAndUpdate(bill.stage, {
        $pull: { bills: bill._id },
        $inc: { 'budget.spent': -bill.amount.total },
      });
    }

    await bill.deleteOne();

    await triggerProjectEvent(bill.project, 'budget.bill.deleted', { billId: bill._id });

    res.json({
      success: true,
      message: 'Bill deleted successfully.',
    });
  } catch (error) {
    console.error('Delete bill error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete bill.',
    });
  }
});

/**
 * POST /api/budget/:id/payment
 * Add payment to bill
 */
router.post('/:id/payment', authenticate, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        error: 'Bill not found.',
      });
    }

    const { amount, method, reference, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid payment amount is required.',
      });
    }

    if (amount > bill.pendingAmount) {
      return res.status(400).json({
        success: false,
        error: 'Payment amount exceeds pending amount.',
      });
    }

    await bill.addPayment(amount, method, reference, notes);

    const updatedBill = await Bill.findById(bill._id)
      .populate('createdBy', 'name email')
      .populate('stage', 'name');

    await triggerProjectEvent(updatedBill.project, 'budget.bill.payment', { bill: updatedBill });

    res.json({
      success: true,
      message: 'Payment added successfully.',
      data: { bill: updatedBill },
    });
  } catch (error) {
    console.error('Add payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add payment.',
    });
  }
});

/**
 * POST /api/budget/:id/approve
 * Approve bill
 */
router.post('/:id/approve', authenticate, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        error: 'Bill not found.',
      });
    }

    const { comments } = req.body;

    await bill.approve(req.userId, comments);

    const updatedBill = await Bill.findById(bill._id)
      .populate('createdBy', 'name email')
      .populate('approval.approvedBy', 'name email');

    await triggerProjectEvent(updatedBill.project, 'budget.bill.approved', { bill: updatedBill });

    res.json({
      success: true,
      message: 'Bill approved successfully.',
      data: { bill: updatedBill },
    });
  } catch (error) {
    console.error('Approve bill error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve bill.',
    });
  }
});

/**
 * POST /api/budget/:id/reject
 * Reject bill
 */
router.post('/:id/reject', authenticate, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        error: 'Bill not found.',
      });
    }

    const { comments } = req.body;

    if (!comments) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required.',
      });
    }

    await bill.reject(req.userId, comments);

    const updatedBill = await Bill.findById(bill._id)
      .populate('createdBy', 'name email')
      .populate('approval.rejectedBy', 'name email');

    await triggerProjectEvent(updatedBill.project, 'budget.bill.rejected', { bill: updatedBill });

    res.json({
      success: true,
      message: 'Bill rejected.',
      data: { bill: updatedBill },
    });
  } catch (error) {
    console.error('Reject bill error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject bill.',
    });
  }
});

export default router;
