-- Migration: Add password_hash column to users table for NextAuth.js credential authentication
-- Author: NMFS West Coast Region - Marine Response Application
-- Date: 2026-04-27
-- Purpose: Enables local credential-based authentication, replacing Firebase Auth

-- Add password_hash column to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add updated_at column for tracking password changes
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger to update updated_at on user changes
CREATE OR REPLACE FUNCTION trigger_users_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'set_users_timestamp' AND tgrelid = 'users'::regclass
  ) THEN
    CREATE TRIGGER set_users_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_users_set_timestamp();
  END IF;
END;
$$;

-- Example: Create an admin user with a hashed password
-- Password: "admin123" (bcrypt hash with 10 rounds)
-- Generate new hashes using: node -e "console.log(require('bcryptjs').hashSync('yourpassword', 10))"
-- INSERT INTO users (id, email, password_hash, role) VALUES 
--   ('admin-001', 'admin@example.com', '$2a$10$...your_hash_here...', 'ADMIN')
-- ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;
