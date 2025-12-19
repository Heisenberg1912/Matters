import mongoose from 'mongoose';

const billSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
    },
    stage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stage',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Bill title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    type: {
      type: String,
      enum: ['material', 'labor', 'equipment', 'service', 'permit', 'misc', 'other'],
      default: 'material',
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
        'carpentry',
        'glass',
        'labour',
        'transport',
        'equipment_rental',
        'professional_fees',
        'permits',
        'utilities',
        'other',
      ],
      default: 'other',
    },
    vendor: {
      name: String,
      contact: String,
      email: String,
      address: String,
      gstin: String,
    },
    items: [{
      description: { type: String, required: true },
      quantity: { type: Number, required: true, min: 0 },
      unit: { type: String, default: 'units' },
      unitPrice: { type: Number, required: true, min: 0 },
      totalPrice: { type: Number, required: true, min: 0 },
      hsn: String,
      gst: { type: Number, default: 0 },
    }],
    amount: {
      subtotal: { type: Number, required: true, min: 0 },
      tax: { type: Number, default: 0, min: 0 },
      discount: { type: Number, default: 0, min: 0 },
      total: { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'INR' },
    },
    payment: {
      status: {
        type: String,
        enum: ['pending', 'partial', 'paid', 'overdue', 'cancelled'],
        default: 'pending',
      },
      method: {
        type: String,
        enum: ['cash', 'upi', 'bank_transfer', 'cheque', 'card', 'other'],
      },
      paidAmount: { type: Number, default: 0 },
      paidAt: Date,
      dueDate: Date,
      transactions: [{
        amount: Number,
        method: String,
        reference: String,
        date: { type: Date, default: Date.now },
        notes: String,
      }],
    },
    billNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    invoiceNumber: String,
    billDate: {
      type: Date,
      default: Date.now,
    },
    attachments: [{
      name: String,
      url: String,
      type: String,
      uploadedAt: { type: Date, default: Date.now },
    }],
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected', 'cancelled'],
      default: 'submitted',
    },
    approval: {
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvedAt: Date,
      rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rejectedAt: Date,
      comments: String,
    },
    tags: [String],
    notes: String,
    isRecurring: { type: Boolean, default: false },
    recurringInterval: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
billSchema.index({ project: 1 });
billSchema.index({ stage: 1 });
billSchema.index({ createdBy: 1 });
billSchema.index({ 'payment.status': 1 });
billSchema.index({ billDate: -1 });
billSchema.index({ type: 1, category: 1 });

// Virtual for pending amount
billSchema.virtual('pendingAmount').get(function () {
  return this.amount.total - (this.payment.paidAmount || 0);
});

// Virtual for payment progress
billSchema.virtual('paymentProgress').get(function () {
  if (this.amount.total === 0) return 100;
  return Math.round((this.payment.paidAmount / this.amount.total) * 100);
});

// Pre-save hook to generate bill number
billSchema.pre('save', async function (next) {
  if (!this.billNumber && this.isNew) {
    const count = await mongoose.model('Bill').countDocuments();
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    this.billNumber = `BILL-${year}${month}-${(count + 1).toString().padStart(5, '0')}`;
  }

  // Calculate totals from items
  if (this.items && this.items.length > 0) {
    let subtotal = 0;
    let totalTax = 0;

    this.items.forEach((item) => {
      item.totalPrice = item.quantity * item.unitPrice;
      subtotal += item.totalPrice;
      if (item.gst) {
        totalTax += (item.totalPrice * item.gst) / 100;
      }
    });

    this.amount.subtotal = subtotal;
    this.amount.tax = totalTax;
    this.amount.total = subtotal + totalTax - (this.amount.discount || 0);
  }

  // Update payment status based on paid amount
  if (this.payment.paidAmount >= this.amount.total) {
    this.payment.status = 'paid';
    if (!this.payment.paidAt) {
      this.payment.paidAt = new Date();
    }
  } else if (this.payment.paidAmount > 0) {
    this.payment.status = 'partial';
  } else if (this.payment.dueDate && new Date() > this.payment.dueDate) {
    this.payment.status = 'overdue';
  }

  next();
});

// Method to add payment
billSchema.methods.addPayment = function (amount, method, reference, notes) {
  this.payment.transactions.push({
    amount,
    method,
    reference,
    notes,
  });
  this.payment.paidAmount += amount;
  this.payment.method = method;
  return this.save();
};

// Method to approve bill
billSchema.methods.approve = function (userId, comments) {
  this.status = 'approved';
  this.approval.approvedBy = userId;
  this.approval.approvedAt = new Date();
  this.approval.comments = comments;
  return this.save();
};

// Method to reject bill
billSchema.methods.reject = function (userId, comments) {
  this.status = 'rejected';
  this.approval.rejectedBy = userId;
  this.approval.rejectedAt = new Date();
  this.approval.comments = comments;
  return this.save();
};

// Static method to get bills by project
billSchema.statics.findByProject = function (projectId, options = {}) {
  const query = { project: projectId };

  if (options.status) {
    query['payment.status'] = options.status;
  }
  if (options.type) {
    query.type = options.type;
  }

  return this.find(query).sort({ billDate: -1 });
};

// Static method to get summary by project
billSchema.statics.getSummaryByProject = async function (projectId) {
  const result = await this.aggregate([
    { $match: { project: new mongoose.Types.ObjectId(projectId) } },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount.total' },
        paidAmount: { $sum: '$payment.paidAmount' },
        count: { $sum: 1 },
        byType: {
          $push: {
            type: '$type',
            amount: '$amount.total',
          },
        },
      },
    },
  ]);

  return result[0] || { totalAmount: 0, paidAmount: 0, count: 0, byType: [] };
};

const Bill = mongoose.model('Bill', billSchema);

export default Bill;
