import express from 'express';
import { authenticate, authorize, isContractor, isCustomerOrAdmin, isAdmin } from '../middleware/auth.js';
import Job from '../models/Job.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { triggerUserEvent } from '../utils/realtime.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/jobs - List jobs (different results based on role)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      city,
      specialization,
      budgetMin,
      budgetMax,
      workType,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    let query = {};
    let jobs, total;

    // Role-based filtering
    if (req.user.role === 'contractor') {
      // Contractors see open jobs they haven't bid on yet (or all their bids)
      query.status = status || 'open';
    } else if (req.user.role === 'user') {
      // Customers see their own posted jobs
      query.postedBy = req.userId;
      if (status) query.status = status;
    } else {
      // Admins see all jobs
      if (status) query.status = status;
    }

    // Common filters
    if (city) {
      query['location.city'] = { $regex: city, $options: 'i' };
    }
    if (specialization) {
      query.requiredSpecializations = { $in: [specialization] };
    }
    if (budgetMin) {
      query['budget.max'] = { $gte: parseInt(budgetMin) };
    }
    if (budgetMax) {
      query['budget.min'] = { $lte: parseInt(budgetMax) };
    }
    if (workType) {
      query.workType = workType;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('postedBy', 'name avatar')
        .populate('project', 'name type location')
        .populate('assignedContractor', 'name avatar rating company')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
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

// GET /api/jobs/my-postings - Customer's posted jobs
router.get('/my-postings', isCustomerOrAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { postedBy: req.userId };
    if (status) query.status = status;

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('project', 'name type')
        .populate('assignedContractor', 'name avatar rating company')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Job.countDocuments(query),
    ]);

    // Add bid summary
    const jobsWithSummary = jobs.map(job => {
      const jobObj = job.toObject();
      jobObj.bidsSummary = {
        total: job.bids.length,
        pending: job.bids.filter(b => b.status === 'pending').length,
        accepted: job.bids.filter(b => b.status === 'accepted').length,
        rejected: job.bids.filter(b => b.status === 'rejected').length,
      };
      return jobObj;
    });

    res.json({
      success: true,
      data: {
        jobs: jobsWithSummary,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching my postings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch your job postings',
    });
  }
});

// GET /api/jobs/my-bids - Contractor's submitted bids
router.get('/my-bids', isContractor, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { 'bids.contractor': req.userId };

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('postedBy', 'name avatar')
        .populate('project', 'name type location')
        .sort({ 'bids.submittedAt': -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Job.countDocuments(query),
    ]);

    // Extract only the contractor's bid from each job
    const bidsWithJobs = jobs.map(job => {
      const myBid = job.bids.find(b => b.contractor.toString() === req.userId.toString());
      return {
        job: {
          _id: job._id,
          title: job.title,
          description: job.description,
          budget: job.budget,
          status: job.status,
          workType: job.workType,
          location: job.location,
          postedBy: job.postedBy,
          project: job.project,
          createdAt: job.createdAt,
        },
        bid: myBid,
      };
    }).filter(item => {
      if (status) {
        return item.bid?.status === status;
      }
      return true;
    });

    res.json({
      success: true,
      data: {
        bids: bidsWithJobs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching my bids:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch your bids',
    });
  }
});

// GET /api/jobs/assigned - Contractor's assigned jobs
router.get('/assigned', isContractor, async (req, res) => {
  try {
    const jobs = await Job.findAssigned(req.userId);

    res.json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    console.error('Error fetching assigned jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assigned jobs',
    });
  }
});

// GET /api/jobs/:id - Get single job details
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'name avatar email phone')
      .populate('project', 'name type location budget timeline description')
      .populate('assignedContractor', 'name avatar rating company specializations contractor')
      .populate('bids.contractor', 'name avatar rating company specializations contractor');

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    // Increment view count for contractors viewing open jobs
    if (req.user.role === 'contractor' && job.status === 'open') {
      job.viewCount += 1;
      await job.save();
    }

    // Filter bids visibility based on role
    const jobObj = job.toObject();
    if (req.user.role === 'contractor') {
      // Contractors can only see their own bids
      jobObj.bids = jobObj.bids.filter(
        b => b.contractor._id.toString() === req.userId.toString()
      );
    }

    res.json({
      success: true,
      data: jobObj,
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job details',
    });
  }
});

