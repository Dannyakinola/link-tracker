const { body, param, query } = require('express-validator');

/**
 * Validation rules for link creation
 */
const createLinkValidation = [
  body('original_url')
    .isURL()
    .withMessage('Please provide a valid URL')
    .isLength({ max: 2048 })
    .withMessage('URL must be less than 2048 characters'),
  
  body('campaign_name')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Campaign name must be less than 255 characters'),
  
  body('expires_at')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date format (ISO 8601)'),
  
  body('max_clicks')
    .optional()
    .isInt({ min: 1, max: 1000000 })
    .withMessage('Max clicks must be a positive integer'),
  
  body('password')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Password must be between 3 and 100 characters'),
  
  body('utm_source')
    .optional()
    .isLength({ max: 255 })
    .withMessage('UTM source must be less than 255 characters'),
  
  body('utm_medium')
    .optional()
    .isLength({ max: 255 })
    .withMessage('UTM medium must be less than 255 characters'),
  
  body('utm_campaign')
    .optional()
    .isLength({ max: 255 })
    .withMessage('UTM campaign must be less than 255 characters'),
  
  body('utm_term')
    .optional()
    .isLength({ max: 255 })
    .withMessage('UTM term must be less than 255 characters'),
  
  body('utm_content')
    .optional()
    .isLength({ max: 255 })
    .withMessage('UTM content must be less than 255 characters')
];

/**
 * Validation rules for analytics queries
 */
const analyticsValidation = [
  query('period')
    .optional()
    .isIn(['1d', '7d', '30d', '90d', 'all'])
    .withMessage('Period must be one of: 1d, 7d, 30d, 90d, all'),
  
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be in ISO 8601 format'),
  
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be in ISO 8601 format'),
  
  query('format')
    .optional()
    .isIn(['json', 'csv'])
    .withMessage('Format must be either json or csv')
];

/**
 * Validation rules for link ID parameters
 */
const linkIdValidation = [
  param('linkId')
    .isLength({ min: 1, max: 20 })
    .withMessage('Link ID must be between 1 and 20 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Link ID can only contain letters, numbers, hyphens, and underscores')
];

/**
 * Validation rules for bulk import
 */
const bulkImportValidation = [
  body('*.url')
    .isURL()
    .withMessage('Each row must have a valid URL'),
  
  body('*.campaign_name')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Campaign name must be less than 255 characters')
];

/**
 * Custom validation for date range
 */
const validateDateRange = (req, res, next) => {
  const { start_date, end_date } = req.query;
  
  if (start_date && end_date) {
    const start = new Date(start_date);
    const end = new Date(end_date);
    
    if (start > end) {
      return res.status(400).json({
        success: false,
        error: 'Start date cannot be after end date'
      });
    }
    
    // Limit date range to 1 year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    if (start < oneYearAgo) {
      return res.status(400).json({
        success: false,
        error: 'Date range cannot exceed 1 year'
      });
    }
  }
  
  next();
};

module.exports = {
  createLinkValidation,
  analyticsValidation,
  linkIdValidation,
  bulkImportValidation,
  validateDateRange
};