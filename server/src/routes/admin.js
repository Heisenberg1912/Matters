import express from 'express';
import { authenticate, isSuperAdmin } from '../middleware/auth.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Plan from '../models/Plan.js';

const router = express.Router();

// All admin routes require authentication and superadmin role
router.use(authenticate, isSuperAdmin);

// Get platform-wide statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalProjects,
      activeProjects,
      usersByRole,
      usersByPlan,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Project.countDocuments(),
      Project.countDocuments({ status: { $in: ['planning', 'in_progress'] } }),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $group: { _id: '$subscription.plan', count: { $sum: 1 } } },
      ]),
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email role subscription.plan createdAt'),
    ]);

    // Convert aggregations to objects
    const roleStats = {};
    usersByRole.forEach(r => {
      roleStats[r._id || 'user'] = r.count;
    });

    const planStats = {};
    usersByPlan.forEach(p => {
      planStats[p._id || 'free'] = p.count;
    });

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
          byRole: roleStats,
        },
        projects: {
          total: totalProjects,
          active: activeProjects,
        },
        subscriptions: {
          byPlan: planStats,
          totalPaid: (planStats.pro || 0) + (planStats.enterprise || 0),
        },
        recentUsers,
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
    });
  }
});

// Get all users with pagination and search
router.get('/users', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      role = '',
      plan = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Filter by plan
    if (plan) {
      query['subscription.plan'] = plan;
    }

    // Filter by status
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [users, total] = await Promise.all([
      User.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-password -refreshTokens -passwordResetToken -verificationToken'),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
    });
  }
});

// Get single user details with usage
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -refreshTokens -passwordResetToken -verificationToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Get user's projects
    const projects = await Project.find({ owner: user._id })
      .select('name status budget progress createdAt');

    // Get plan details
    const plan = await Plan.getPlanById(user.subscription?.plan || 'free');

    res.json({
      success: true,
      data: {
        user,
        projects,
        plan: plan ? {
          id: plan.planId,
          name: plan.name,
          limits: plan.limits,
        } : null,
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
    });
  }
});

// Update user (role, status, subscription)
router.patch('/users/:id', async (req, res) => {
  try {
    const { role, isActive, subscription } = req.body;
    const updates = {};

    // Prevent self-demotion for safety
    if (req.params.id === req.userId.toString()) {
      return res.status(400).json({
        success: false,
        error: 'You cannot modify your own account from admin panel',
      });
    }

    if (role && ['user', 'contractor', 'admin', 'superadmin'].includes(role)) {
      updates.role = role;
    }

    if (typeof isActive === 'boolean') {
      updates.isActive = isActive;
    }

    if (subscription) {
      if (subscription.plan && ['free', 'pro', 'enterprise'].includes(subscription.plan)) {
        updates['subscription.plan'] = subscription.plan;
        updates['subscription.assignedBy'] = req.userId;
        updates['subscription.startDate'] = new Date();

        if (subscription.endDate) {
          updates['subscription.endDate'] = new Date(subscription.endDate);
        }
      }

      if (subscription.status && ['active', 'canceled', 'expired'].includes(subscription.status)) {
        updates['subscription.status'] = subscription.status;
      }

      if (subscription.notes !== undefined) {
        updates['subscription.notes'] = subscription.notes;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -refreshTokens -passwordResetToken -verificationToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
    });
  }
});

// Deactivate user (soft delete)
router.delete('/users/:id', async (req, res) => {
  try {
    // Prevent self-deletion
    if (req.params.id === req.userId.toString()) {
      return res.status(400).json({
        success: false,
        error: 'You cannot deactivate your own account',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('name email isActive');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate user',
    });
  }
});

// Get all projects (admin view)
router.get('/projects', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('owner', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .select('name status budget progress owner createdAt'),
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
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects',
    });
  }
});

// Get subscription analytics
router.get('/subscriptions', async (req, res) => {
  try {
    const [
      planDistribution,
      statusDistribution,
      recentUpgrades,
    ] = await Promise.all([
      User.aggregate([
        { $group: { _id: '$subscription.plan', count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $group: { _id: '$subscription.status', count: { $sum: 1 } } },
      ]),
      User.find({ 'subscription.plan': { $in: ['pro', 'enterprise'] } })
        .sort({ 'subscription.startDate': -1 })
        .limit(10)
        .select('name email subscription'),
    ]);

    // Get plans for pricing info
    const plans = await Plan.getActivePlans();
    const planPrices = {};
    plans.forEach(p => {
      planPrices[p.planId] = { inr: p.priceINR, usd: p.priceUSD };
    });

    // Calculate MRR (Monthly Recurring Revenue)
    let mrrINR = 0;
    let mrrUSD = 0;
    planDistribution.forEach(p => {
      if (p._id && planPrices[p._id]) {
        mrrINR += p.count * planPrices[p._id].inr;
        mrrUSD += p.count * planPrices[p._id].usd;
      }
    });

    const byPlan = {};
    planDistribution.forEach(p => {
      byPlan[p._id || 'free'] = p.count;
    });

    const byStatus = {};
    statusDistribution.forEach(s => {
      byStatus[s._id || 'active'] = s.count;
    });

    res.json({
      success: true,
      data: {
        distribution: {
          byPlan,
          byStatus,
        },
        revenue: {
          mrrINR,
          mrrUSD,
          arrINR: mrrINR * 12,
          arrUSD: mrrUSD * 12,
        },
        recentUpgrades,
      },
    });
  } catch (error) {
    console.error('Error fetching subscription analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription analytics',
    });
  }
});

export default router;
