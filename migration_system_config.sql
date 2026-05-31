-- Migration: Add feature flag configuration keys
-- Date: May 31, 2026
-- Purpose: Add system configuration keys for AI summary, email, and SMS toggles

-- Insert default feature flags (all enabled by default)
-- Uses ON CONFLICT to avoid errors if keys already exist

INSERT INTO system_config (key, value)
VALUES ('ai_summary_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value)
VALUES ('email_notifications_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value)
VALUES ('sms_notifications_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Verify the configuration
SELECT key, value FROM system_config ORDER BY key;
