-- Migration 010: Billing columns on orgs
-- Phase 12 Item 4: Subscription gating

ALTER TABLE orgs ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing';
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS plan_id TEXT DEFAULT 'free_trial';
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;
