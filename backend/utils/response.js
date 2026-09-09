// Centralized response helpers so every API returns a consistent structure.

const success = (res, data = {}, message = null, statusCode = 200) => {
  const body = { success: true };
  if (message) body.message = message;
  body.data = data;
  return res.status(statusCode).json(body);
};

const error = (res, message = 'Something went wrong', statusCode = 500, extra = {}) => {
  return res.status(statusCode).json({ success: false, message, ...extra });
};

module.exports = { success, error };
