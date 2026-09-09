const Vote = require('../models/Vote');
const Problem = require('../models/Problem');
const { recalculatePriority } = require('./problemController');
const { success, error } = require('../utils/response');

// POST /api/problems/:id/vote
const castVote = async (req, res, next) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return error(res, 'Problem not found', 404);

    try {
      await Vote.create({
        problemId: req.params.id,
        userId: req.user._id
      });
    } catch (err) {
      if (err.code === 11000) {
        return error(res, 'You have already voted for this problem', 409);
      }
      throw err;
    }

    const updatedProblem = await recalculatePriority(req.params.id);
    const voteCount = await Vote.countDocuments({
      problemId: req.params.id
    });

    return success(
      res,
      {
        voteCount,
        hasVoted: true,
        problem: updatedProblem
      },
      'Vote recorded',
      201
    );
  } catch (err) {
    next(err);
  }
};

// DELETE /api/problems/:id/vote
const removeVote = async (req, res, next) => {
  try {
    const result = await Vote.findOneAndDelete({
      problemId: req.params.id,
      userId: req.user._id
    });

    if (!result) {
      return error(res, 'You have not voted for this problem', 404);
    }

    const updatedProblem = await recalculatePriority(req.params.id);
    const voteCount = await Vote.countDocuments({
      problemId: req.params.id
    });

    return success(
      res,
      {
        voteCount,
        hasVoted: false,
        problem: updatedProblem
      },
      'Vote removed'
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  castVote,
  removeVote
};
