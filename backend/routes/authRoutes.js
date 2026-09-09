const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getMe
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

const {
  registerValidators,
  loginValidators
} = require('../utils/validators');

router.post(
  '/register',
  registerValidators,
  register
);

router.post(
  '/login',
  loginValidators,
  login
);

router.get(
  '/me',
  protect,
  getMe
);

module.exports = router;
