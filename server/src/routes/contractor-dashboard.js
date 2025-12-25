import express from 'express';
import { authenticate, isContractor, isContractorOrAdmin } from '../middleware/auth.js';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Project from '../models/Project.js';
import ProgressUpdate from '../models/ProgressUpdate.js';
import Bill from '../models/Bill.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/contractor/dashboard - Contractor dashboard summary
router.get('/dashboard', isContractor, async (req, res) => {
  try {
    const contractorId = req.userId;

    // Get contractor profile
    const contractor = await User.findById(contractorId)
      .select('name avatar email phone company specializations rating contractor');

    // Get job and project stats
    const [
      openJobsCount,
      pendingBidsCount,
      activeBidsCount,
      assignedJobsCount,
      completedJobsCount,
      assignedProjects,
      recentUpdates,
      earningsThisMonth,
    ] = await Promise.all([
      // Jobs available to bid
      Job.countDocuments({ status: 'open' }),

      // Pending bids by this contractor
      Job.countDocuments({
        'bids.contractor': contractorId,
        'bids.status': 'pending',
      }),

      // Bids that got accepted
      Job.countDocuments({
        assignedContractor: contractorId,
        status: { $in: ['assigned', 'in_progress'] },
      }),

      // Jobs assigned to contractor
      Job.countDocuments({
        assignedContractor: contractorId,
        status: { $in: ['assigned', 'in_progress'] },
      }),

      // Completed jobs
      Job.countDocuments({
        assignedContractor: contractorId,
        status: 'completed',
      }),

      // Projects assigned to contractor
      Project.find({ contractor: contractorId })
        .select('name status budget progress timeline location')
        .limit(5),

      // Recent progress updates
      ProgressUpdate.find({ contractor: contractorId })
        .populate('project', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title type createdAt project'),

      // Earnings this month
      Job.aggregate([
        {
          $match: {
            assignedContractor: contractorId,
            status: 'completed',
            completedAt: {
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        },
        {
          $lookup: {
            from: 'jobs',
            localField: 'acceptedBid',
            foreignField: 'bids._id',
            as: 'bidInfo',
          },
        },
        {
          $unwind: { path: '$bids', preserveNullAndEmptyArrays: true },
        },
        {
          $match: {
            'bids.contractor': contractorId,
            'bids.status': 'accepted',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$bids.amount' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const monthlyEarnings = earningsThisMonth[0]?.total || 0;

    res.json({
      success: true,
      data: {
        profile: {
          name: contractor.name,
          avatar: contractor.avatar,
          company: contractor.company,
          specializations: contractor.specializations,
          rating: contractor.rating,
          isVerified: contractor.contractor?.isVerified || false,
          availabilityStatus: contractor.contractor?.availabilityStatus || 'available',
          yearsExperience: contractor.contractor?.yearsExperience,
        },
        stats: {
          openJobs: openJobsCount,
          pendingBids: pendingBidsCount,
          activeJobs: assignedJobsCount,
          completedJobs: completedJobsCount,
          totalEarnings: contractor.contractor?.totalEarnings || 0,
          monthlyEarnings,
        },
        recentProjects: assignedProjects,
        recentUpdates,
      },
    });
  } catch (error) {
    console.error('Error fetching contractor dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
    });
  }
});

// GET /api/contractor/projects - Contractor's assigned projects
router.get('/projects', isContractor, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { contractor: req.userId };
    if (status) query.status = status;

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('owner', 'name avatar email phone')
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
    console.error('Error fetching contractor projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects',
    });
  }
});

// GET /api/contractor/earnings - Contractor's earnings summary
router.get('/earnings', isContractor, async (req, res) => {
  try {
    const contractorId = req.userId;
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    // Get completed jobs with earnings
    const completedJobs = await Job.find({
      assignedContractor: contractorId,
      status: 'completed',
      completedAt: {
        $gte: new Date(targetYear, 0, 1),
        $lt: new Date(targetYear + 1, 0, 1),
      },
    })
      .populate('project', 'name')
      .populate('postedBy', 'name')
      .select('title completedAt bids acceptedBid project postedBy');

    // Calculate earnings by month
    const monthlyEarnings = Array(12).fill(0);
    const earningsHistory = [];

    completedJobs.forEach(job => {
      const acceptedBid = job.bids.find(b => b._id.toString() === job.acceptedBid?.toString());
      if (acceptedBid && job.completedAt) {
        const month = new Date(job.completedAt).getMonth();
        monthlyEarnings[month] += acceptedBid.amount;

        earningsHistory.push({
          jobId: job._id,
          jobTitle: job.title,
          project: job.project,
          customer: job.postedBy,
          amount: acceptedBid.amount,
          completedAt: job.completedAt,
        });
      }
    });

    const totalEarnings = monthlyEarnings.reduce((sum, val) => sum + val, 0);

    // Get contractor's total earnings from profile
    const contractor = await User.findById(contractorId).select('contractor.totalEarnings');

    res.json({
      success: true,
      data: {
        year: targetYear,
        totalEarnings,
        allTimeEarnings: contractor.contractor?.totalEarnings || 0,
        monthlyBreakdown: monthlyEarnings.map((amount, index) => ({
          month: new Date(targetYear, index).toLocaleString('default', { month: 'short' }),
          amount,
        })),
        recentPayments: earningsHistory.slice(0, 10),
        jobsCompleted: completedJobs.length,
      },
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch earnings data',
    });
  }
});

// GET /api/contractor/schedule - Contractor's schedule
router.get('/schedule', isContractor, async (req, res) => {
  try {
    const contractorId = req.userId;

    // Get active jobs with timelines
    const activeJobs = await Job.find({
      assignedContractor: contractorId,
      status: { $in: ['assigned', 'in_progress'] },
    })
      .populate('project', 'name location timeline')
      .select('title timeline status project assignedAt');

    // Get projects with stages
    const projects = await Project.find({ contractor: contractorId, status: { $in: ['planning', 'in_progress'] } })
      .populate('stages')
      .select('name timeline stages status');

    // Format schedule items
    const scheduleItems = [];

    activeJobs.forEach(job => {
      if (job.timeline?.startDate) {
        scheduleItems.push({
          type: 'job',
          id: job._id,
          title: job.title,
          startDate: job.timeline.startDate,
          endDate: job.timeline.endDate,
          status: job.status,
          project: job.project,
        });
      }
    });

    projects.forEach(project => {
      if (project.timeline?.startDate) {
        scheduleItems.push({
          type: 'project',
          id: project._id,
          title: project.name,
          startDate: project.timeline.startDate,
          endDate: project.timeline.expectedEndDate,
          status: project.status,
        });
      }
    });

    // Sort by start date
    scheduleItems.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    res.json({
      success: true,
      data: {
        items: scheduleItems,
        activeJobsCount: activeJobs.length,
        activeProjectsCount: projects.length,
      },
    });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schedule',
    });
  }
});

// PATCH /api/contractor/availability - Update availability status
router.patch('/availability', isContractor, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['available', 'busy', 'on_leave'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid availability status',
      });
    }

    const contractor = await User.findByIdAndUpdate(
      req.userId,
      { 'contractor.availabilityStatus': status },
      { new: true }
    ).select('contractor.availabilityStatus');

    res.json({
      success: true,
      data: { availabilityStatus: contractor.contractor.availabilityStatus },
      message: 'Availability status updated',
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update availability',
    });
  }
});

