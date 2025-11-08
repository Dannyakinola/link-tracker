require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { nanoid } = require('nanoid');
const bcrypt = require('bcryptjs');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');
const { supabase, supabaseAdmin } = require('C:\Users\HP\Documents\Link tracker\Backend\src\Services\supabase.js');

const app = express();

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { success: false, error: 'Too many requests, please try again later.' }
});

app.use(limiter);

// Health check
app.get('/health', async (req, res) => {
    try {
        // Test database connection
        const { error } = await supabase.from('tracked_links').select('count').limit(1);
        
        if (error) throw error;
        
        res.json({ 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: 'Connected'
        });
    } catch (error) {
        res.status(503).json({ 
            status: 'ERROR', 
            error: error.message 
        });
    }
});

// Redirect endpoint (no auth required)
app.get('/r/:linkId', async (req, res) => {
    try {
        const { linkId } = req.params;
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');
        const referrer = req.get('Referer');

        // Get the link
        const { data: link, error } = await supabase
            .from('tracked_links')
            .select('*')
            .eq('id', linkId)
            .eq('is_active', true)
            .single();

        if (error || !link) {
            return res.status(404).send('Link not found or inactive');
        }

        // Check if expired
        if (link.expires_at && new Date(link.expires_at) < new Date()) {
            return res.status(410).send('Link has expired');
        }

        // Check max clicks
        if (link.max_clicks && link.total_clicks >= link.max_clicks) {
            return res.status(410).send('Link has reached maximum clicks');
        }

        // Check for password protection
        if (link.password_hash) {
            const authHeader = req.headers['authorization'];
            if (!authHeader || !authHeader.startsWith('Basic ')) {
                return res.status(401)
                    .set('WWW-Authenticate', 'Basic realm="Link Password"')
                    .send('Password required');
            }

            const base64Credentials = authHeader.split(' ')[1];
            const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
            const [_, password] = credentials.split(':');

            const validPassword = await bcrypt.compare(password, link.password_hash);
            if (!validPassword) {
                return res.status(401)
                    .set('WWW-Authenticate', 'Basic realm="Link Password"')
                    .send('Invalid password');
            }
        }

        // Check for unique click
        const { data: existingClick } = await supabase
            .from('link_clicks')
            .select('id')
            .eq('link_id', linkId)
            .eq('ip_address', ip)
            .eq('user_agent', userAgent)
            .limit(1)
            .single();

        const isUnique = !existingClick;

        // Parse user agent and geo location
        const parser = new UAParser(userAgent);
        const geo = geoip.lookup(ip);

        // Record click
        const { error: clickError } = await supabase
            .from('link_clicks')
            .insert({
                link_id: linkId,
                ip_address: ip,
                user_agent: userAgent,
                referrer: referrer,
                country: geo?.country,
                city: geo?.city,
                device_type: parser.getDevice().type || 'desktop',
                browser: parser.getBrowser().name,
                operating_system: parser.getOS().name,
                is_unique: isUnique
            });

        if (!clickError) {
            // Update click counts
            await supabase.rpc('increment_link_clicks', {
                link_id_param: linkId,
                is_unique_param: isUnique
            });
        }

        // Redirect to original URL
        res.redirect(link.original_url);
    } catch (error) {
        console.error('Redirect error:', error);
        res.status(500).send('Error processing redirect');
    }
});

// API Routes with Supabase Auth
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, error: 'Access token required' });
    }

    try {
        // Verify token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            return res.status(403).json({ success: false, error: 'Invalid token' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ success: false, error: 'Token verification failed' });
    }
};

