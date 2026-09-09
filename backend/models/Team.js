const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const teamSchema = new mongoose.Schema(
  {
    problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
    name: { type: String, required: true, trim: true },
    leaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [memberSchema],
    status: { type: String, enum: ['forming', 'active', 'disbanded'], default: 'forming' },
  },
  { timestamps: true }
);

teamSchema.index({ problemId: 1 });

module.exports = mongoose.model('Team', teamSchema);
