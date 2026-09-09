const User = require('../models/User');
const Certification = require('../models/Certification');
const { success, error } = require('../utils/response');

// GET /api/users/:id
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return error(res, 'User not found', 404);
    }

    return success(res, {
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/:id
const updateUser = async (req, res, next) => {
  try {
    if (
      req.user._id.toString() !== req.params.id &&
      req.user.role !== 'admin'
    ) {
      return error(
        res,
        'You are not authorized to update this profile',
        403
      );
    }

    const forbiddenFields = [
      'password',
      'role',
      'email',
      'verificationStatus',
    ];

    const updates = { ...req.body };

    forbiddenFields.forEach((f) => {
      delete updates[f];
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      return error(res, 'User not found', 404);
    }

    return success(
      res,
      {
        user: user.toSafeObject(),
      },
      'Profile updated'
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/users
// Basic directory, supports ?role= & ?skill=
const listUsers = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.role) {
      filter.role = req.query.role;
    }

    if (req.query.skill) {
      filter.skills = req.query.skill;
    }

    const users = await User.find(filter).limit(200);

    return success(res, {
      users: users.map((u) => u.toSafeObject()),
      count: users.length,
    });
  } catch (err) {
    next(err);
  }
};

// --- Certifications nested under a user ---

// POST /api/users/:id/certifications
const addCertification = async (req, res, next) => {
  try {
    if (
      req.user._id.toString() !== req.params.id
    ) {
      return error(
        res,
        'You can only add certifications to your own profile',
        403
      );
    }

    if (!req.file) {
      return error(
        res,
        'A verification document file is required',
        400
      );
    }

    const {
      skill,
      certificateName,
      issuer,
      issueDate,
    } = req.body;

    if (!skill || !certificateName) {
      return error(
        res,
        'skill and certificateName are required',
        400
      );
    }

    const certification =
      await Certification.create({
        userId: req.user._id,
        skill,
        certificateName,
        issuer,
        issueDate,
        documentPath: req.file.path,
      });

    return success(
      res,
      { certification },
      'Certification submitted for verification',
      201
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id/certifications
const getCertifications = async (
  req,
  res,
  next
) => {
  try {
    const certifications =
      await Certification.find({
        userId: req.params.id,
      });

    return success(res, {
      certifications,
      count: certifications.length,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUserById,
  updateUser,
  listUsers,
  addCertification,
  getCertifications,
};