// POST /api/jobs - Create a new job (customers only)
router.post('/', isCustomerOrAdmin, async (req, res) => {
  try {
    const {
      projectId,
      title,
      description,
      budget,
      requiredSpecializations,
      location,
      timeline,
      workType,
      requirements,
    } = req.body;

    // Verify project belongs to user
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    if (project.owner.toString() !== req.userId.toString() && !['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'You can only create jobs for your own projects',
      });
    }

    const job = await Job.create({
      project: projectId,
      postedBy: req.userId,
      title,
      description,
      budget,
      requiredSpecializations,
      location: location || {
        address: project.location?.address,
        city: project.location?.city,
        state: project.location?.state,
        pincode: project.location?.pincode,
      },
      timeline,
      workType,
      requirements,
      status: 'open',
    });

    await job.populate('project', 'name type');

    res.status(201).json({
      success: true,
      data: job,
      message: 'Job posted successfully',
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create job',
    });
  }
});

// PATCH /api/jobs/:id - Update job (owner only)
router.patch('/:id', isCustomerOrAdmin, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    // Check ownership
    if (job.postedBy.toString() !== req.userId.toString() && !['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own jobs',
      });
    }

    // Don't allow updates to assigned/completed jobs
    if (['assigned', 'in_progress', 'completed'].includes(job.status)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot update a job that has been assigned or completed',
      });
    }

    const allowedUpdates = [
      'title', 'description', 'budget', 'requiredSpecializations',
      'location', 'timeline', 'workType', 'requirements', 'status',
    ];

    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('project', 'name type');

    res.json({
      success: true,
      data: updatedJob,
      message: 'Job updated successfully',
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update job',
    });
  }
});

// DELETE /api/jobs/:id - Cancel job (owner only)
router.delete('/:id', isCustomerOrAdmin, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    // Check ownership
    if (job.postedBy.toString() !== req.userId.toString() && !['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'You can only cancel your own jobs',
      });
    }

    // Don't allow deletion of in-progress/completed jobs
    if (['in_progress', 'completed'].includes(job.status)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel a job that is in progress or completed',
      });
    }

    job.status = 'cancelled';
    job.cancellationReason = req.body.reason || 'Cancelled by owner';
    await job.save();

    res.json({
      success: true,
      message: 'Job cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel job',
    });
  }
});

// POST /api/jobs/:id/bid - Submit a bid (contractors only)
router.post('/:id/bid', isContractor, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    const { amount, proposal, estimatedDuration } = req.body;

    if (!amount || !proposal) {
      return res.status(400).json({
        success: false,
        error: 'Amount and proposal are required',
      });
    }

    await job.submitBid(req.userId, {
      amount,
      proposal,
      estimatedDuration,
    });

    await job.populate('postedBy', 'name avatar');

    // Send notification to job poster
    try {
      await triggerUserEvent(job.postedBy._id.toString(), 'bid-submitted', {
        jobId: job._id,
        jobTitle: job.title,
        contractor: {
          id: req.userId,
          name: req.user.name,
          avatar: req.user.avatar,
        },
        amount,
        proposal: proposal.substring(0, 100),
      });
    } catch (notifError) {
      console.error('Failed to send notification:', notifError);
    }

    res.status(201).json({
      success: true,
      message: 'Bid submitted successfully',
      data: {
        jobId: job._id,
        bidCount: job.bids.length,
      },
    });
  } catch (error) {
    console.error('Error submitting bid:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to submit bid',
    });
  }
});

// PATCH /api/jobs/:id/bid/:bidId - Update bid (contractor - only pending bids)
router.patch('/:id/bid/:bidId', isContractor, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    const bid = job.bids.id(req.params.bidId);
    if (!bid) {
      return res.status(404).json({
        success: false,
        error: 'Bid not found',
      });
    }

    // Verify ownership
    if (bid.contractor.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own bids',
      });
    }

    // Only pending bids can be updated
    if (bid.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Only pending bids can be updated',
      });
    }

    const { amount, proposal, estimatedDuration } = req.body;
    if (amount) bid.amount = amount;
    if (proposal) bid.proposal = proposal;
    if (estimatedDuration) bid.estimatedDuration = estimatedDuration;

    await job.save();

    res.json({
      success: true,
      message: 'Bid updated successfully',
      data: bid,
    });
  } catch (error) {
    console.error('Error updating bid:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update bid',
    });
  }
});

// POST /api/jobs/:id/bid/:bidId/withdraw - Withdraw bid (contractor)
router.post('/:id/bid/:bidId/withdraw', isContractor, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    await job.withdrawBid(req.params.bidId, req.userId);

    res.json({
      success: true,
      message: 'Bid withdrawn successfully',
    });
  } catch (error) {
    console.error('Error withdrawing bid:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to withdraw bid',
    });
  }
});

