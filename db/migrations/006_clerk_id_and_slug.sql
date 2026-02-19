-- Migration 006: Add clerk_id to users and slug to orgs
-- Part of Professionalization Plan Items 1.2 and 1.3

-- 1. Add clerk_id to users (nullable initially for backfill)
ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id) WHERE clerk_id IS NOT NULL;

-- 2. Add slug to orgs (nullable initially for backfill)
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_orgs_slug ON orgs(slug) WHERE slug IS NOT NULL;

-- 3. Add email to users (needed for Clerk sync lookups)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;
