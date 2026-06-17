/**
 * Error Handler Middleware
 * Centralized error handling for Express
 */

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error status and message
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log additional details in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Stack trace:', err.stack);
  }

  // Send error response
  res.status(status).json({
    error: {
      message: message,
      status: status,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err.details
      })
    }
  });
};

// 404 handler
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404,
      path: req.originalUrl
    }
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
