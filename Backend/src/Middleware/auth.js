const { supabase } = require('../services/supabase');

// Authenticate user using Supabase JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Check if user is active
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({
        success: false,
        error: 'User profile not found'
      });
    }

    // Add user to request
    req.user = {
      id: user.id,
      email: user.email,
      token: token
    };

    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Token verification failed'
    });
  }
};

// Optional authentication (for public routes)
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('id', user.id)
          .single();

        if (profile) {
          req.user = {
            id: user.id,
            email: user.email,
            token: token
          };
        }
      }
    } catch (error) {
      // Continue without user
    }
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth
};