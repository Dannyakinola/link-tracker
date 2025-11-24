const { supabase } = require('../services/supabase');
const { nanoid } = require('nanoid');
const { 
  formatUrlWithUTM, 
  sanitizeUrl, 
  generateTrackingId 
} = require('../utils/helpers');
const { hashPassword } = require('../utils/security');
const { logSecurityEvent } = require('../utils/security');

const linkController = {
  // Create a new trackable link
  createLink: async (req, res) => {
    try {
      const {
        original_url,
        campaign_name,
        expires_at,
        max_clicks,
        password,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_term,
        utm_content
      } = req.body;

      // Generate unique link ID
      const linkId = generateTrackingId();
      
      // Sanitize and format URL with UTM parameters
      const sanitizedUrl = sanitizeUrl(original_url);
      const finalUrl = formatUrlWithUTM(sanitizedUrl, {
        utm_source, utm_medium, utm_campaign, utm_term, utm_content
      });

      // Hash password if provided
      let passwordHash = null;
      if (password) {
        passwordHash = await hashPassword(password);
      }

      // Insert into database
      const { data: link, error } = await supabase
        .from('tracked_links')
        .insert({
          id: linkId,
          original_url: finalUrl,
          user_id: req.user.id,
          campaign_name,
          expires_at,
          max_clicks,
          password_hash: passwordHash,
          utm_source,
          utm_medium,
          utm_campaign,
          utm_term,
          utm_content
        })
        .select()
        .single();

      if (error) throw error;

      const trackableUrl = `${req.protocol}://${req.get('host')}/r/${linkId}`;

      await logSecurityEvent(req.user.id, 'LINK_CREATED', req.ip, req.get('User-Agent'), { linkId });

      res.json({
        success: true,
        data: {
          ...link,
          trackable_url: trackableUrl,
          has_password: !!password
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get all links for user
  getLinks: async (req, res) => {
    try {
      const { data: links, error } = await supabase
        .from('tracked_links')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Add trackable URLs
      const linksWithUrls = links.map(link => ({
        ...link,
        trackable_url: `${req.protocol}://${req.get('host')}/r/${link.id}`
      }));

      res.json({
        success: true,
        data: linksWithUrls
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get single link
  getLink: async (req, res) => {
    try {
      const { linkId } = req.params;

      const { data: link, error } = await supabase
        .from('tracked_links')
        .select('*')
        .eq('id', linkId)
        .eq('user_id', req.user.id)
        .single();

      if (error || !link) {
        return res.status(404).json({
          success: false,
          error: 'Link not found'
        });
      }

      const trackableUrl = `${req.protocol}://${req.get('host')}/r/${link.id}`;

      res.json({
        success: true,
        data: {
          ...link,
          trackable_url: trackableUrl
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Update link
  updateLink: async (req, res) => {
    try {
      const { linkId } = req.params;
      const updates = req.body;

      // Verify link belongs to user
      const { data: existingLink, error: verifyError } = await supabase
        .from('tracked_links')
        .select('id')
        .eq('id', linkId)
        .eq('user_id', req.user.id)
        .single();

      if (verifyError || !existingLink) {
        return res.status(404).json({
          success: false,
          error: 'Link not found'
        });
      }

      // Handle password update
      if (updates.password) {
        updates.password_hash = await hashPassword(updates.password);
        delete updates.password;
      }

      // Handle URL and UTM updates
      if (updates.original_url) {
        const sanitizedUrl = sanitizeUrl(updates.original_url);
        updates.original_url = formatUrlWithUTM(sanitizedUrl, {
          utm_source: updates.utm_source,
          utm_medium: updates.utm_medium,
          utm_campaign: updates.utm_campaign,
          utm_term: updates.utm_term,
          utm_content: updates.utm_content
        });
      }

      const { data: link, error } = await supabase
        .from('tracked_links')
        .update(updates)
        .eq('id', linkId)
        .select()
        .single();

      if (error) throw error;

      await logSecurityEvent(req.user.id, 'LINK_UPDATED', req.ip, req.get('User-Agent'), { linkId });

      res.json({
        success: true,
        data: link
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Delete link
  deleteLink: async (req, res) => {
    try {
      const { linkId } = req.params;

      // Verify link belongs to user
      const { data: existingLink, error: verifyError } = await supabase
        .from('tracked_links')
        .select('id')
        .eq('id', linkId)
        .eq('user_id', req.user.id)
        .single();

      if (verifyError || !existingLink) {
        return res.status(404).json({
          success: false,
          error: 'Link not found'
        });
      }

      const { error } = await supabase
        .from('tracked_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      await logSecurityEvent(req.user.id, 'LINK_DELETED', req.ip, req.get('User-Agent'), { linkId });

      res.json({
        success: true,
        message: 'Link deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

module.exports = linkController;