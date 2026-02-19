CREATE TABLE IF NOT EXISTS org_stats_weekly (
    org_id UUID REFERENCES orgs(org_id),
    week_start DATE NOT NULL,
    
    -- Aggregated Indices (Mean of Team Means, weighted by member count)
    strain_score FLOAT,
    withdrawal_score FLOAT,
    trust_score FLOAT,
    engagement_score FLOAT,

    -- Distribution (How many teams in each state)
    team_status_distribution JSONB, -- { "critical": 2, "at_risk": 3, "healthy": 5 }
    
    -- Metadata
    total_teams INT,
    total_respondents INT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    PRIMARY KEY (org_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_org_stats_week ON org_stats_weekly(week_start);
