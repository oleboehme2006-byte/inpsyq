/**
 * SCHEMA MIGRATION — Pipeline V2 Columns
 * 
 * Adds new columns to org_aggregates_weekly for Phase 3+4 data.
 * Safe migration: uses IF NOT EXISTS.
 */

export const PIPELINE_MIGRATION_SQL = `
-- Add pipeline v2 columns to org_aggregates_weekly
ALTER TABLE org_aggregates_weekly ADD COLUMN IF NOT EXISTS compute_version TEXT;
ALTER TABLE org_aggregates_weekly ADD COLUMN IF NOT EXISTS input_hash TEXT;
ALTER TABLE org_aggregates_weekly ADD COLUMN IF NOT EXISTS team_state JSONB;
ALTER TABLE org_aggregates_weekly ADD COLUMN IF NOT EXISTS series JSONB;
ALTER TABLE org_aggregates_weekly ADD COLUMN IF NOT EXISTS attribution JSONB;
ALTER TABLE org_aggregates_weekly ADD COLUMN IF NOT EXISTS quality JSONB;
ALTER TABLE org_aggregates_weekly ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create org_stats_weekly for Executive Dashboard History
CREATE TABLE IF NOT EXISTS org_stats_weekly (
    org_id UUID REFERENCES orgs(org_id),
    week_start DATE NOT NULL,
    compute_version TEXT,
    indices JSONB, -- { strain: { value, qualitative }, ... }
    trends JSONB, -- { direction, volatility }
    series JSONB, -- History snapshot
    systemic_drivers JSONB, -- [{ driverFamily, impact, ... }]
    risk_distribution JSONB, -- { critical: N, atRisk: N, healthy: N }
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (org_id, week_start)
);
`;

/**
 * Current compute version for idempotency tracking.
 */
export const COMPUTE_VERSION = 'v2.0.0';
