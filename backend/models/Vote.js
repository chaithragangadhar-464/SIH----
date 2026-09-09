const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema(
  {
    problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// A user can vote only once per problem.
voteSchema.index({ problemId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);
