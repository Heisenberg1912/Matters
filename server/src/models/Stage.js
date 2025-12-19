import mongoose from 'mongoose';

const stageSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
    },
    name: {
      type: String,
      required: [true, 'Stage name is required'],
      trim: true,
      maxlength: [100, 'Stage name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    order: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: [
        'ideation',
        'planning',
        'foundation',
        'structure',
        'electrical',
        'plumbing',
        'finishing',
        'inspection',
        'handover',
        'custom',
      ],
      default: 'custom',
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'on_hold', 'skipped'],
      default: 'pending',
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    startDate: Date,
    expectedEndDate: Date,
    actualEndDate: Date,
    budget: {
      estimated: { type: Number, default: 0 },
      spent: { type: Number, default: 0 },
    },
    tasks: [{
      title: { type: String, required: true },
      description: String,
      status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed'],
        default: 'pending',
      },
      assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      dueDate: Date,
      completedAt: Date,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
      },
    }],
    checklist: [{
      item: { type: String, required: true },
      isCompleted: { type: Boolean, default: false },
      completedAt: Date,
      completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    }],
    uploads: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Upload',
    }],
    bills: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bill',
    }],
    notes: [{
      content: String,
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now },
    }],
    dependencies: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stage',
    }],
    approvals: [{
      approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status: { type: String, enum: ['pending', 'approved', 'rejected'] },
      comment: String,
      approvedAt: Date,
    }],
    weather: {
      recommendation: String,
      lastChecked: Date,
    },
    color: {
      type: String,
      default: '#3B82F6',
    },
    icon: {
      type: String,
      default: 'construction',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
stageSchema.index({ project: 1, order: 1 });
stageSchema.index({ status: 1 });
stageSchema.index({ type: 1 });

// Virtual for task completion percentage
stageSchema.virtual('taskCompletion').get(function () {
  if (!this.tasks || this.tasks.length === 0) return 100;
  const completed = this.tasks.filter((t) => t.status === 'completed').length;
  return Math.round((completed / this.tasks.length) * 100);
});

// Virtual for checklist completion percentage
stageSchema.virtual('checklistCompletion').get(function () {
  if (!this.checklist || this.checklist.length === 0) return 100;
  const completed = this.checklist.filter((c) => c.isCompleted).length;
  return Math.round((completed / this.checklist.length) * 100);
});

// Pre-save hook to update progress
stageSchema.pre('save', function (next) {
  // Calculate progress based on tasks and checklist
  const taskProgress = this.taskCompletion || 0;
  const checklistProgress = this.checklistCompletion || 0;

  // Weight tasks 70%, checklist 30%
  const hasChecklist = this.checklist && this.checklist.length > 0;
  const hasTasks = this.tasks && this.tasks.length > 0;

  if (hasTasks && hasChecklist) {
    this.progress = Math.round(taskProgress * 0.7 + checklistProgress * 0.3);
  } else if (hasTasks) {
    this.progress = taskProgress;
  } else if (hasChecklist) {
    this.progress = checklistProgress;
  }

  // Auto-update status based on progress
  if (this.progress === 100 && this.status === 'in_progress') {
    this.status = 'completed';
    this.actualEndDate = new Date();
  }

  next();
});

// Method to add task
stageSchema.methods.addTask = function (task) {
  this.tasks.push(task);
  return this.save();
};

// Method to update task status
stageSchema.methods.updateTaskStatus = function (taskId, status) {
  const task = this.tasks.id(taskId);
  if (task) {
    task.status = status;
    if (status === 'completed') {
      task.completedAt = new Date();
    }
  }
  return this.save();
};

// Method to toggle checklist item
stageSchema.methods.toggleChecklistItem = function (itemId, userId) {
  const item = this.checklist.id(itemId);
  if (item) {
    item.isCompleted = !item.isCompleted;
    if (item.isCompleted) {
      item.completedAt = new Date();
      item.completedBy = userId;
    } else {
      item.completedAt = null;
      item.completedBy = null;
    }
  }
  return this.save();
};

// Static method to get stages by project
stageSchema.statics.findByProject = function (projectId) {
  return this.find({ project: projectId }).sort({ order: 1 });
};

// Static method to get default stages template
stageSchema.statics.getDefaultStages = function () {
  return [
    { name: 'Ideation', type: 'ideation', order: 0, color: '#8B5CF6', icon: 'lightbulb' },
    { name: 'Planning', type: 'planning', order: 1, color: '#3B82F6', icon: 'clipboard' },
    { name: 'Foundation', type: 'foundation', order: 2, color: '#EF4444', icon: 'foundation' },
    { name: 'Structure', type: 'structure', order: 3, color: '#F59E0B', icon: 'building' },
    { name: 'Electrical', type: 'electrical', order: 4, color: '#10B981', icon: 'bolt' },
    { name: 'Plumbing', type: 'plumbing', order: 5, color: '#06B6D4', icon: 'water' },
    { name: 'Finishing', type: 'finishing', order: 6, color: '#EC4899', icon: 'paint' },
    { name: 'Inspection', type: 'inspection', order: 7, color: '#6366F1', icon: 'check' },
    { name: 'Handover', type: 'handover', order: 8, color: '#22C55E', icon: 'key' },
  ];
};

const Stage = mongoose.model('Stage', stageSchema);

export default Stage;
