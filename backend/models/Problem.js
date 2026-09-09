const mongoose = require('mongoose');

const STATUS_VALUES = [
  'open',
  'under-development',
  'solutions-received',
  'under-evaluation',
  'solution-selected',
  'implementation',
  'completed',
];

const evidenceSchema = new mongoose.Schema(
  {
    fileName: String,
    filePath: String,
    fileType: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const problemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    importance: { type: String },
    affectedPeople: { type: String },
    location: { type: String, required: true },
    existingAttempts: { type: String },
    expectedImpact: { type: String },
    evidence: [evidenceSchema],

    sector: { type: String, default: null },
    subSector: { type: String, default: null },
    aiConfidence: { type: Number, default: null },

    priorityScore: { type: Number, default: null },
    priorityLevel: { type: String, enum: ['High', 'Medium', 'Low', null], default: null },

    duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', default: null },
    relatedProblems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],

    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: STATUS_VALUES, default: 'open' },

    voteCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

problemSchema.index({ title: 'text', description: 'text' });
problemSchema.index({ sector: 1 });
problemSchema.index({ status: 1 });

module.exports = mongoose.model('Problem', problemSchema);
module.exports.STATUS_VALUES = STATUS_VALUES;
