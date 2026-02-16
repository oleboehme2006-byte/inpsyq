
-- Migration: Add Clerk ID to users table to link Clerk Identity to Internal User
-- Run this via psql or your preferred DB tool

-- 1. Add the column
ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_id TEXT UNIQUE;

-- 2. Index it for fast lookups during login/webhooks
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);

-- 3. (Optional) Backfill existing users with a placeholder to allow constraints if needed later
-- UPDATE users SET clerk_id = 'legacy_' || user_id WHERE clerk_id IS NULL;
