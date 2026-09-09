const Problem = require('../models/Problem');
const Comment = require('../models/Comment');
const Vote = require('../models/Vote');
const User = require('../models/User');
const { classifyProblem } = require('../services/aiService');
const { detectDuplicates } = require('../services/duplicateDetection');
const { calculatePriority } = require('../services/priorityService');
const { success, error } = require('../utils/response');

// POST /api/problems
const createProblem = async (req, res, next) => {
  try {
    const { title, description, importance, affectedPeople, location, existingAttempts, expectedImpact } =
      req.body;

    const evidence = (req.files || []).map((file) => ({
      fileName: file.originalname,
      filePath: file.path,
      fileType: file.mimetype,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
    }));

    let problem = await Problem.create({
      title,
      description,
      importance,
      affectedPeople,
      location,
      existingAttempts,
      expectedImpact,
      evidence,
      postedBy: req.user._id,
    });

    // AI sector classification — if the AI service is unavailable, the
    // problem remains created with sector fields left null/pending.
    const classification = await classifyProblem(`${title}. ${description}`);
    if (classification) {
      problem.sector = classification.sector || 'Other';
      problem.subSector = classification.subsector || null;
      problem.aiConfidence = classification.confidence;
    }

    // Duplicate detection — same graceful-degradation rule applies.
    const duplicateResult = await detectDuplicates(problem);
    if (duplicateResult && duplicateResult.isDuplicate && duplicateResult.similarProblemId) {
      problem.duplicateOf = duplicateResult.similarProblemId;
    }
    if (duplicateResult && Array.isArray(duplicateResult.matches)) {
      problem.relatedProblems = duplicateResult.matches
        .map((m) => m.id)
        .filter(Boolean);
    }

    // Initial priority — based only on actual stored data (no votes/comments yet).
    const { priorityScore, priorityLevel } = calculatePriority(problem, {
      voteCount: 0,
      commentCount: 0,
    });
    problem.priorityScore = priorityScore;
    problem.priorityLevel = priorityLevel;

    await problem.save();

    return success(res, { problem }, 'Problem created successfully', 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/problems  (supports ?sector=&status=&search=&page=&limit=)
const listProblems = async (req, res, next) => {
  try {
    const { sector, status, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (sector) filter.sector = sector;
    if (status) filter.status = status;
    if (search) filter.$text = { $search: search };

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [problems, total] = await Promise.all([
      Problem.find(filter)
        .populate('postedBy', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Problem.countDocuments(filter),
    ]);

    return success(res, {
      problems,
      pagination: { total, page: parseInt(page, 10), limit: parseInt(limit, 10) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/problems/:id
const getProblemById = async (req, res, next) => {
  try {
    const problem = await Problem.findById(req.params.id).populate('postedBy', 'name role');
    if (!problem) return error(res, 'Problem not found', 404);
    return success(res, { problem });
  } catch (err) {
    next(err);
  }
};

// PUT /api/problems/:id
const updateProblem = async (req, res, next) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return error(res, 'Problem not found', 404);

    const isOwner = problem.postedBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return error(res, 'You are not authorized to update this problem', 403);
    }

    const editableFields = [
      'title', 'description', 'importance', 'affectedPeople', 'location',
      'existingAttempts', 'expectedImpact', 'status',
    ];
    editableFields.forEach((field) => {
      if (req.body[field] !== undefined) problem[field] = req.body[field];
    });

    await problem.save();
    return success(res, { problem }, 'Problem updated');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/problems/:id
const deleteProblem = async (req, res, next) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return error(res, 'Problem not found', 404);

    const isOwner = problem.postedBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return error(res, 'You are not authorized to delete this problem', 403);
    }

    await problem.deleteOne();
    return success(res, {}, 'Problem deleted');
  } catch (err) {
    next(err);
  }
};

// Internal helper reused by vote/comment controllers to recompute priority
// from real, current counts.
const recalculatePriority = async (problemId) => {
  const problem = await Problem.findById(problemId);
  if (!problem) return null;

  const [voteCount, commentCount] = await Promise.all([
    Vote.countDocuments({ problemId }),
    Comment.countDocuments({ problemId }),
  ]);

  const { priorityScore, priorityLevel } = calculatePriority(problem, { voteCount, commentCount });
  problem.priorityScore = priorityScore;
  problem.priorityLevel = priorityLevel;
  problem.voteCount = voteCount;
  await problem.save();
  return problem;
};

// GET /api/problems/:id/recommendations
// Skill-matching: surfaces real, registered users whose skills/role/interests
// align with the problem's sector. Never fabricates recommendations.
const getRecommendations = async (req, res, next) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return error(res, 'Problem not found', 404);

    const solverRoles = ['student', 'researcher', 'university', 'industry'];
    const filter = { role: { $in: solverRoles } };

    const orConditions = [];
    if (problem.sector) {
      orConditions.push({ interests: problem.sector });
      orConditions.push({ researchArea: problem.sector });
      orConditions.push({ specialization: problem.sector });
    }
    if (orConditions.length > 0) filter.$or = orConditions;

    const users = await User.find(filter).limit(20);

    if (users.length === 0) {
      return success(res, { recommendations: [] });
    }

    return success(res, {
      recommendations: users.map((u) => u.toSafeObject()),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createProblem,
  listProblems,
  getProblemById,
  updateProblem,
  deleteProblem,
  recalculatePriority,
  getRecommendations,
};