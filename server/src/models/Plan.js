import mongoose from 'mongoose';

const planSchema = new mongoose.Schema(
  {
    planId: {
      type: String,
      required: true,
      unique: true,
      enum: ['free', 'pro', 'enterprise'],
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    priceINR: {
      type: Number,
      required: true,
      default: 0,
    },
    priceUSD: {
      type: Number,
      required: true,
      default: 0,
    },
    yearlyPriceINR: {
      type: Number,
      default: 0,
    },
    yearlyPriceUSD: {
      type: Number,
      default: 0,
    },
    limits: {
      projects: { type: Number, default: -1 }, // -1 = unlimited
      storage: { type: Number, default: -1 }, // in GB, -1 = unlimited
      teamMembers: { type: Number, default: -1 }, // per project
      contractors: { type: Number, default: -1 },
    },
    features: [{
      type: String,
      trim: true,
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
planSchema.index({ planId: 1 });
planSchema.index({ isActive: 1, sortOrder: 1 });

// Static method to get all active plans
planSchema.statics.getActivePlans = function () {
  return this.find({ isActive: true }).sort({ sortOrder: 1 });
};

// Static method to get plan by ID
planSchema.statics.getPlanById = function (planId) {
  return this.findOne({ planId, isActive: true });
};

// Static method to seed default plans
planSchema.statics.seedDefaultPlans = async function () {
  const defaultPlans = [
    {
      planId: 'free',
      name: 'Free',
      description: 'Perfect for getting started with small projects',
      priceINR: 0,
      priceUSD: 0,
      yearlyPriceINR: 0,
      yearlyPriceUSD: 0,
      limits: {
        projects: 2,
        storage: 1, // 1 GB
        teamMembers: 3,
        contractors: 1,
      },
      features: [
        'Up to 2 projects',
        '1 GB storage',
        '3 team members per project',
        'Basic analytics',
        'Email support',
      ],
      isActive: true,
      isPopular: false,
      sortOrder: 1,
    },
    {
      planId: 'pro',
      name: 'Professional',
      description: 'For growing teams and multiple projects',
      priceINR: 999,
      priceUSD: 12,
      yearlyPriceINR: 9990,
      yearlyPriceUSD: 120,
      limits: {
        projects: 10,
        storage: 25, // 25 GB
        teamMembers: 15,
        contractors: 5,
      },
      features: [
        'Up to 10 projects',
        '25 GB storage',
        '15 team members per project',
        'Advanced analytics & reports',
        'PDF/Excel exports',
        'Priority email support',
        'Client portal access',
      ],
      isActive: true,
      isPopular: true,
      sortOrder: 2,
    },
    {
      planId: 'enterprise',
      name: 'Enterprise',
      description: 'For large organizations with unlimited needs',
      priceINR: 2499,
      priceUSD: 30,
      yearlyPriceINR: 24990,
      yearlyPriceUSD: 300,
      limits: {
        projects: -1, // unlimited
        storage: -1, // unlimited
        teamMembers: -1,
        contractors: -1,
      },
      features: [
        'Unlimited projects',
        'Unlimited storage',
        'Unlimited team members',
        'Advanced analytics & reports',
        'PDF/Excel exports',
        'Priority phone & email support',
        'Client portal access',
        'Custom branding',
        'API access',
        'Dedicated account manager',
      ],
      isActive: true,
      isPopular: false,
      sortOrder: 3,
    },
  ];

  for (const plan of defaultPlans) {
    await this.findOneAndUpdate(
      { planId: plan.planId },
      plan,
      { upsert: true, new: true }
    );
  }

  console.log('Default plans seeded successfully');
};

const Plan = mongoose.model('Plan', planSchema);

export default Plan;
