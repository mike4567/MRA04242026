-- Migration: Add site_status configuration
-- This migration adds the site_status key to system_config for launch toggle functionality.
-- Default value is 'coming_soon' as specified in requirements.
--
-- NIST SP 800-218 Compliance: Configuration changes are documented and version controlled.

-- Insert site_status with default value of 'coming_soon'
-- Uses ON CONFLICT to avoid errors if the key already exists
INSERT INTO system_config (key, value) 
VALUES ('site_status', '"coming_soon"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Verify the insertion
SELECT key, value FROM system_config WHERE key = 'site_status';
