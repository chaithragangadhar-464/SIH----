const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { error } = require('../utils/response');

// Verifies the JWT and attaches the authenticated user to req.user
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Not authorized, no token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return error(res, 'Not authorized, token invalid or expired', 401);
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return error(res, 'Not authorized, user no longer exists', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    return error(res, 'Authentication error', 401);
  }
};

module.exports = { protect };
