-- Migration 007: Add is_active to memberships for granular deactivation
-- Part of Professionalization Plan Item 1.5

-- Add is_active to memberships (default true for backward compat)
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
