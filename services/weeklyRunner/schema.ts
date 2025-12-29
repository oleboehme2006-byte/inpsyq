/**
 * WEEKLY RUN AUDIT SCHEMA
 * 
 * Persistent audit logging for weekly runs.
 */

export const WEEKLY_RUNS_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS weekly_runs (
    run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_start DATE NOT NULL,
    week_label TEXT NOT NULL,
    scope TEXT NOT NULL,
    scope_id UUID,
    mode TEXT NOT NULL DEFAULT 'FULL',
    
    status TEXT NOT NULL,
    
    orgs_total INTEGER DEFAULT 0,
    orgs_success INTEGER DEFAULT 0,
    orgs_failed INTEGER DEFAULT 0,
    teams_total INTEGER DEFAULT 0,
    teams_success INTEGER DEFAULT 0,
    teams_failed INTEGER DEFAULT 0,
    pipeline_upserts INTEGER DEFAULT 0,
    pipeline_skips INTEGER DEFAULT 0,
    interpretation_generations INTEGER DEFAULT 0,
    interpretation_cache_hits INTEGER DEFAULT 0,
    
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    duration_ms INTEGER,
    
    error TEXT,
    details_json JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weekly_runs_week_start ON weekly_runs(week_start);
CREATE INDEX IF NOT EXISTS idx_weekly_runs_scope ON weekly_runs(scope, scope_id);
CREATE INDEX IF NOT EXISTS idx_weekly_runs_status ON weekly_runs(status);
`;

export const WEEKLY_LOCKS_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS weekly_locks (
    lock_key TEXT PRIMARY KEY,
    run_id UUID NOT NULL,
    acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE'
);

CREATE INDEX IF NOT EXISTS idx_weekly_locks_status ON weekly_locks(status);
CREATE INDEX IF NOT EXISTS idx_weekly_locks_expires ON weekly_locks(expires_at);
`;
