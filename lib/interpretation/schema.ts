/**
 * INTERPRETATION SCHEMA — Database Migration
 * 
 * Table: weekly_interpretations
 * Append-only with is_active pointer.
 */

export const INTERPRETATION_SCHEMA_SQL = `
-- Weekly Interpretations (append-only, cached)
CREATE TABLE IF NOT EXISTS weekly_interpretations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES orgs(org_id),
    team_id UUID REFERENCES teams(team_id),  -- NULL = org-level
    week_start DATE NOT NULL,
    input_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    model_id TEXT NOT NULL,
    prompt_version TEXT NOT NULL,
    sections_json JSONB NOT NULL,
    sections_md TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Unique constraint: one row per org/team/week/hash
CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_interp_unique 
    ON weekly_interpretations(org_id, COALESCE(team_id, '00000000-0000-0000-0000-000000000000'::uuid), week_start, input_hash);

-- Active pointer: one active per org/team/week
CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_interp_active
    ON weekly_interpretations(org_id, COALESCE(team_id, '00000000-0000-0000-0000-000000000000'::uuid), week_start)
    WHERE is_active = true;

-- Query indexes
CREATE INDEX IF NOT EXISTS idx_weekly_interp_org ON weekly_interpretations(org_id);
CREATE INDEX IF NOT EXISTS idx_weekly_interp_team ON weekly_interpretations(team_id);
CREATE INDEX IF NOT EXISTS idx_weekly_interp_week ON weekly_interpretations(week_start);
`;
