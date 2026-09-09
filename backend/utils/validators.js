const { body, param, query, validationResult } = require('express-validator');
const { ROLES } = require('../models/User');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }

  next();
};

const registerValidators = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required'),

  body('email')
    .isEmail()
    .withMessage('A valid email is required')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  body('role')
    .isIn(ROLES)
    .withMessage(`Role must be one of: ${ROLES.join(', ')}`),

  handleValidation,
];

const loginValidators = [
  body('email')
    .isEmail()
    .withMessage('A valid email is required')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  handleValidation,
];

const problemValidators = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),

  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required'),

  handleValidation,
];

const solutionValidators = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),

  handleValidation,
];

const ratingValidators = [
  body('innovation').isFloat({ min: 1, max: 5 }),
  body('feasibility').isFloat({ min: 1, max: 5 }),
  body('socialImpact').isFloat({ min: 1, max: 5 }),
  body('scalability').isFloat({ min: 1, max: 5 }),
  body('costEffectiveness').isFloat({ min: 1, max: 5 }),
  body('technicalQuality').isFloat({ min: 1, max: 5 }),
  handleValidation,
];

const mongoIdParam = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`),

  handleValidation,
];

module.exports = {
  handleValidation,
  registerValidators,
  loginValidators,
  problemValidators,
  solutionValidators,
  ratingValidators,
  mongoIdParam,
};
