-- Migration: Add show_responder_info setting to system_config
-- This setting controls visibility of the Responder Network section on the /report page
-- Default is 'true' to show the complete responder profile

INSERT INTO system_config (key, value)
VALUES ('show_responder_info', 'true')
ON CONFLICT (key) DO NOTHING;
