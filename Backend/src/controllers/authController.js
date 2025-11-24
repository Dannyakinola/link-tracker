const { supabase } = require('../services/supabase');
const { logSecurityEvent } = require('../utils/security');

const authController = {
  // Get current user
  getCurrentUser: async (req, res) => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(req.user.token);
      
      if (error || !user) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            ...profile
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const { full_name, avatar_url } = req.body;

      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name,
          avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', req.user.id)
        .select()
        .single();

      if (error) throw error;

      await logSecurityEvent(req.user.id, 'PROFILE_UPDATED', req.ip, req.get('User-Agent'));

      res.json({
        success: true,
        data: {
          user: data
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

module.exports = authController;