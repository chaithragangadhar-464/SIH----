const Solution = require('../models/Solution');
const Problem = require('../models/Problem');
const Rating = require('../models/Rating');
const Team = require('../models/Team');
const { notifyMany } = require('../services/notificationService');
const { success, error } = require('../utils/response');

const SOLVER_ROLES = ['student', 'researcher', 'university', 'industry'];
const EVALUATOR_ROLES = ['ngo', 'government', 'expert', 'industry', 'admin'];

// POST /api/problems/:id/solutions
const createSolution = async (req, res, next) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return error(res, 'Problem not found', 404);

    if (!SOLVER_ROLES.includes(req.user.role) && req.user.role !== 'admin') {
      return error(res, 'Your role is not permitted to submit solutions', 403);
    }

    const {
      title, description, howItSolvesProblem, technology, implementationPlan,
      expectedImpact, estimatedCost, timeline, teamId, demoLink, githubLink,
    } = req.body;

    const documents = (req.files || []).map((file) => ({
      fileName: file.originalname,
      filePath: file.path,
      fileType: file.mimetype,
      uploadedAt: new Date(),
    }));

    const solution = await Solution.create({
      problemId: problem._id,
      title,
      description,
      howItSolvesProblem,
      technology: Array.isArray(technology) ? technology : technology ? [technology] : [],
      implementationPlan,
      expectedImpact,
      estimatedCost,
      timeline,
      teamId: teamId || null,
      documents,
      demoLink,
      githubLink,
      submittedBy: req.user._id,
    });

    if (problem.status === 'open' || problem.status === 'under-development') {
      problem.status = 'solutions-received';
      await problem.save();
    }

    return success(res, { solution }, 'Solution submitted successfully', 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/problems/:id/solutions
const getSolutionsForProblem = async (req, res, next) => {
  try {
    const solutions = await Solution.find({ problemId: req.params.id })
      .populate('submittedBy', 'name role')
      .populate('teamId', 'name');
    return success(res, { solutions, count: solutions.length });
  } catch (err) {
    next(err);
  }
};

// GET /api/solutions/mine
const getMySolutions = async (req, res, next) => {
  try {
    const solutions = await Solution.find({ submittedBy: req.user._id })
      .populate('problemId', 'title location status')
      .populate('teamId', 'name')
      .sort({ createdAt: -1 });
    return success(res, { solutions, count: solutions.length });
  } catch (err) {
    next(err);
  }
};

// GET /api/solutions/:id
const getSolutionById = async (req, res, next) => {
  try {
    const solution = await Solution.findById(req.params.id)
      .populate('submittedBy', 'name role')
      .populate('teamId', 'name members');
    if (!solution) return error(res, 'Solution not found', 404);
    return success(res, { solution });
  } catch (err) {
    next(err);
  }
};

// PUT /api/solutions/:id
const updateSolution = async (req, res, next) => {
  try {
    const solution = await Solution.findById(req.params.id);
    if (!solution) return error(res, 'Solution not found', 404);

    const isOwner = solution.submittedBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return error(res, 'You are not authorized to update this solution', 403);
    }

    const editableFields = [
      'title', 'description', 'howItSolvesProblem', 'technology', 'implementationPlan',
      'expectedImpact', 'estimatedCost', 'timeline', 'demoLink', 'githubLink',
    ];
    editableFields.forEach((field) => {
      if (req.body[field] !== undefined) solution[field] = req.body[field];
    });

    await solution.save();
    return success(res, { solution }, 'Solution updated');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/solutions/:id
const deleteSolution = async (req, res, next) => {
  try {
    const solution = await Solution.findById(req.params.id);
    if (!solution) return error(res, 'Solution not found', 404);

    const isOwner = solution.submittedBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return error(res, 'You are not authorized to delete this solution', 403);
    }

    await Rating.deleteMany({ solutionId: solution._id });
    await solution.deleteOne();

    return success(res, {}, 'Solution deleted');
  } catch (err) {
    next(err);
  }
};

// POST /api/solutions/:id/select
// Only authorized evaluators/admins can select the final solution for a problem.
const selectSolution = async (req, res, next) => {
  try {
    if (!EVALUATOR_ROLES.includes(req.user.role)) {
      return error(res, 'Your role is not authorized to select solutions', 403);
    }

    const solution = await Solution.findById(req.params.id);
    if (!solution) return error(res, 'Solution not found', 404);

    // Ensure no other solution for the same problem is simultaneously selected.
    await Solution.updateMany(
      { problemId: solution.problemId, _id: { $ne: solution._id } },
      { $set: { selected: false } }
    );

    solution.selected = true;
    solution.evaluationStatus = 'selected';
    await solution.save();

    const problem = await Problem.findById(solution.problemId);
    if (problem) {
      problem.status = 'solution-selected';
      await problem.save();
    }

    // Notify team members (or the individual submitter if there is no team).
    if (solution.teamId) {
      const team = await Team.findById(solution.teamId);
      if (team) {
        await notifyMany(team.members.map((m) => m.userId), {
          type: 'solution-selected',
          title: 'Your solution was selected!',
          message: `"${solution.title}" has been selected for implementation`,
          relatedId: solution._id,
        });
      }
    } else {
      await notifyMany([solution.submittedBy], {
        type: 'solution-selected',
        title: 'Your solution was selected!',
        message: `"${solution.title}" has been selected for implementation`,
        relatedId: solution._id,
      });
    }

    return success(res, { solution, problem }, 'Solution selected for implementation');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createSolution,
  getSolutionsForProblem,
  getMySolutions,
  getSolutionById,
  updateSolution,
  deleteSolution,
  selectSolution,
  SOLVER_ROLES,
  EVALUATOR_ROLES,
};