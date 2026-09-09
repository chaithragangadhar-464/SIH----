const { error } = require('../utils/response');

// Usage: authorizeRoles('student', 'researcher', 'industry')
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Not authorized', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return error(
        res,
        `Role '${req.user.role}' is not permitted to perform this action`,
        403
      );
    }

    next();
  };
};

module.exports = { authorizeRoles };
