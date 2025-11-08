const { nanoid } = require('nanoid');

/**
 * Generate a unique tracking ID
 */
const generateTrackingId = () => {
  return nanoid(10);
};

/**
 * Format URL with UTM parameters
 */
const formatUrlWithUTM = (originalUrl, utmParams = {}) => {
  try {
    const url = new URL(originalUrl);
    
    // Add UTM parameters if they don't exist
    const { utm_source, utm_medium, utm_campaign, utm_term, utm_content } = utmParams;
    
    if (utm_source && !url.searchParams.has('utm_source')) {
      url.searchParams.set('utm_source', utm_source);
    }
    if (utm_medium && !url.searchParams.has('utm_medium')) {
      url.searchParams.set('utm_medium', utm_medium);
    }
    if (utm_campaign && !url.searchParams.has('utm_campaign')) {
      url.searchParams.set('utm_campaign', utm_campaign);
    }
    if (utm_term && !url.searchParams.has('utm_term')) {
      url.searchParams.set('utm_term', utm_term);
    }
    if (utm_content && !url.searchParams.has('utm_content')) {
      url.searchParams.set('utm_content', utm_content);
    }
    
    return url.toString();
  } catch (error) {
    throw new Error('Invalid URL format');
  }
};

/**
 * Validate and sanitize URL
 */
const sanitizeUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    
    // Allow only HTTP/HTTPS protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol. Only HTTP and HTTPS are allowed.');
    }
    
    return parsedUrl.toString();
  } catch (error) {
    throw new Error('Invalid URL format');
  }
};

/**
 * Calculate unique click rate
 */
const calculateUniqueRate = (totalClicks, uniqueClicks) => {
  if (totalClicks === 0) return 0;
  return ((uniqueClicks / totalClicks) * 100).toFixed(2);
};

/**
 * Format date for display
 */
const formatDate = (date, format = 'standard') => {
  const d = new Date(date);
  
  if (format === 'standard') {
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  if (format === 'full') {
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  return d.toISOString().split('T')[0];
};

/**
 * Generate CSV data from analytics
 */
const generateCSVData = (analyticsData) => {
  const headers = ['Date', 'Total Clicks', 'Unique Clicks'];
  const rows = analyticsData.timeline.map(day => [
    day.date,
    day.clicks,
    day.unique_clicks
  ]);
  
  return [headers, ...rows];
};

/**
 * Check if link is expired
 */
const isLinkExpired = (expiresAt) => {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
};

/**
 * Check if link has reached max clicks
 */
const hasReachedMaxClicks = (currentClicks, maxClicks) => {
  if (!maxClicks) return false;
  return currentClicks >= maxClicks;
};

module.exports = {
  generateTrackingId,
  formatUrlWithUTM,
  sanitizeUrl,
  calculateUniqueRate,
  formatDate,
  generateCSVData,
  isLinkExpired,
  hasReachedMaxClicks
};