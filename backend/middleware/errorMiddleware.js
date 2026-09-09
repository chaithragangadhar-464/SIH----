// Centralized error handler. Never exposes stack traces in production.

const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
};

const errorHandler = (err, req, res, next) => {
  console.error(err);

  let statusCode =
    err.statusCode ||
    (res.statusCode !== 200 ? res.statusCode : 500);

  let message =
    err.message || 'Internal server error';

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource identifier';
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate resource';
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 422;

    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // Multer errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.message;
  }

  const body = {
    success: false,
    message,
  };

  if (process.env.NODE_ENV !== 'production') {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
};

module.exports = {
  notFound,
  errorHandler,
};
