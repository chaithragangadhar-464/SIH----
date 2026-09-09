const mongoose = require('mongoose');

const EVALUATION_STATUS = ['pending', 'under-review', 'evaluated', 'selected', 'rejected'];

const documentSchema = new mongoose.Schema(
  {
    fileName: String,
    filePath: String,
    fileType: String,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const solutionSchema = new mongoose.Schema(
  {
    problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    howItSolvesProblem: { type: String },
    technology: [{ type: String, trim: true }],
    implementationPlan: { type: String },
    expectedImpact: { type: String },
    estimatedCost: { type: String },
    timeline: { type: String },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    documents: [documentSchema],
    demoLink: { type: String },
    githubLink: { type: String },
    averageRating: { type: Number, default: 0 },
    evaluationStatus: { type: String, enum: EVALUATION_STATUS, default: 'pending' },
    selected: { type: Boolean, default: false },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

solutionSchema.index({ problemId: 1 });

module.exports = mongoose.model('Solution', solutionSchema);
module.exports.EVALUATION_STATUS = EVALUATION_STATUS;
