const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    solutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Solution', required: true },
    evaluatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    innovation: { type: Number, min: 1, max: 5, required: true },
    feasibility: { type: Number, min: 1, max: 5, required: true },
    socialImpact: { type: Number, min: 1, max: 5, required: true },
    scalability: { type: Number, min: 1, max: 5, required: true },
    costEffectiveness: { type: Number, min: 1, max: 5, required: true },
    technicalQuality: { type: Number, min: 1, max: 5, required: true },
    overallScore: { type: Number, min: 1, max: 5 },
    comment: { type: String },
  },
  { timestamps: true }
);

ratingSchema.index(
  { solutionId: 1, evaluatorId: 1 },
  { unique: true }
);

ratingSchema.pre('save', function (next) {
  const fields = [
    this.innovation,
    this.feasibility,
    this.socialImpact,
    this.scalability,
    this.costEffectiveness,
    this.technicalQuality,
  ];

  const sum = fields.reduce((a, b) => a + b, 0);

  this.overallScore =
    Math.round((sum / fields.length) * 100) / 100;

  next();
});

module.exports = mongoose.model('Rating', ratingSchema);