// POST /api/jobs/:id/bid/:bidId/accept - Accept bid (customer only)
router.post('/:id/bid/:bidId/accept', isCustomerOrAdmin, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    // Check ownership
    if (job.postedBy.toString() !== req.userId.toString() && !['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'You can only accept bids on your own jobs',
      });
    }

    await job.acceptBid(req.params.bidId, req.body.note);

    // Update contractor's active projects count
    const bid = job.bids.id(req.params.bidId);
    await User.findByIdAndUpdate(bid.contractor, {
      $inc: { 'contractor.activeProjects': 1 },
    });

    // Assign contractor to project
    await Project.findByIdAndUpdate(job.project, {
      contractor: bid.contractor,
    });

    await job.populate('assignedContractor', 'name avatar email phone company');

    // Send notification to contractor
    const acceptedBid = job.bids.id(req.params.bidId);
    if (acceptedBid) {
      try {
        await triggerUserEvent(acceptedBid.contractor.toString(), 'bid-accepted', {
          jobId: job._id,
          jobTitle: job.title,
          amount: acceptedBid.amount,
          note: req.body.note,
        });
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }
    }

    res.json({
      success: true,
      message: 'Bid accepted successfully',
      data: {
        job: {
          _id: job._id,
          title: job.title,
          status: job.status,
          assignedContractor: job.assignedContractor,
        },
      },
    });
  } catch (error) {
    console.error('Error accepting bid:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to accept bid',
    });
  }
});

// POST /api/jobs/:id/bid/:bidId/reject - Reject bid (customer only)
router.post('/:id/bid/:bidId/reject', isCustomerOrAdmin, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    // Check ownership
    if (job.postedBy.toString() !== req.userId.toString() && !['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'You can only reject bids on your own jobs',
      });
    }

    await job.rejectBid(req.params.bidId, req.body.note);

    // Send notification to contractor
    const rejectedBid = job.bids.id(req.params.bidId);
    if (rejectedBid) {
      try {
        await triggerUserEvent(rejectedBid.contractor.toString(), 'bid-rejected', {
          jobId: job._id,
          jobTitle: job.title,
          note: req.body.note,
        });
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }
    }

    res.json({
      success: true,
      message: 'Bid rejected',
    });
  } catch (error) {
    console.error('Error rejecting bid:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to reject bid',
    });
  }
});

// GET /api/jobs/:id/bids - Get all bids for a job (owner only)
router.get('/:id/bids', isCustomerOrAdmin, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('bids.contractor', 'name avatar rating company specializations contractor');

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    // Check ownership
    if (job.postedBy.toString() !== req.userId.toString() && !['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'You can only view bids on your own jobs',
      });
    }

    res.json({
      success: true,
      data: {
        jobId: job._id,
        jobTitle: job.title,
        jobStatus: job.status,
        bids: job.bids,
        summary: {
          total: job.bids.length,
          pending: job.bids.filter(b => b.status === 'pending').length,
          accepted: job.bids.filter(b => b.status === 'accepted').length,
          rejected: job.bids.filter(b => b.status === 'rejected').length,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching bids:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bids',
    });
  }
});

// POST /api/jobs/:id/start - Start work on job (contractor)
router.post('/:id/start', isContractor, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    if (job.assignedContractor?.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You are not assigned to this job',
      });
    }

    if (job.status !== 'assigned') {
      return res.status(400).json({
        success: false,
        error: 'Job must be in assigned status to start',
      });
    }

    job.status = 'in_progress';
    await job.save();

    res.json({
      success: true,
      message: 'Job started',
      data: { status: job.status },
    });
  } catch (error) {
    console.error('Error starting job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start job',
    });
  }
});

// POST /api/jobs/:id/complete - Mark job as complete (contractor)
router.post('/:id/complete', isContractor, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    if (job.assignedContractor?.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You are not assigned to this job',
      });
    }

    if (job.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        error: 'Job must be in progress to complete',
      });
    }

    job.status = 'completed';
    job.completedAt = new Date();
    await job.save();

    // Update contractor stats
    const acceptedBid = job.bids.id(job.acceptedBid);
    await User.findByIdAndUpdate(req.userId, {
      $inc: {
        'contractor.activeProjects': -1,
        'contractor.completedProjects': 1,
        'contractor.totalEarnings': acceptedBid?.amount || 0,
      },
    });

    res.json({
      success: true,
      message: 'Job marked as complete',
      data: { status: job.status },
    });
  } catch (error) {
    console.error('Error completing job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete job',
    });
  }
});

export default router;