// GET /api/contractor/profile - Get contractor's own profile
router.get('/profile', isContractor, async (req, res) => {
  try {
    const contractor = await User.findById(req.userId)
      .select('-password -refreshTokens -passwordResetToken -verificationToken');

    res.json({
      success: true,
      data: contractor,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
    });
  }
});

// PATCH /api/contractor/profile - Update contractor profile
router.patch('/profile', isContractor, async (req, res) => {
  try {
    const {
      name,
      phone,
      company,
      specializations,
      bio,
      yearsExperience,
      hourlyRate,
      dailyRate,
      serviceAreas,
      portfolioImages,
    } = req.body;

    const updates = {};

    if (name) updates.name = name;
    if (phone) updates.phone = phone;

    if (company) {
      if (company.name) updates['company.name'] = company.name;
      if (company.address) updates['company.address'] = company.address;
      if (company.license) updates['company.license'] = company.license;
      if (company.gstin) updates['company.gstin'] = company.gstin;
      if (company.website) updates['company.website'] = company.website;
    }

    if (specializations) updates.specializations = specializations;

    if (bio !== undefined) updates['contractor.bio'] = bio;
    if (yearsExperience !== undefined) updates['contractor.yearsExperience'] = yearsExperience;
    if (hourlyRate !== undefined) updates['contractor.hourlyRate'] = hourlyRate;
    if (dailyRate !== undefined) updates['contractor.dailyRate'] = dailyRate;
    if (serviceAreas) updates['contractor.serviceAreas'] = serviceAreas;
    if (portfolioImages) updates['contractor.portfolioImages'] = portfolioImages;

    const contractor = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -refreshTokens -passwordResetToken -verificationToken');

    res.json({
      success: true,
      data: contractor,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
    });
  }
});

