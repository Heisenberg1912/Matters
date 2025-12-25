import express from 'express';
import { authenticate, isAdmin, isSuperAdmin } from '../middleware/auth.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Plan from '../models/Plan.js';
import SupportTicket from '../models/SupportTicket.js';
import Job from '../models/Job.js';
import Bill from '../models/Bill.js';
import ProgressUpdate from '../models/ProgressUpdate.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate, isAdmin);

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

// GET /api/admin/analytics - Comprehensive analytics
router.get('/analytics', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    // User growth over time
    const userGrowth = await User.aggregate([
      {
        $match: { createdAt: { $gte: daysAgo } }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          contractors: {
            $sum: { $cond: [{ $eq: ['$role', 'contractor'] }, 1, 0] }
          },
          customers: {
            $sum: { $cond: [{ $eq: ['$role', 'user'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Jobs by status
    const jobsByStatus = await Job.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Jobs created over time
    const jobsOverTime = await Job.aggregate([
      {
        $match: { createdAt: { $gte: daysAgo } }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Bid statistics
    const bidStats = await Job.aggregate([
      { $unwind: '$bids' },
      {
        $group: {
          _id: '$bids.status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalBids = bidStats.reduce((sum, stat) => sum + stat.count, 0);
    const acceptedBids = bidStats.find(s => s._id === 'accepted')?.count || 0;
    const acceptanceRate = totalBids > 0 ? ((acceptedBids / totalBids) * 100).toFixed(2) : 0;

    // Revenue trends (from completed jobs)
    const revenueByMonth = await Job.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $exists: true, $gte: daysAgo }
        }
      },
      { $unwind: '$bids' },
      {
        $match: {
          'bids.status': 'accepted'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$completedAt' }
          },
          totalRevenue: { $sum: '$bids.amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top contractors
    const topContractors = await Job.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: '$assignedContractor',
          completedJobs: { $sum: 1 }
        }
      },
      { $sort: { completedJobs: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'contractor'
        }
      },
      { $unwind: '$contractor' },
      {
        $project: {
          _id: 1,
          completedJobs: 1,
          name: '$contractor.name',
          email: '$contractor.email',
          rating: '$contractor.rating.average'
        }
      }
    ]);

    // Projects by type
    const projectsByType = await Project.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    // Projects by status
    const projectsByStatus = await Project.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Progress updates over time
    const progressUpdates = await ProgressUpdate.aggregate([
      {
        $match: { createdAt: { $gte: daysAgo } }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Geographic distribution (top cities)
    const projectsByCity = await Project.aggregate([
      {
        $match: { 'location.city': { $exists: true, $ne: null } }
      },
      {
        $group: {
          _id: '$location.city',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Active users (users who logged in within last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsersCount = await User.countDocuments({
      lastLogin: { $gte: sevenDaysAgo }
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers: await User.countDocuments(),
          activeUsers: activeUsersCount,
          totalProjects: await Project.countDocuments(),
          totalJobs: await Job.countDocuments(),
          completedJobs: await Job.countDocuments({ status: 'completed' }),
          acceptanceRate,
        },
        userGrowth,
        jobsByStatus: jobsByStatus.reduce((obj, item) => {
          obj[item._id] = item.count;
          return obj;
        }, {}),
        jobsOverTime,
        bidStats: bidStats.reduce((obj, item) => {
          obj[item._id] = item.count;
          return obj;
        }, {}),
        revenueByMonth,
        topContractors,
        projectsByType: projectsByType.reduce((obj, item) => {
          obj[item._id || 'other'] = item.count;
          return obj;
        }, {}),
        projectsByStatus: projectsByStatus.reduce((obj, item) => {
          obj[item._id] = item.count;
          return obj;
        }, {}),
        progressUpdates,
        projectsByCity,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
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

// Get admin dashboard summary
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    const [
      totalUsers,
      newUsersThisMonth,
      totalProjects,
      activeProjects,
      totalJobs,
      openJobs,
      pendingTickets,
      totalContractors,
      verifiedContractors,
      revenueStats,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: thisMonth } }),
      Project.countDocuments(),
      Project.countDocuments({ status: { $in: ['planning', 'in_progress'] } }),
      Job.countDocuments(),
      Job.countDocuments({ status: 'open' }),
      SupportTicket.countDocuments({ status: 'pending' }),
      User.countDocuments({ role: 'contractor' }),
      User.countDocuments({ role: 'contractor', 'contractor.isVerified': true }),
      Bill.aggregate([
        { $match: { createdAt: { $gte: lastMonth } } },
        {
          $group: {
            _id: null,
            totalBilled: { $sum: '$amount.total' },
            totalPaid: { $sum: '$payment.paidAmount' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Recent activity
    const [recentUsers, recentProjects, recentTickets] = await Promise.all([
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email role createdAt'),
      Project.find()
        .populate('owner', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name status owner createdAt'),
      SupportTicket.find()
        .populate('user', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('ticketNumber subject status priority user createdAt'),
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          users: { total: totalUsers, newThisMonth: newUsersThisMonth },
          projects: { total: totalProjects, active: activeProjects },
          jobs: { total: totalJobs, open: openJobs },
          tickets: { pending: pendingTickets },
          contractors: { total: totalContractors, verified: verifiedContractors },
        },
        revenue: revenueStats[0] || { totalBilled: 0, totalPaid: 0, count: 0 },
        recentActivity: {
          users: recentUsers,
          projects: recentProjects,
          tickets: recentTickets,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
    });
  }
});

// Get all contractors
router.get('/contractors', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      verified,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = { role: 'contractor' };

    if (verified === 'true') {
      query['contractor.isVerified'] = true;
    } else if (verified === 'false') {
      query['contractor.isVerified'] = { $ne: true };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'company.name': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [contractors, total] = await Promise.all([
      User.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-password -refreshTokens'),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        contractors,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching contractors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contractors',
    });
  }
});

// Verify contractor
router.patch('/contractors/:id/verify', async (req, res) => {
  try {
    const { verified, notes } = req.body;

    const contractor = await User.findOne({
      _id: req.params.id,
      role: 'contractor',
    });

    if (!contractor) {
      return res.status(404).json({
        success: false,
        error: 'Contractor not found',
      });
    }

    if (verified) {
      contractor.contractor.isVerified = true;
      contractor.contractor.verifiedAt = new Date();
      contractor.contractor.verifiedBy = req.userId;
    } else {
      contractor.contractor.isVerified = false;
      contractor.contractor.verifiedAt = null;
      contractor.contractor.verifiedBy = null;
    }

    await contractor.save();

    res.json({
      success: true,
      data: {
        id: contractor._id,
        isVerified: contractor.contractor.isVerified,
        verifiedAt: contractor.contractor.verifiedAt,
      },
      message: verified ? 'Contractor verified successfully' : 'Contractor verification removed',
    });
  } catch (error) {
    console.error('Error verifying contractor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify contractor',
    });
  }
});

// Get all support tickets
router.get('/tickets', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .populate('user', 'name email')
        .populate('project', 'name')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      SupportTicket.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tickets',
    });
  }
});

// Get single ticket
router.get('/tickets/:id', async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('user', 'name email avatar phone')
      .populate('project', 'name status')
      .populate('attachments');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found',
      });
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ticket',
    });
  }
});

// Update ticket status
router.patch('/tickets/:id', async (req, res) => {
  try {
    const { status, priority } = req.body;
    const updates = {};

    if (status && ['pending', 'in_progress', 'resolved'].includes(status)) {
      updates.status = status;
      if (status === 'resolved') {
        updates.resolvedAt = new Date();
      }
    }

    if (priority && ['low', 'medium', 'high'].includes(priority)) {
      updates.priority = priority;
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    ).populate('user', 'name email');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found',
      });
    }

    res.json({
      success: true,
      data: ticket,
      message: 'Ticket updated successfully',
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update ticket',
    });
  }
});

// Get system analytics
router.get('/analytics', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const daysBack = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // User growth over time
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Projects by status
    const projectsByStatus = await Project.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Projects by type
    const projectsByType = await Project.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    // Jobs by status
    const jobsByStatus = await Job.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Revenue by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const revenueByMonth = await Bill.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          totalBilled: { $sum: '$amount.total' },
          totalPaid: { $sum: '$payment.paidAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // User distribution by role
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    // Top cities by projects
    const topCities = await Project.aggregate([
      { $match: { 'location.city': { $exists: true, $ne: '' } } },
      { $group: { _id: '$location.city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      data: {
        userGrowth,
        projectsByStatus: Object.fromEntries(
          projectsByStatus.map(p => [p._id || 'unknown', p.count])
        ),
        projectsByType: Object.fromEntries(
          projectsByType.map(p => [p._id || 'other', p.count])
        ),
        jobsByStatus: Object.fromEntries(
          jobsByStatus.map(j => [j._id || 'unknown', j.count])
        ),
        revenueByMonth,
        usersByRole: Object.fromEntries(
          usersByRole.map(u => [u._id || 'user', u.count])
        ),
        topCities,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
    });
  }
});

// Get all jobs (admin view)
router.get('/jobs', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('postedBy', 'name email')
        .populate('project', 'name')
        .populate('assignedContractor', 'name company')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-bids'),
      Job.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs',
    });
  }
});

export default router;
