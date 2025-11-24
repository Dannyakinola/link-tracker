const { supabase } = require('../services/supabase');

const securityController = {
  // Get security logs
  getSecurityLogs: async (req, res) => {
    try {
      const { page = 1, limit = 50, action } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('security_logs')
        .select('*', { count: 'exact' })
        .eq('user_id', req.user.id)
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (action) {
        query = query.eq('action', action);
      }

      const { data: logs, error, count } = await query;

      if (error) throw error;

      res.json({
        success: true,
        data: {
          logs: logs || [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count || 0,
            pages: Math.ceil((count || 0) / limit)
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

  // Get security overview
  getSecurityOverview: async (req, res) => {
    try {
      const { data: logs, error } = await supabase
        .from('security_logs')
        .select('action, timestamp')
        .eq('user_id', req.user.id)
        .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const actionCounts = {};
      const recentActions = logs?.slice(0, 10) || [];

      logs?.forEach(log => {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      });

      res.json({
        success: true,
        data: {
          overview: {
            total_events: logs?.length || 0,
            action_breakdown: actionCounts
          },
          recent_actions: recentActions
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

module.exports = securityController;