// Create trackable link
app.post('/api/links', 
    authenticateToken,
    [
        body('original_url').isURL(),
        body('campaign_name').optional().isLength({ max: 255 }),
        body('expires_at').optional().isISO8601(),
        body('max_clicks').optional().isInt({ min: 1 }),
        body('password').optional().isLength({ min: 3 })
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

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

            const linkId = nanoid(10);
            let finalUrl = original_url;

            // Add UTM parameters if provided
            const urlObj = new URL(original_url);
            const utmParams = { utm_source, utm_medium, utm_campaign, utm_term, utm_content };
            
            Object.entries(utmParams).forEach(([key, value]) => {
                if (value) {
                    urlObj.searchParams.set(key, value);
                }
            });

            finalUrl = urlObj.toString();

            let passwordHash = null;
            if (password) {
                passwordHash = await bcrypt.hash(password, 10);
            }

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

            res.json({
                success: true,
                data: {
                    ...link,
                    trackable_url: trackableUrl,
                    has_password: !!password
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
);

// Get user's links
app.get('/api/links', authenticateToken, async (req, res) => {
    try {
        const { data: links, error } = await supabase
            .from('tracked_links')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: links
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get analytics for a link
app.get('/api/links/:linkId/analytics', authenticateToken, async (req, res) => {
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
            return res.status(404).json({ success: false, error: 'Link not found' });
        }

        const periodMap = {
            '1d': '1 day',
            '7d': '7 days',
            '30d': '30 days',
            '90d': '90 days'
        };

        const interval = periodMap[period] || '7 days';

        // Get analytics data
        const [
            clicksData,
            dailyClicks,
            devicesData,
            countriesData,
            sourcesData
        ] = await Promise.all([
            // Total clicks
            supabase
                .from('link_clicks')
                .select('id, is_unique')
                .eq('link_id', linkId),

            // Daily clicks
            supabase.rpc('get_daily_clicks', { 
                link_id: linkId, 
                days_interval: interval 
            }),

            // Device breakdown
            supabase
                .from('link_clicks')
                .select('device_type')
                .eq('link_id', linkId),

            // Country breakdown
            supabase
                .from('link_clicks')
                .select('country')
                .eq('link_id', linkId),

            // Referrer sources
            supabase
                .from('link_clicks')
                .select('referrer')
                .eq('link_id', linkId)
        ]);

        // Process data
        const totalClicks = clicksData.data?.length || 0;
        const uniqueClicks = clicksData.data?.filter(click => click.is_unique).length || 0;

        const devices = devicesData.data?.reduce((acc, click) => {
            const device = click.device_type || 'unknown';
            acc[device] = (acc[device] || 0) + 1;
            return acc;
        }, {});

        const countries = countriesData.data?.reduce((acc, click) => {
            const country = click.country || 'Unknown';
            acc[country] = (acc[country] || 0) + 1;
            return acc;
        }, {});

        const sources = sourcesData.data?.reduce((acc, click) => {
            const source = click.referrer || 'Direct';
            acc[source] = (acc[source] || 0) + 1;
            return acc;
        }, {});

        res.json({
            success: true,
            data: {
                summary: {
                    total_clicks: totalClicks,
                    unique_clicks: uniqueClicks,
                    unique_rate: totalClicks ? ((uniqueClicks / totalClicks) * 100).toFixed(2) : 0
                },
                daily_clicks: dailyClicks.data || [],
                devices: devices ? Object.entries(devices).map(([device, clicks]) => ({ device_type: device, clicks })) : [],
                countries: countries ? Object.entries(countries).map(([country, clicks]) => ({ country, clicks })) : [],
                sources: sources ? Object.entries(sources).map(([source, clicks]) => ({ source, clicks })) : []
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Dashboard analytics
app.get('/api/analytics/dashboard', authenticateToken, async (req, res) => {
    try {
        const { period = '7d' } = req.query;

        const { data: links, error: linksError } = await supabase
            .from('tracked_links')
            .select('id, campaign_name')
            .eq('user_id', req.user.id);

        if (linksError) throw linksError;

        const linkIds = links.map(link => link.id);

        // Get all analytics data
        const [
            clicksData,
            timelineData,
            devicesData,
            countriesData,
            campaignsData
        ] = await Promise.all([
            // All clicks for user's links
            supabase
                .from('link_clicks')
                .select('*')
                .in('link_id', linkIds),

            // Timeline data (using a stored function would be better)
            supabase
                .from('link_clicks')
                .select('clicked_at, is_unique')
                .in('link_id', linkIds)
                .gte('clicked_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),

            // Device data
            supabase
                .from('link_clicks')
                .select('device_type')
                .in('link_id', linkIds),

            // Country data
            supabase
                .from('link_clicks')
                .select('country')
                .in('link_id', linkIds),

            // Campaign data
            supabase
                .from('tracked_links')
                .select('campaign_name, total_clicks, unique_clicks')
                .eq('user_id', req.user.id)
        ]);

        // Process data for dashboard
        const totalClicks = clicksData.data?.length || 0;
        const uniqueClicks = clicksData.data?.filter(click => click.is_unique).length || 0;
        const activeLinks = links.length;

        res.json({
            success: true,
            data: {
                summary: {
                    active_links: activeLinks,
                    total_clicks: totalClicks,
                    unique_visitors: uniqueClicks,
                    unique_rate: totalClicks ? ((uniqueClicks / totalClicks) * 100).toFixed(2) : 0
                },
                timeline: timelineData.data ? processTimelineData(timelineData.data) : [],
                devices: devicesData.data ? processDeviceData(devicesData.data) : [],
                countries: countriesData.data ? processCountryData(countriesData.data) : [],
                campaigns: campaignsData.data ? processCampaignData(campaignsData.data) : []
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Helper functions for data processing
function processTimelineData(data) {
    const dailyData = {};
    data.forEach(click => {
        const date = click.clicked_at.split('T')[0];
        if (!dailyData[date]) {
            dailyData[date] = { clicks: 0, unique_clicks: 0 };
        }
        dailyData[date].clicks++;
        if (click.is_unique) {
            dailyData[date].unique_clicks++;
        }
    });

    return Object.entries(dailyData).map(([date, stats]) => ({
        date,
        clicks: stats.clicks,
        unique_clicks: stats.unique_clicks
    }));
}

function processDeviceData(data) {
    const devices = {};
    data.forEach(click => {
        const device = click.device_type || 'unknown';
        devices[device] = (devices[device] || 0) + 1;
    });

    return Object.entries(devices).map(([device_type, clicks]) => ({
        device_type,
        clicks,
        percentage: ((clicks / data.length) * 100).toFixed(2)
    }));
}

function processCountryData(data) {
    const countries = {};
    data.forEach(click => {
        const country = click.country || 'Unknown';
        countries[country] = (countries[country] || 0) + 1;
    });

    return Object.entries(countries)
        .map(([country, clicks]) => ({ country, clicks }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);
}

function processCampaignData(data) {
    return data.map(campaign => ({
        campaign: campaign.campaign_name || 'Uncategorized',
        clicks: campaign.total_clicks || 0,
        unique_clicks: campaign.unique_clicks || 0
    })).sort((a, b) => b.clicks - a.clicks);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Link tracking backend running on port ${PORT}`);
});