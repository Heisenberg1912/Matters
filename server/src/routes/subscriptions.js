import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Plan from '../models/Plan.js';
import User from '../models/User.js';
import Project from '../models/Project.js';

const router = express.Router();

// Get all active plans
router.get('/plans', async (req, res) => {
  try {
    const plans = await Plan.getActivePlans();

    // Determine currency preference from query or accept-language header
    const currency = req.query.currency?.toUpperCase() || 'INR';

    const formattedPlans = plans.map(plan => ({
      id: plan.planId,
      name: plan.name,
      description: plan.description,
      price: currency === 'USD' ? plan.priceUSD : plan.priceINR,
      yearlyPrice: currency === 'USD' ? plan.yearlyPriceUSD : plan.yearlyPriceINR,
      currency,
      limits: plan.limits,
      features: plan.features,
      isPopular: plan.isPopular,
    }));

    res.json({
      success: true,
      data: formattedPlans,
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plans',
    });
  }
});

// Get current user's subscription
router.get('/current', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const plan = await Plan.getPlanById(user.subscription?.plan || 'free');

    // Calculate actual usage
    const projectCount = await Project.countDocuments({ owner: req.userId });

    // Get total storage used from uploads (simplified - you might want to aggregate from uploads collection)
    const storageUsed = user.usage?.storageUsed || 0;

    // Get total team members across all projects
    const projects = await Project.find({ owner: req.userId }).select('team');
    const teamMembersCount = projects.reduce((acc, proj) => acc + (proj.team?.length || 0), 0);

    // Update usage in user document
    user.usage = {
      projectCount,
      storageUsed,
      teamMembersCount,
    };
    await user.save();

    const currency = req.query.currency?.toUpperCase() || 'INR';

    res.json({
      success: true,
      data: {
        subscription: {
          plan: user.subscription?.plan || 'free',
          status: user.subscription?.status || 'active',
          startDate: user.subscription?.startDate,
          endDate: user.subscription?.endDate,
        },
        currentPlan: plan ? {
          id: plan.planId,
          name: plan.name,
          price: currency === 'USD' ? plan.priceUSD : plan.priceINR,
          currency,
          limits: plan.limits,
          features: plan.features,
        } : null,
        usage: {
          projects: {
            used: projectCount,
            limit: plan?.limits?.projects || 2,
            unlimited: plan?.limits?.projects === -1,
          },
          storage: {
            used: storageUsed,
            usedFormatted: formatBytes(storageUsed),
            limit: (plan?.limits?.storage || 1) * 1024 * 1024 * 1024, // Convert GB to bytes
            limitFormatted: plan?.limits?.storage === -1 ? 'Unlimited' : `${plan?.limits?.storage || 1} GB`,
            unlimited: plan?.limits?.storage === -1,
          },
          teamMembers: {
            used: teamMembersCount,
            limit: plan?.limits?.teamMembers || 3,
            unlimited: plan?.limits?.teamMembers === -1,
          },
          contractors: {
            used: 0, // TODO: Calculate actual contractor count
            limit: plan?.limits?.contractors || 1,
            unlimited: plan?.limits?.contractors === -1,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription',
    });
  }
});

// Get detailed usage stats
router.get('/usage', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const plan = await Plan.getPlanById(user.subscription?.plan || 'free');

    // Get project statistics
    const projects = await Project.find({ owner: req.userId });
    const projectStats = {
      total: projects.length,
      byStatus: {
        draft: projects.filter(p => p.status === 'draft').length,
        planning: projects.filter(p => p.status === 'planning').length,
        in_progress: projects.filter(p => p.status === 'in_progress').length,
        completed: projects.filter(p => p.status === 'completed').length,
        on_hold: projects.filter(p => p.status === 'on_hold').length,
        cancelled: projects.filter(p => p.status === 'cancelled').length,
      },
    };

    // Get storage breakdown (simplified)
    const storageStats = {
      total: user.usage?.storageUsed || 0,
      totalFormatted: formatBytes(user.usage?.storageUsed || 0),
    };

    // Get team statistics
    const teamStats = {
      total: projects.reduce((acc, proj) => acc + (proj.team?.length || 0), 0),
      byProject: projects.map(p => ({
        projectId: p._id,
        projectName: p.name,
        memberCount: p.team?.length || 0,
      })),
    };

    res.json({
      success: true,
      data: {
        plan: {
          id: plan?.planId || 'free',
          name: plan?.name || 'Free',
          limits: plan?.limits || { projects: 2, storage: 1, teamMembers: 3, contractors: 1 },
        },
        projects: projectStats,
        storage: storageStats,
        team: teamStats,
      },
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch usage stats',
    });
  }
});

// Seed plans endpoint (for initial setup - should be called once)
router.post('/seed-plans', authenticate, async (req, res) => {
  try {
    // Only allow superadmin to seed plans
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Only superadmin can seed plans',
      });
    }

    await Plan.seedDefaultPlans();

    res.json({
      success: true,
      message: 'Plans seeded successfully',
    });
  } catch (error) {
    console.error('Error seeding plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to seed plans',
    });
  }
});

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default router;
