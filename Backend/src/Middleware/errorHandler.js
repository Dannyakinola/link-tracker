const { logSecurityEvent } = require('../utils/security');

// Global error handler
const errorHandler = (error, req, res, next) => {
  console.error('Error:', error);

  // Log security event for server errors
  if (error.status >= 500) {
    logSecurityEvent(req.user?.id, 'SERVER_ERROR', req.ip, req.get('User-Agent'), {
      error: error.message,
      path: req.path,
      method: req.method
    });
  }

  // Default error
  const status = error.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong' 
    : error.message;

  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};