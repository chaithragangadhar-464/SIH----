const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    targetDate: Date,
    completed: { type: Boolean, default: false },
    completedAt: Date,
  },
  { _id: true }
);

const updateSchema = new mongoose.Schema(
  {
    note: String,
    progress: { type: Number, min: 0, max: 100 },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    postedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const implementationSchema = new mongoose.Schema(
  {
    solutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Solution',
      required: true,
      unique: true,
    },

    organization: {
      type: String,
      required: true,
    },

    responsiblePerson: {
      type: String,
    },

    status: {
      type: String,
      enum: ['planned', 'in-progress', 'on-hold', 'completed'],
      default: 'planned',
    },

    startDate: {
      type: Date,
    },

    targetDate: {
      type: Date,
    },

    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    milestones: [milestoneSchema],

    updates: [updateSchema],

    impactMetrics: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    evidence: [
      {
        fileName: String,
        filePath: String,
        fileType: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    completedAt: {
      type: Date,
      default: null,
    },
  },

  { timestamps: true }
);

module.exports = mongoose.model(
  'Implementation',
  implementationSchema
);
