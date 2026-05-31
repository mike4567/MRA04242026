-- Migration: Update users table for NextAuth credentials authentication
-- This migration adds missing columns required by src/lib/auth.ts
-- Run this against your PostgreSQL database: psql -d nmfs-entanglement_db -f migration_users.sql

-- Add password_hash column for bcrypt hashed passwords
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add name column for user display name
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;

-- Add active column for soft delete functionality (defaults to true)
ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Add updated_at column for tracking changes
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger for updated_at on users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'set_timestamp_users' AND tgrelid = 'users'::regclass
  ) THEN
    CREATE TRIGGER set_timestamp_users
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();
  END IF;
END;
$$;

-- Insert default WCRResponder user
-- Password: WCRResponder7600! 
-- Bcrypt hash generated with 12 salt rounds
INSERT INTO users (id, email, password_hash, name, role, active, created_at, updated_at)
VALUES (
    gen_random_uuid()::text,
    'WCRResponder@noaa.gov',
    '$2b$12$HeA20cMhBHW1Cu1dwKwYJew/L1a2N5ejCjJHuGpsFKnXb545gA1oy',
    'WCR Responder',
    'ADMIN',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    active = EXCLUDED.active,
    updated_at = NOW();

-- Verify the migration
SELECT id, email, name, role, active, created_at FROM users WHERE email = 'WCRResponder@noaa.gov';
