const Comment = require('../models/Comment');
const Problem = require('../models/Problem');
const { recalculatePriority } = require('./problemController');
const { createNotification } = require('../services/notificationService');
const { success, error } = require('../utils/response');

// GET /api/problems/:id/comments
const getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ problemId: req.params.id })
      .populate('userId', 'name role')
      .sort({ createdAt: -1 });

    return success(res, {
      comments,
      count: comments.length
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/problems/:id/comments
const addComment = async (req, res, next) => {
  try {
    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return error(res, 'Problem not found', 404);
    }

    const { content } = req.body;

    if (!content || !content.trim()) {
      return error(res, 'Comment content is required', 400);
    }

    const comment = await Comment.create({
      problemId: req.params.id,
      userId: req.user._id,
      content,
    });

    await recalculatePriority(req.params.id);

    if (problem.postedBy.toString() !== req.user._id.toString()) {
      await createNotification({
        userId: problem.postedBy,
        type: 'problem-comment',
        title: 'New comment on your problem',
        message: `${req.user.name} commented on "${problem.title}"`,
        relatedId: problem._id,
      });
    }

    return success(
      res,
      { comment },
      'Comment added',
      201
    );
  } catch (err) {
    next(err);
  }
};

// PUT /api/comments/:id
const updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return error(res, 'Comment not found', 404);
    }

    const isOwner =
      comment.userId.toString() === req.user._id.toString();

    if (!isOwner && req.user.role !== 'admin') {
      return error(
        res,
        'You are not authorized to edit this comment',
        403
      );
    }

    if (req.body.content !== undefined) {
      comment.content = req.body.content;
    }

    await comment.save();

    return success(
      res,
      { comment },
      'Comment updated'
    );
  } catch (err) {
    next(err);
  }
};

// DELETE /api/comments/:id
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return error(res, 'Comment not found', 404);
    }

    const isOwner =
      comment.userId.toString() === req.user._id.toString();

    if (!isOwner && req.user.role !== 'admin') {
      return error(
        res,
        'You are not authorized to delete this comment',
        403
      );
    }

    const problemId = comment.problemId;

    await comment.deleteOne();
    await recalculatePriority(problemId);

    return success(
      res,
      {},
      'Comment deleted'
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getComments,
  addComment,
  updateComment,
  deleteComment
};
