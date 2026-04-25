-- Enable PostGIS extension for geospatial data types and functions
CREATE EXTENSION IF NOT EXISTS postgis;

-- Table for user accounts and role-based access control
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for responder organization contact information
CREATE TABLE IF NOT EXISTS responder_organizations (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    emails TEXT[],
    sms_numbers TEXT[],
    hotline TEXT,
    address TEXT,
    contact_name TEXT,
    website TEXT,
    response_area TEXT,
    response_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for system configuration and feature flags
CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value JSONB
);

-- Insert default AI summary feature flag
INSERT INTO system_config (key, value)
VALUES ('ai_summary_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update updated_at on responder_organizations table changes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'set_timestamp' AND tgrelid = 'responder_organizations'::regclass
  ) THEN
    CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON responder_organizations
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();
  END IF;
END;
$$;