// GET /api/contractor/reviews - Get contractor's reviews
router.get('/reviews', isContractor, async (req, res) => {
  try {
    // For now, return empty reviews since we don't have a reviews model yet
    // In a full implementation, you'd have a Reviews model

    const contractor = await User.findById(req.userId).select('rating');

    res.json({
      success: true,
      data: {
        rating: contractor.rating,
        reviews: [],
        message: 'Reviews feature coming soon',
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reviews',
    });
  }
});

// POST /api/contractor/documents - Upload verification document
router.post('/documents', isContractor, async (req, res) => {
  try {
    const { type, name, url } = req.body;

    if (!type || !name || !url) {
      return res.status(400).json({
        success: false,
        error: 'Document type, name, and URL are required',
      });
    }

    const validTypes = ['license', 'insurance', 'certification', 'id_proof', 'other'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid document type',
      });
    }

    const contractor = await User.findByIdAndUpdate(
      req.userId,
      {
        $push: {
          'contractor.documents': { type, name, url },
        },
      },
      { new: true }
    ).select('contractor.documents');

    res.status(201).json({
      success: true,
      data: contractor.contractor.documents,
      message: 'Document uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload document',
    });
  }
});

// GET /api/contractor/stats - Get detailed contractor stats
router.get('/stats', isContractor, async (req, res) => {
  try {
    const contractorId = req.userId;

    const [
      totalBids,
      acceptedBids,
      rejectedBids,
      totalJobs,
      completedJobs,
      inProgressJobs,
      totalProjects,
      totalUpdates,
    ] = await Promise.all([
      Job.countDocuments({ 'bids.contractor': contractorId }),
      Job.countDocuments({ assignedContractor: contractorId }),
      Job.countDocuments({
        'bids.contractor': contractorId,
        'bids.status': 'rejected',
      }),
      Job.countDocuments({ assignedContractor: contractorId }),
      Job.countDocuments({ assignedContractor: contractorId, status: 'completed' }),
      Job.countDocuments({ assignedContractor: contractorId, status: 'in_progress' }),
      Project.countDocuments({ contractor: contractorId }),
      ProgressUpdate.countDocuments({ contractor: contractorId }),
    ]);

    const acceptanceRate = totalBids > 0 ? Math.round((acceptedBids / totalBids) * 100) : 0;
    const completionRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;

    res.json({
      success: true,
      data: {
        bids: {
          total: totalBids,
          accepted: acceptedBids,
          rejected: rejectedBids,
          acceptanceRate,
        },
        jobs: {
          total: totalJobs,
          completed: completedJobs,
          inProgress: inProgressJobs,
          completionRate,
        },
        projects: totalProjects,
        progressUpdates: totalUpdates,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
    });
  }
});

export default router;
