import express from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth.js';
import Project from '../models/Project.js';

const router = express.Router();

// Inventory Item Schema (inline for now, could be moved to models)
const inventoryItemSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'cement',
        'steel',
        'sand',
        'bricks',
        'tiles',
        'paint',
        'electrical',
        'plumbing',
        'wood',
        'glass',
        'hardware',
        'tools',
        'safety',
        'other',
      ],
      default: 'other',
    },
    quantity: {
      current: { type: Number, default: 0, min: 0 },
      minimum: { type: Number, default: 0, min: 0 },
      ordered: { type: Number, default: 0, min: 0 },
    },
    unit: {
      type: String,
      default: 'units',
    },
    price: {
      perUnit: { type: Number, default: 0, min: 0 },
      currency: { type: String, default: 'INR' },
    },
    supplier: {
      name: String,
      contact: String,
      email: String,
    },
    location: {
      type: String,
      default: 'Main Storage',
    },
    status: {
      type: String,
      enum: ['in_stock', 'low_stock', 'out_of_stock', 'ordered'],
      default: 'in_stock',
    },
    lastRestocked: Date,
    notes: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Update status based on quantity
inventoryItemSchema.pre('save', function (next) {
  if (this.quantity.current <= 0) {
    this.status = 'out_of_stock';
  } else if (this.quantity.current <= this.quantity.minimum) {
    this.status = 'low_stock';
  } else if (this.quantity.ordered > 0) {
    this.status = 'ordered';
  } else {
    this.status = 'in_stock';
  }
  next();
});

const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);

/**
 * GET /api/inventory/project/:projectId
 * Get all inventory items for a project
 */
router.get('/project/:projectId', authenticate, async (req, res) => {
  try {
    const { category, status, search, page = 1, limit = 50 } = req.query;

    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found.',
      });
    }

    const query = { project: req.params.projectId };

    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [items, total] = await Promise.all([
      InventoryItem.find(query)
        .populate('createdBy', 'name email')
        .sort({ category: 1, name: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      InventoryItem.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory.',
    });
  }
});

/**
 * GET /api/inventory/project/:projectId/summary
 * Get inventory summary for a project
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

    const summary = await InventoryItem.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(req.params.projectId) } },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalValue: {
            $sum: { $multiply: ['$quantity.current', '$price.perUnit'] },
          },
          lowStockCount: {
            $sum: { $cond: [{ $eq: ['$status', 'low_stock'] }, 1, 0] },
          },
          outOfStockCount: {
            $sum: { $cond: [{ $eq: ['$status', 'out_of_stock'] }, 1, 0] },
          },
        },
      },
    ]);

    const byCategory = await InventoryItem.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(req.params.projectId) } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          value: { $sum: { $multiply: ['$quantity.current', '$price.perUnit'] } },
        },
      },
      { $sort: { value: -1 } },
    ]);

    const lowStockItems = await InventoryItem.find({
      project: req.params.projectId,
      $or: [{ status: 'low_stock' }, { status: 'out_of_stock' }],
    })
      .select('name category quantity status')
      .limit(10);

    res.json({
      success: true,
      data: {
        overview: summary[0] || {
          totalItems: 0,
          totalValue: 0,
          lowStockCount: 0,
          outOfStockCount: 0,
        },
        byCategory,
        lowStockItems,
      },
    });
  } catch (error) {
    console.error('Get inventory summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory summary.',
    });
  }
});

/**
 * GET /api/inventory/:id
 * Get single inventory item
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id)
      .populate('project', 'name')
      .populate('createdBy', 'name email');

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found.',
      });
    }

    res.json({
      success: true,
      data: { item },
    });
  } catch (error) {
    console.error('Get inventory item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory item.',
    });
  }
});

/**
 * POST /api/inventory
 * Create new inventory item
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      project: projectId,
      name,
      category,
      quantity,
      unit,
      price,
      supplier,
      location,
      notes,
    } = req.body;

    if (!projectId || !name) {
      return res.status(400).json({
        success: false,
        error: 'Project and name are required.',
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found.',
      });
    }

    const item = new InventoryItem({
      project: projectId,
      name,
      category,
      quantity,
      unit,
      price,
      supplier,
      location,
      notes,
      createdBy: req.userId,
      lastRestocked: quantity?.current > 0 ? new Date() : null,
    });

    await item.save();

    const populatedItem = await InventoryItem.findById(item._id).populate(
      'createdBy',
      'name email'
    );

    res.status(201).json({
      success: true,
      message: 'Inventory item created successfully.',
      data: { item: populatedItem },
    });
  } catch (error) {
    console.error('Create inventory item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create inventory item.',
    });
  }
});

/**
 * PATCH /api/inventory/:id
 * Update inventory item
 */
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found.',
      });
    }

    const allowedFields = [
      'name',
      'category',
      'quantity',
      'unit',
      'price',
      'supplier',
      'location',
      'notes',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Check if quantity is being increased (restock)
    if (
      updates.quantity?.current !== undefined &&
      updates.quantity.current > item.quantity.current
    ) {
      updates.lastRestocked = new Date();
    }

    const updatedItem = await InventoryItem.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Inventory item updated successfully.',
      data: { item: updatedItem },
    });
  } catch (error) {
    console.error('Update inventory item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update inventory item.',
    });
  }
});

/**
 * DELETE /api/inventory/:id
 * Delete inventory item
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found.',
      });
    }

    await item.deleteOne();

    res.json({
      success: true,
      message: 'Inventory item deleted successfully.',
    });
  } catch (error) {
    console.error('Delete inventory item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete inventory item.',
    });
  }
});

/**
 * POST /api/inventory/:id/adjust
 * Adjust inventory quantity
 */
router.post('/:id/adjust', authenticate, async (req, res) => {
  try {
    const { adjustment, reason } = req.body;

    if (adjustment === undefined || adjustment === 0) {
      return res.status(400).json({
        success: false,
        error: 'Adjustment amount is required.',
      });
    }

    const item = await InventoryItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found.',
      });
    }

    const newQuantity = item.quantity.current + adjustment;

    if (newQuantity < 0) {
      return res.status(400).json({
        success: false,
        error: 'Adjustment would result in negative quantity.',
      });
    }

    item.quantity.current = newQuantity;

    if (adjustment > 0) {
      item.lastRestocked = new Date();
    }

    if (reason) {
      item.notes = `${item.notes || ''}\n[${new Date().toISOString()}] Adjusted by ${adjustment}: ${reason}`.trim();
    }

    await item.save();

    res.json({
      success: true,
      message: `Quantity ${adjustment > 0 ? 'increased' : 'decreased'} successfully.`,
      data: { item },
    });
  } catch (error) {
    console.error('Adjust inventory error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to adjust inventory.',
    });
  }
});

/**
 * POST /api/inventory/bulk
 * Create multiple inventory items
 */
router.post('/bulk', authenticate, async (req, res) => {
  try {
    const { projectId, items } = req.body;

    if (!projectId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Project ID and items array are required.',
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found.',
      });
    }

    const inventoryItems = items.map((item) => ({
      ...item,
      project: projectId,
      createdBy: req.userId,
      lastRestocked: item.quantity?.current > 0 ? new Date() : null,
    }));

    const createdItems = await InventoryItem.insertMany(inventoryItems);

    res.status(201).json({
      success: true,
      message: `${createdItems.length} inventory items created successfully.`,
      data: { items: createdItems },
    });
  } catch (error) {
    console.error('Bulk create inventory error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create inventory items.',
    });
  }
});

export default router;
