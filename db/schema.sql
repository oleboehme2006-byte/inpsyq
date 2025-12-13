CREATE TABLE IF NOT EXISTS orgs (
    org_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    k_threshold FLOAT DEFAULT 0.5
);

CREATE TABLE IF NOT EXISTS teams (
    team_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES orgs(org_id),
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES orgs(org_id),
    team_id UUID REFERENCES teams(team_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Ensure column exists if table was already created
ALTER TABLE org_aggregates_weekly ADD COLUMN IF NOT EXISTS contributions_breakdown JSONB;


