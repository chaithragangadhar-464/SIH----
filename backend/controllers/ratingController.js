const Rating = require('../models/Rating');
const Solution = require('../models/Solution');
const { notifyMany } = require('../services/notificationService');
const Team = require('../models/Team');
const { success, error } = require('../utils/response');

const EVALUATOR_ROLES = ['ngo', 'government', 'expert', 'industry', 'admin'];

const recalculateAverageRating = async (solutionId) => {
  const ratings = await Rating.find({ solutionId });
  const solution = await Solution.findById(solutionId);

  if (!solution) return null;

  if (ratings.length === 0) {
    solution.averageRating = 0;
  } else {
    const sum = ratings.reduce(
      (acc, r) => acc + r.overallScore,
      0
    );

    solution.averageRating =
      Math.round((sum / ratings.length) * 100) / 100;
  }

  if (solution.evaluationStatus === 'pending') {
    solution.evaluationStatus = 'under-review';
  }

  await solution.save();

  return solution;
};

// POST /api/solutions/:id/rate
const rateSolution = async (req, res, next) => {
  try {
    if (!EVALUATOR_ROLES.includes(req.user.role)) {
      return error(
        res,
        'Your role is not authorized to rate solutions',
        403
      );
    }

    const solution = await Solution.findById(
      req.params.id
    );

    if (!solution) {
      return error(
        res,
        'Solution not found',
        404
      );
    }

    const {
      innovation,
      feasibility,
      socialImpact,
      scalability,
      costEffectiveness,
      technicalQuality,
      comment,
    } = req.body;

    // Upsert: an evaluator can update their own
    // existing rating instead of creating duplicates.
    const rating = await Rating.findOneAndUpdate(
      {
        solutionId: req.params.id,
        evaluatorId: req.user._id,
      },
      {
        solutionId: req.params.id,
        evaluatorId: req.user._id,
        innovation,
        feasibility,
        socialImpact,
        scalability,
        costEffectiveness,
        technicalQuality,
        comment,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    const updatedSolution =
      await recalculateAverageRating(
        req.params.id
      );

    if (
      updatedSolution &&
      updatedSolution.teamId
    ) {
      const team =
        await Team.findById(
          updatedSolution.teamId
        );

      if (team) {
        await notifyMany(
          team.members.map(
            (m) => m.userId
          ),
          {
            type: 'solution-rating',
            title: 'Your solution received a rating',
            message: `"${updatedSolution.title}" received a new rating`,
            relatedId: updatedSolution._id,
          }
        );
      }
    } else if (updatedSolution) {
      await notifyMany(
        [updatedSolution.submittedBy],
        {
          type: 'solution-rating',
          title: 'Your solution received a rating',
          message: `"${updatedSolution.title}" received a new rating`,
          relatedId: updatedSolution._id,
        }
      );
    }

    return success(
      res,
      {
        rating,
        solution: updatedSolution,
      },
      'Rating submitted'
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/solutions/:id/ratings
const getRatingsForSolution = async (
  req,
  res,
  next
) => {
  try {
    const ratings =
      await Rating.find({
        solutionId: req.params.id,
      }).populate(
        'evaluatorId',
        'name role organization'
      );

    return success(
      res,
      {
        ratings,
        count: ratings.length,
      }
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  rateSolution,
  getRatingsForSolution,
  EVALUATOR_ROLES,
};
