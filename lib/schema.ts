export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS orgs (
    org_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT,
    config JSONB DEFAULT '{}',
    k_threshold FLOAT DEFAULT 0.5
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orgs_slug ON orgs(slug) WHERE slug IS NOT NULL;

CREATE TABLE IF NOT EXISTS teams (
    team_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES orgs(org_id),
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id TEXT,
    email TEXT,
    org_id UUID REFERENCES orgs(org_id),
    team_id UUID REFERENCES teams(team_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tutorial_seen JSONB NOT NULL DEFAULT '{"executive":false,"teamlead":false,"employee":false,"admin":false}'
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS tutorial_seen JSONB NOT NULL DEFAULT '{"executive":false,"teamlead":false,"employee":false,"admin":false}';
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id) WHERE clerk_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS interactions (
    interaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- 'reflection', 'rating', etc.
    prompt_text TEXT NOT NULL,
    parameter_targets TEXT[], -- stored as array of strings
    expected_signal_strength FLOAT,
    cooldown_days INT DEFAULT 7
);

CREATE TABLE IF NOT EXISTS sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INT
);

CREATE TABLE IF NOT EXISTS responses (
    response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(session_id),
    interaction_id UUID REFERENCES interactions(interaction_id),
    raw_input TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS encoded_signals (
    response_id UUID REFERENCES responses(response_id),
    signals JSONB, -- { "<parameter>": 0.0–1.0 }
    uncertainty JSONB, -- { "<parameter>": 0.05–0.35 }
    confidence FLOAT,
    flags JSONB, -- { "too_short": false, ... }
    topics TEXT[],
    metadata JSONB DEFAULT '{}', -- { model, prompt_v, run_id }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS latent_states (
    user_id UUID REFERENCES users(user_id),
    parameter TEXT NOT NULL,
    mean FLOAT NOT NULL,
    variance FLOAT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, parameter)
);

CREATE TABLE IF NOT EXISTS latent_states_history (
    user_id UUID REFERENCES users(user_id),
    week_start DATE NOT NULL,
    parameter TEXT NOT NULL,
    mean FLOAT NOT NULL,
    variance FLOAT NOT NULL,
    snapshot_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, week_start, parameter)
);
CREATE INDEX IF NOT EXISTS idx_lsh_user_week ON latent_states_history(user_id, week_start);

CREATE TABLE IF NOT EXISTS org_aggregates_weekly (
    org_id UUID REFERENCES orgs(org_id),
    team_id UUID REFERENCES teams(team_id),
    week_start DATE NOT NULL,
    parameter_means JSONB,
    parameter_uncertainty JSONB,
    indices JSONB,
    contributions_breakdown JSONB,
    PRIMARY KEY (org_id, team_id, week_start)
);

CREATE TABLE IF NOT EXISTS org_profiles_weekly (
    org_id UUID REFERENCES orgs(org_id),
    team_id UUID REFERENCES teams(team_id),
    week_start DATE NOT NULL,
    profile_type TEXT NOT NULL, -- 'WRP', 'OUC', 'TFP'
    activation_score FLOAT,
    confidence FLOAT
);

CREATE TABLE IF NOT EXISTS private_feedback (
    user_id UUID REFERENCES users(user_id),
    week_start DATE NOT NULL,
    content TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS employee_profiles (
    user_id UUID REFERENCES users(user_id),
    org_id UUID REFERENCES orgs(org_id),
    team_id UUID REFERENCES teams(team_id),
    week_start DATE NOT NULL,
    parameter_means JSONB, -- 10 dimensions
    parameter_uncertainty JSONB,
    profile_type_scores JSONB, -- { WRP: number, OUC: number, TFP: number }
    confidence FLOAT,
    private_recommendation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, week_start)
);

CREATE TABLE IF NOT EXISTS memberships (
    membership_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    org_id UUID NOT NULL REFERENCES orgs(org_id),
    team_id UUID REFERENCES teams(team_id),
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'EXECUTIVE', 'TEAMLEAD', 'EMPLOYEE')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, org_id)
);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_org ON memberships(org_id);

CREATE TABLE IF NOT EXISTS alerts (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES orgs(org_id),
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL, -- 'critical', 'warning', 'info'
    message TEXT NOT NULL,
    target_week_start DATE,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS audit_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    team_id UUID,
    event_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_org_type ON audit_events(org_id, event_type);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_events(created_at);
CREATE TABLE IF NOT EXISTS org_stats_weekly (
    org_id UUID REFERENCES orgs(org_id),
    week_start DATE NOT NULL,
    strain_score FLOAT,
    withdrawal_score FLOAT,
    trust_score FLOAT,
    engagement_score FLOAT,
    team_status_distribution JSONB,
    total_teams INT,
    total_respondents INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (org_id, week_start)
);
CREATE INDEX IF NOT EXISTS idx_org_stats_week ON org_stats_weekly(week_start);
`;
