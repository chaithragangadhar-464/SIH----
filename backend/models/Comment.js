const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

commentSchema.index({ problemId: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
