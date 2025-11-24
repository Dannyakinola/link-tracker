const { supabase } = require('../services/supabase');
const { calculateUniqueRate, formatDate } = require('../utils/helpers');

const analyticsController = {
  // Get dashboard analytics
  getDashboard: async (req, res) => {
    try {
      const { period = '7d' } = req.query;

      // Get user's links
      const { data: links, error: linksError } = await supabase
        .from('tracked_links')
        .select('id, campaign_name, total_clicks, unique_clicks')
        .eq('user_id', req.user.id);

      if (linksError) throw linksError;

      const linkIds = links.map(link => link.id);

      if (linkIds.length === 0) {
        return res.json({
          success: true,
          data: {
            summary: { 
              active_links: 0, 
              total_clicks: 0, 
              unique_visitors: 0, 
              unique_rate: 0 
            },
            timeline: [],
            devices: [],
            countries: [],
            campaigns: [],
            sources: []
          }
        });
      }

      // Calculate date range based on period
      const dateRange = getDateRange(period);
      
      // Get clicks data for the period
      const { data: clicksData, error: clicksError } = await supabase
        .from('link_clicks')
        .select('*')
        .in('link_id', linkIds)
        .gte('clicked_at', dateRange.start)
        .lte('clicked_at', dateRange.end);

      if (clicksError) throw clicksError;

      // Process data
      const processedData = processAnalyticsData(links, clicksData || [], period);

      res.json({
        success: true,
        data: processedData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get analytics for specific link
  getLinkAnalytics: async (req, res) => {
    try {
      const { linkId } = req.params;
      const { period = '7d' } = req.query;

      // Verify link belongs to user
      const { data: link, error: linkError } = await supabase
        .from('tracked_links')
        .select('id')
        .eq('id', linkId)
        .eq('user_id', req.user.id)
        .single();

      if (linkError || !link) {
        return res.status(404).json({
          success: false,
          error: 'Link not found'
        });
      }

      const dateRange = getDateRange(period);

      // Get clicks for this link
      const { data: clicksData, error: clicksError } = await supabase
        .from('link_clicks')
        .select('*')
        .eq('link_id', linkId)
        .gte('clicked_at', dateRange.start)
        .lte('clicked_at', dateRange.end);

      if (clicksError) throw clicksError;

      const processedData = processLinkAnalyticsData(clicksData || [], period);

      res.json({
        success: true,
        data: processedData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Export analytics data
  exportData: async (req, res) => {
    try {
      const { format = 'json', start_date, end_date, link_id } = req.query;

      let query = supabase
        .from('link_clicks')
        .select(`
          *,
          tracked_links (
            campaign_name,
            original_url
          )
        `)
        .eq('tracked_links.user_id', req.user.id);

      if (link_id) {
        query = query.eq('link_id', link_id);
      }

      if (start_date) {
        query = query.gte('clicked_at', start_date);
      }

      if (end_date) {
        query = query.lte('clicked_at', end_date);
      }

      const { data: clicksData, error } = await query;

      if (error) throw error;

      if (format === 'csv') {
        const csv = convertToCSV(clicksData || []);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=analytics.csv');
        return res.send(csv);
      }

      res.json({
        success: true,
        data: clicksData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

// Helper functions
function getDateRange(period) {
  const now = new Date();
  const start = new Date();

  switch (period) {
    case '1d':
      start.setDate(now.getDate() - 1);
      break;
    case '7d':
      start.setDate(now.getDate() - 7);
      break;
    case '30d':
      start.setDate(now.getDate() - 30);
      break;
    case '90d':
      start.setDate(now.getDate() - 90);
      break;
    default:
      start.setDate(now.getDate() - 7);
  }

  return {
    start: start.toISOString(),
    end: now.toISOString()
  };
}

function processAnalyticsData(links, clicksData, period) {
  const totalClicks = clicksData.length;
  const uniqueClicks = clicksData.filter(click => click.is_unique).length;
  const activeLinks = links.length;

  // Timeline data
  const timelineData = processTimelineData(clicksData, period);

  // Device data
  const deviceData = processDeviceData(clicksData);

  // Country data
  const countryData = processCountryData(clicksData);

  // Source data
  const sourceData = processSourceData(clicksData);

  // Campaign data
  const campaignData = links.map(link => ({
    campaign: link.campaign_name || 'Uncategorized',
    clicks: link.total_clicks || 0,
    unique_clicks: link.unique_clicks || 0
  })).sort((a, b) => b.clicks - a.clicks);

  return {
    summary: {
      active_links: activeLinks,
      total_clicks: totalClicks,
      unique_visitors: uniqueClicks,
      unique_rate: calculateUniqueRate(totalClicks, uniqueClicks)
    },
    timeline: timelineData,
    devices: deviceData,
    countries: countryData,
    sources: sourceData,
    campaigns: campaignData
  };
}

function processLinkAnalyticsData(clicksData, period) {
  const totalClicks = clicksData.length;
  const uniqueClicks = clicksData.filter(click => click.is_unique).length;

  return {
    summary: {
      total_clicks: totalClicks,
      unique_clicks: uniqueClicks,
      unique_rate: calculateUniqueRate(totalClicks, uniqueClicks)
    },
    timeline: processTimelineData(clicksData, period),
    devices: processDeviceData(clicksData),
    countries: processCountryData(clicksData),
    sources: processSourceData(clicksData)
  };
}

function processTimelineData(clicksData, period) {
  const dailyData = {};
  
  clicksData.forEach(click => {
    const date = click.clicked_at.split('T')[0];
    if (!dailyData[date]) {
      dailyData[date] = { clicks: 0, unique_clicks: 0 };
    }
    dailyData[date].clicks++;
    if (click.is_unique) {
      dailyData[date].unique_clicks++;
    }
  });

  return Object.entries(dailyData)
    .map(([date, stats]) => ({
      date,
      clicks: stats.clicks,
      unique_clicks: stats.unique_clicks
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function processDeviceData(clicksData) {
  const devices = {};
  clicksData.forEach(click => {
    const device = click.device_type || 'unknown';
    devices[device] = (devices[device] || 0) + 1;
  });

  return Object.entries(devices).map(([device_type, clicks]) => ({
    device_type,
    clicks,
    percentage: ((clicks / clicksData.length) * 100).toFixed(2)
  }));
}

function processCountryData(clicksData) {
  const countries = {};
  clicksData.forEach(click => {
    const country = click.country || 'Unknown';
    countries[country] = (countries[country] || 0) + 1;
  });

  return Object.entries(countries)
    .map(([country, clicks]) => ({ country, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);
}

function processSourceData(clicksData) {
  const sources = {};
  clicksData.forEach(click => {
    const source = click.referrer || 'Direct';
    sources[source] = (sources[source] || 0) + 1;
  });

  return Object.entries(sources)
    .map(([source, clicks]) => ({ source, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);
}

function convertToCSV(data) {
  const headers = ['Date', 'Link', 'Campaign', 'IP', 'Country', 'Device', 'Browser', 'Referrer', 'Unique'];
  const rows = data.map(click => [
    click.clicked_at,
    click.tracked_links?.original_url || '',
    click.tracked_links?.campaign_name || '',
    click.ip_address,
    click.country,
    click.device_type,
    click.browser,
    click.referrer,
    click.is_unique ? 'Yes' : 'No'
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

module.exports = analyticsController;