const User = require('../models/User');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const { success, error } = require('../utils/response');

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      location,
      organization,
      designation,
      course,
      branch,
      year,
      researchArea,
      specialization,
      skills,
      interests,
    } = req.body;

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return error(
        res,
        'A user with this email already exists',
        409
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(
      password,
      salt
    );

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      location,
      organization,
      designation,
      course,
      branch,
      year,
      researchArea,
      specialization,
      skills: Array.isArray(skills)
        ? skills
        : undefined,
      interests: Array.isArray(interests)
        ? interests
        : undefined,
    });

    const token = generateToken(
      user._id,
      user.role
    );

    return success(
      res,
      {
        user: user.toSafeObject(),
        token,
      },
      'Registration successful',
      201
    );
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select('+password');

    if (!user) {
      return error(
        res,
        'Invalid email or password',
        401
      );
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return error(
        res,
        'Invalid email or password',
        401
      );
    }

    const token = generateToken(
      user._id,
      user.role
    );

    return success(
      res,
      {
        user: user.toSafeObject(),
        token,
      },
      'Login successful'
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    return success(res, {
      user: req.user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
