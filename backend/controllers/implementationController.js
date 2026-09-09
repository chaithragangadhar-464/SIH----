const Implementation = require('../models/Implementation');
const Solution = require('../models/Solution');
const { success, error } = require('../utils/response');

const canManage = (user) =>
  [
    'ngo',
    'government',
    'industry',
    'university',
    'admin'
  ].includes(user.role);

// GET /api/solutions/:id/implementation
const getImplementation = async (req, res, next) => {
  try {
    const implementation =
      await Implementation.findOne({
        solutionId: req.params.id
      });

    if (!implementation) {
      return success(
        res,
        { implementation: null },
        'No implementation record yet'
      );
    }

    return success(
      res,
      { implementation }
    );
  } catch (err) {
    next(err);
  }
};

// POST /api/solutions/:id/implementation
const createImplementation = async (req, res, next) => {
  try {
    if (!canManage(req.user)) {
      return error(
        res,
        'Your role is not authorized to manage implementation records',
        403
      );
    }

    const solution =
      await Solution.findById(
        req.params.id
      );

    if (!solution) {
      return error(
        res,
        'Solution not found',
        404
      );
    }

    const existing =
      await Implementation.findOne({
        solutionId: req.params.id
      });

    if (existing) {
      return error(
        res,
        'An implementation record already exists for this solution. Use PUT to update it.',
        409
      );
    }

    const {
      organization,
      responsiblePerson,
      status,
      startDate,
      targetDate
    } = req.body;

    if (!organization) {
      return error(
        res,
        'organization is required',
        400
      );
    }

    const implementation =
      await Implementation.create({
        solutionId: req.params.id,
        organization,
        responsiblePerson,
        status: status || 'planned',
        startDate,
        targetDate,
      });

    return success(
      res,
      { implementation },
      'Implementation record created',
      201
    );
  } catch (err) {
    next(err);
  }
};

// PUT /api/solutions/:id/implementation
const updateImplementation = async (
  req,
  res,
  next
) => {
  try {
    if (!canManage(req.user)) {
      return error(
        res,
        'Your role is not authorized to manage implementation records',
        403
      );
    }

    const implementation =
      await Implementation.findOne({
        solutionId: req.params.id
      });

    if (!implementation) {
      return error(
        res,
        'Implementation record not found',
        404
      );
    }

    const {
      organization,
      responsiblePerson,
      status,
      startDate,
      targetDate,
      impactMetrics
    } = req.body;

    if (organization !== undefined) {
      implementation.organization =
        organization;
    }

    if (responsiblePerson !== undefined) {
      implementation.responsiblePerson =
        responsiblePerson;
    }

    if (status !== undefined) {
      implementation.status = status;
    }

    if (startDate !== undefined) {
      implementation.startDate = startDate;
    }

    if (targetDate !== undefined) {
      implementation.targetDate = targetDate;
    }

    if (impactMetrics !== undefined) {
      implementation.impactMetrics =
        impactMetrics;
    }

    if (req.body.newUpdate) {
      const {
        note,
        progress
      } = req.body.newUpdate;

      implementation.updates.push({
        note,
        progress,
        postedBy: req.user._id,
        postedAt: new Date()
      });

      if (typeof progress === 'number') {
        implementation.progress =
          progress;
      }
    }

    if (req.body.newMilestone) {
      implementation.milestones.push(
        req.body.newMilestone
      );
    }

    if (
      req.files &&
      req.files.length > 0
    ) {
      req.files.forEach((file) => {
        implementation.evidence.push({
          fileName: file.originalname,
          filePath: file.path,
          fileType: file.mimetype,
        });
      });
    }

    if (
      implementation.status ===
        'completed' &&
      !implementation.completedAt
    ) {
      implementation.completedAt =
        new Date();

      implementation.progress = 100;
    }

    await implementation.save();

    return success(
      res,
      { implementation },
      'Implementation record updated'
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getImplementation,
  createImplementation,
  updateImplementation
};
