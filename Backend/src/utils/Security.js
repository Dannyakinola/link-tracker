    const bcrypt = require('bcryptjs');
    const { supabase } = require('../services/supabase');

    /**
     * Hash password for link protection
     */
    const hashPassword = async (password) => {
    if (!password) return null;
    return await bcrypt.hash(password, 12);
    };

    /**
     * Verify password for protected links
     */
    const verifyPassword = async (password, hashedPassword) => {
    if (!password || !hashedPassword) return false;
    return await bcrypt.compare(password, hashedPassword);
    };

    /**
     * Log security event
     */
    const logSecurityEvent = async (userId, action, ip, userAgent, details = {}) => {
    try {
        const { error } = await supabase
        .from('security_logs')
        .insert({
            user_id: userId,
            action,
            ip_address: ip,
            user_agent: userAgent,
            details
        });

        if (error) {
        console.error('Failed to log security event:', error);
        }
    } catch (error) {
        console.error('Error logging security event:', error);
    }
    };

    /**
     * Sanitize user input to prevent XSS
     */
    const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    };

    /**
     * Validate and sanitize URL to prevent open redirects
     */
    const validateRedirectUrl = (url, allowedDomains = []) => {
    try {
        const parsedUrl = new URL(url);
        
        // Check if it's a valid HTTP/HTTPS URL
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return false;
        }
        
        // If allowed domains are specified, check against them
        if (allowedDomains.length > 0) {
        const domain = parsedUrl.hostname;
        if (!allowedDomains.includes(domain)) {
            return false;
        }
        }
        
        return true;
    } catch (error) {
        return false;
    }
    };

    /**
     * Rate limiting key generator based on IP and user agent
     */
    const rateLimitKeyGenerator = (req) => {
    return `${req.ip}-${req.get('User-Agent')}`;
    };

    /**
     * Check for suspicious activity patterns
     */
    const detectSuspiciousActivity = (clicks, timeWindow = 3600000) => { // 1 hour
    const now = Date.now();
    const recentClicks = clicks.filter(click => 
        now - new Date(click.clicked_at).getTime() < timeWindow
    );
    
    // More than 100 clicks from same IP in 1 hour is suspicious
    if (recentClicks.length > 100) {
        return true;
    }
    
    // Check for click patterns that might indicate bots
    const uniqueUserAgents = new Set(recentClicks.map(click => click.user_agent));
    if (recentClicks.length > 50 && uniqueUserAgents.size === 1) {
        return true;
    }
    
    return false;
    };

    module.exports = {
    hashPassword,
    verifyPassword,
    logSecurityEvent,
    sanitizeInput,
    validateRedirectUrl,
    rateLimitKeyGenerator,
    detectSuspiciousActivity
    };