-- Migration 008: Data Integrity Improvements
-- Professionalization Plan Items 2.6, 2.8, 2.9

-- ============================================================================
-- 2.6: Latent States History (snapshot per week)
-- ============================================================================
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

-- ============================================================================
-- 2.8: Anonymity — feedback hash table  
-- ============================================================================
-- Decouple private_feedback from user_id via a one-way hash lookup
CREATE TABLE IF NOT EXISTS feedback_authors (
    feedback_hash TEXT PRIMARY KEY,
    team_id UUID REFERENCES teams(team_id),
    week_start DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_feedback_authors_team ON feedback_authors(team_id, week_start);

-- ============================================================================
-- 2.9: Signal Obsolescence — prompt/model versioning on encoded_signals
-- ============================================================================
ALTER TABLE encoded_signals ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
-- metadata stores: { model: "gpt-4o", prompt_v: "1.2", run_id: "..." }
