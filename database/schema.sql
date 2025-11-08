-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tracked links table
CREATE TABLE tracked_links (
    id VARCHAR(20) PRIMARY KEY,
    original_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    campaign_name VARCHAR(255),
    metadata JSONB,
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    utm_term VARCHAR(255),
    utm_content VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    max_clicks INTEGER,
    password_hash VARCHAR(255),
    total_clicks INTEGER DEFAULT 0,
    unique_clicks INTEGER DEFAULT 0
);

-- Link clicks table
CREATE TABLE link_clicks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    link_id VARCHAR(20) REFERENCES tracked_links(id) ON DELETE CASCADE,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    country VARCHAR(100),
    city VARCHAR(100),
    device_type VARCHAR(50),
    browser VARCHAR(100),
    operating_system VARCHAR(100),
    is_unique BOOLEAN DEFAULT true
);

-- Custom domains table
CREATE TABLE custom_domains (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    domain VARCHAR(255) UNIQUE NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Security logs table
CREATE TABLE security_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    details JSONB
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracked_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own links" ON tracked_links
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own clicks" ON link_clicks
    FOR SELECT USING (
        link_id IN (SELECT id FROM tracked_links WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can view own domains" ON custom_domains
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own security logs" ON security_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Allow public access for redirects (read-only for links)
CREATE POLICY "Public can view active links" ON tracked_links
    FOR SELECT USING (is_active = true);

-- Functions for analytics
CREATE OR REPLACE FUNCTION increment_link_clicks(link_id_param VARCHAR(20), is_unique_param BOOLEAN)
RETURNS VOID AS $$
BEGIN
    UPDATE tracked_links 
    SET total_clicks = total_clicks + 1,
        unique_clicks = CASE 
            WHEN is_unique_param THEN unique_clicks + 1 
            ELSE unique_clicks 
        END
    WHERE id = link_id_param;
END;
$$ LANGUAGE plpgsql;

-- Indexes for performance
CREATE INDEX idx_tracked_links_user_id ON tracked_links(user_id);
CREATE INDEX idx_tracked_links_created_at ON tracked_links(created_at);
CREATE INDEX idx_link_clicks_link_id ON link_clicks(link_id);
CREATE INDEX idx_link_clicks_clicked_at ON link_clicks(clicked_at);
CREATE INDEX idx_link_clicks_ip ON link_clicks(ip_address);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();