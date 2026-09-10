const User = require('../models/User');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const { success, error } = require('../utils/response');

const parseCsvList = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return undefined;
};

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');

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
      organization: organizationFromBody,
      designation: designationFromBody,
      course,
      branch,
      year,
      researchArea,
      specialization,
      skills,
      interests,
      college,
      institution,
      companyName,
      universityName,
      officialEmail,
      industrySector,
      departments,
      expertise,
      contactPerson,
      website,
    } = req.body;

    const organization = firstDefined(organizationFromBody, college, institution, companyName, universityName);
    const designation = firstDefined(designationFromBody, contactPerson, website);
    const resolvedResearchArea = firstDefined(researchArea, specialization, expertise, industrySector);
    const resolvedSkills = parseCsvList(skills) || parseCsvList(req.body.skill) || undefined;
    const resolvedInterests = parseCsvList(interests) || parseCsvList(req.body.interestsText) || undefined;

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
      researchArea: resolvedResearchArea,
      specialization,
      skills: resolvedSkills,
      interests: resolvedInterests,
      departments: parseCsvList(departments),
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
