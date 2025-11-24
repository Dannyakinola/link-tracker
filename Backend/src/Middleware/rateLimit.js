const rateLimit = require('express-rate-limit');
const { logSecurityEvent } = require('../utils/security');

// Different rate limits for different routes
const createRateLimit = (windowMs, max, message, keyGenerator = null) => {
  return rateLimit({
    windowMs,
    max,
    message: { success: false, error: message },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyGenerator || ((req) => req.ip),
    handler: async (req, res) => {
      await logSecurityEvent(req.user?.id, 'RATE_LIMIT_EXCEEDED', req.ip, req.get('User-Agent'), {
        windowMs,
        max,
        path: req.path
      });
      
      res.status(429).json({
        success: false,
        error: message
      });
    }
  });
};

// Rate limiters
const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts, please try again later.'
);

const apiLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests
  'Too many API requests, please try again later.'
);

const redirectLimiter = createRateLimit(
  60 * 1000, // 1 minute
  50, // 50 redirects
  'Too many redirect requests, please slow down.'
);

const bulkImportLimiter = createRateLimit(
  60 * 60 * 1000, // 1 hour
  5, // 5 bulk imports per hour
  'Too many bulk imports, please try again later.'
);

module.exports = {
  authLimiter,
  apiLimiter,
  redirectLimiter,
  bulkImportLimiter,
  createRateLimit
};