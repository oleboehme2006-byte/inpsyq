/**
 * MEASUREMENT SCHEMA — Database Tables for Measurement System
 * 
 * Tables:
 * - measurement_sessions
 * - measurement_responses
 * - measurement_quality
 */

export const MEASUREMENT_SCHEMA_SQL = `
-- Measurement Sessions
CREATE TABLE IF NOT EXISTS measurement_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    org_id UUID NOT NULL REFERENCES orgs(org_id),
    team_id UUID REFERENCES teams(team_id),
    week_start DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('INVITED', 'STARTED', 'COMPLETED', 'LOCKED')) DEFAULT 'INVITED',
    invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    locked_at TIMESTAMPTZ,
    UNIQUE (user_id, week_start)
);
CREATE INDEX IF NOT EXISTS idx_measurement_sessions_user ON measurement_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_measurement_sessions_status ON measurement_sessions(status);
CREATE INDEX IF NOT EXISTS idx_measurement_sessions_week ON measurement_sessions(week_start);

-- Measurement Responses (append-only)
CREATE TABLE IF NOT EXISTS measurement_responses (
    response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES measurement_sessions(session_id),
    user_id UUID NOT NULL REFERENCES users(user_id),
    item_id TEXT NOT NULL,
    numeric_value NUMERIC NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (session_id, item_id)
);
CREATE INDEX IF NOT EXISTS idx_measurement_responses_session ON measurement_responses(session_id);

-- Measurement Quality Metrics
CREATE TABLE IF NOT EXISTS measurement_quality (
    session_id UUID PRIMARY KEY REFERENCES measurement_sessions(session_id),
    completion_rate NUMERIC NOT NULL,
    response_time_ms INTEGER,
    missing_items INTEGER NOT NULL DEFAULT 0,
    confidence_proxy NUMERIC NOT NULL DEFAULT 0.5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;
