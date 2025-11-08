/**
 * Validate email format
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format
 */
export const validateUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch (error) {
    return false;
  }
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  const minLength = 6;
  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters long`;
  }
  return null;
};

/**
 * Validate UTM parameter format
 */
export const validateUTM = (value, field) => {
  if (!value) return null;
  
  if (value.length > 255) {
    return `${field} must be less than 255 characters`;
  }
  
  // Basic sanitization check
  const invalidChars = /[<>"']/;
  if (invalidChars.test(value)) {
    return `${field} contains invalid characters`;
  }
  
  return null;
};

/**
 * Validate date range
 */
export const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start > end) {
    return 'Start date cannot be after end date';
  }
  
  // Limit to 1 year range
  const oneYearFromStart = new Date(start);
  oneYearFromStart.setFullYear(oneYearFromStart.getFullYear() + 1);
  
  if (end > oneYearFromStart) {
    return 'Date range cannot exceed 1 year';
  }
  
  return null;
};

/**
 * Validate CSV file
 */
export const validateCSVFile = (file) => {
  if (!file) return 'Please select a file';
  
  if (file.type !== 'text/csv') {
    return 'Please upload a CSV file';
  }
  
  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    return 'File size must be less than 5MB';
  }
  
  return null;
};

/**
 * Validate link creation form
 */
export const validateLinkForm = (data) => {
  const errors = {};
  
  if (!data.original_url) {
    errors.original_url = 'URL is required';
  } else if (!validateUrl(data.original_url)) {
    errors.original_url = 'Please enter a valid URL';
  }
  
  if (data.campaign_name && data.campaign_name.length > 255) {
    errors.campaign_name = 'Campaign name must be less than 255 characters';
  }
  
  if (data.max_clicks && (data.max_clicks < 1 || data.max_clicks > 1000000)) {
    errors.max_clicks = 'Max clicks must be between 1 and 1,000,000';
  }
  
  if (data.password && data.password.length < 3) {
    errors.password = 'Password must be at least 3 characters long';
  }
  
  // Validate UTM parameters
  const utmFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  utmFields.forEach(field => {
    const error = validateUTM(data[field], field.replace('utm_', ''));
    if (error) {
      errors[field] = error;
    }
  });
  
  return errors;
};

/**
 * Sanitize user input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

/**
 * Sanitize URL
 */
export const sanitizeUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    
    // Remove fragments and certain query parameters
    parsedUrl.hash = '';
    
    // Allow only HTTP/HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol');
    }
    
    return parsedUrl.toString();
  } catch (error) {
    throw new Error('Invalid URL format');
  }
};

/**
 * Validate analytics query parameters
 */
export const validateAnalyticsQuery = (query) => {
  const errors = {};
  
  if (query.period && !['1d', '7d', '30d', '90d', 'all'].includes(query.period)) {
    errors.period = 'Invalid period specified';
  }
  
  if (query.start_date) {
    const startDate = new Date(query.start_date);
    if (isNaN(startDate.getTime())) {
      errors.start_date = 'Invalid start date';
    }
  }
  
  if (query.end_date) {
    const endDate = new Date(query.end_date);
    if (isNaN(endDate.getTime())) {
      errors.end_date = 'Invalid end date';
    }
  }
  
  if (query.start_date && query.end_date) {
    const startDate = new Date(query.start_date);
    const endDate = new Date(query.end_date);
    
    if (startDate > endDate) {
      errors.date_range = 'Start date cannot be after end date';
    }
  }
  
  return errors;
};