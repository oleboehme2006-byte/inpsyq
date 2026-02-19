-- Migration 009: Operations Infrastructure
-- Professionalization Plan Items 3.11, 3.13, 3.16

-- ============================================================================
-- 3.11: Pipeline Job Queue (DB-backed, no external dependency needed)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pipeline_jobs (
    job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES orgs(org_id),
    team_id UUID REFERENCES teams(team_id),
    job_type TEXT NOT NULL CHECK (job_type IN ('weekly_rollup', 'backfill', 'interpretation', 'org_rollup')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    priority INT DEFAULT 0,
    payload JSONB DEFAULT '{}',
    result JSONB,
    error_message TEXT,
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    locked_by TEXT, -- worker ID that claimed this job
    locked_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_status ON pipeline_jobs(status, priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_org ON pipeline_jobs(org_id);

-- ============================================================================
-- 3.16: Org Configuration (week start day, etc.)
-- ============================================================================
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}';
-- config stores: { week_start_day: 1, timezone: "Europe/Berlin", ... }
