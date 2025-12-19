import express from 'express';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/contractors
 * List contractors with optional search and specialty filters.
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, specialty, page = 1, limit = 20 } = req.query;

    const query = {
      role: 'contractor',
      isActive: true,
    };

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { name: regex },
        { email: regex },
        { 'company.name': regex },
      ];
    }

    if (specialty) {
      query.specializations = { $regex: new RegExp(specialty, 'i') };
    }

    const pageNumber = Math.max(1, parseInt(page, 10));
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNumber - 1) * limitNumber;

    const [contractors, total] = await Promise.all([
      User.find(query)
        .select('name email phone company specializations rating createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        contractors,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          pages: Math.ceil(total / limitNumber),
        },
      },
    });
  } catch (error) {
    console.error('Get contractors error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contractors.',
    });
  }
});

export default router;
