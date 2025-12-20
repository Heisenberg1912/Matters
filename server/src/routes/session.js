import express from 'express';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /api/session - return current (guest) user
router.get('/', authenticate, async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user.toJSON() },
  });
});

// PATCH /api/session - update guest profile fields
router.patch('/', authenticate, async (req, res) => {
  try {
    const allowedFields = ['name', 'phone', 'avatar', 'preferences', 'company', 'specializations'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: { user: user.toJSON() },
    });
  } catch (error) {
    console.error('Update session user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update session user.',
    });
  }
});

export default router;
