-- Migration 011: Indexes, FK CASCADE rules, unique constraint
-- Audit findings: Domain 3 — Database Schema & Performance
--
-- Idempotent: all CREATE INDEX use IF NOT EXISTS; FK changes use
-- DROP CONSTRAINT IF EXISTS before re-adding. Safe to re-run.
--
-- ============================================================
-- PART 1: Missing Indexes
-- ============================================================

-- teams(org_id) — every executive dashboard calls WHERE org_id = $1
CREATE INDEX IF NOT EXISTS idx_teams_org
    ON teams(org_id);

-- responses(session_id) and (interaction_id) — pipeline measurement gathering
-- (applies to legacy responses table linked to sessions/interactions)
CREATE INDEX IF NOT EXISTS idx_responses_session
    ON responses(session_id);

CREATE INDEX IF NOT EXISTS idx_responses_interaction
    ON responses(interaction_id);

-- org_aggregates_weekly(team_id) — pipeline existence checks filter by team_id alone;
-- the existing (org_id, team_id, week_start) PK/index does not help here
CREATE INDEX IF NOT EXISTS idx_oaw_team
    ON org_aggregates_weekly(team_id);

-- org_aggregates_weekly(org_id, week_start DESC) — dashboard series queries
-- fetch the most-recent N weeks for an org; explicit DESC ordering helps
CREATE INDEX IF NOT EXISTS idx_oaw_org_week
    ON org_aggregates_weekly(org_id, week_start DESC);


-- ============================================================
-- PART 2: Unique Constraint — responses(session_id, interaction_id)
-- ============================================================
-- Prevents duplicate survey answers from network retries corrupting
-- the Bayesian parameter estimates.
CREATE UNIQUE INDEX IF NOT EXISTS idx_responses_unique_answer
    ON responses(session_id, interaction_id);


-- ============================================================
-- PART 3: ON DELETE CASCADE — primary FK chains
-- ============================================================
-- Pattern: DROP old NO ACTION constraint, re-add with CASCADE.
-- Analytical tables (org_aggregates_weekly, weekly_interpretations, etc.)
-- are left with NO ACTION / RESTRICT to protect historical data.

-- ── Org-level cascade chain ───────────────────────────────────────────────────

-- teams → orgs (when org is offboarded, its teams are removed)
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_org_id_fkey;
ALTER TABLE teams
    ADD CONSTRAINT teams_org_id_fkey
    FOREIGN KEY (org_id) REFERENCES orgs(org_id) ON DELETE CASCADE;

-- alerts → orgs (org-scoped alerts go with the org)
ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_org_id_fkey;
ALTER TABLE alerts
    ADD CONSTRAINT alerts_org_id_fkey
    FOREIGN KEY (org_id) REFERENCES orgs(org_id) ON DELETE CASCADE;

-- pipeline_jobs → orgs (pipeline jobs are org-scoped)
ALTER TABLE pipeline_jobs DROP CONSTRAINT IF EXISTS pipeline_jobs_org_id_fkey;
ALTER TABLE pipeline_jobs
    ADD CONSTRAINT pipeline_jobs_org_id_fkey
    FOREIGN KEY (org_id) REFERENCES orgs(org_id) ON DELETE CASCADE;

-- invitations → orgs (invitations belong to an org)
ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_org_id_fkey;
ALTER TABLE invitations
    ADD CONSTRAINT invitations_org_id_fkey
    FOREIGN KEY (org_id) REFERENCES orgs(org_id) ON DELETE CASCADE;

-- ── Measurement session cascade chain ────────────────────────────────────────

-- measurement_sessions → orgs/teams/users (session is org+team+user scoped)
ALTER TABLE measurement_sessions DROP CONSTRAINT IF EXISTS measurement_sessions_org_id_fkey;
ALTER TABLE measurement_sessions
    ADD CONSTRAINT measurement_sessions_org_id_fkey
    FOREIGN KEY (org_id) REFERENCES orgs(org_id) ON DELETE CASCADE;

ALTER TABLE measurement_sessions DROP CONSTRAINT IF EXISTS measurement_sessions_team_id_fkey;
ALTER TABLE measurement_sessions
    ADD CONSTRAINT measurement_sessions_team_id_fkey
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE;

ALTER TABLE measurement_sessions DROP CONSTRAINT IF EXISTS measurement_sessions_user_id_fkey;
ALTER TABLE measurement_sessions
    ADD CONSTRAINT measurement_sessions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- measurement_responses → measurement_sessions and users
ALTER TABLE measurement_responses DROP CONSTRAINT IF EXISTS measurement_responses_session_id_fkey;
ALTER TABLE measurement_responses
    ADD CONSTRAINT measurement_responses_session_id_fkey
    FOREIGN KEY (session_id) REFERENCES measurement_sessions(session_id) ON DELETE CASCADE;

ALTER TABLE measurement_responses DROP CONSTRAINT IF EXISTS measurement_responses_user_id_fkey;
ALTER TABLE measurement_responses
    ADD CONSTRAINT measurement_responses_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- measurement_quality → measurement_sessions
ALTER TABLE measurement_quality DROP CONSTRAINT IF EXISTS measurement_quality_session_id_fkey;
ALTER TABLE measurement_quality
    ADD CONSTRAINT measurement_quality_session_id_fkey
    FOREIGN KEY (session_id) REFERENCES measurement_sessions(session_id) ON DELETE CASCADE;

-- ── Legacy session/response cascade chain ─────────────────────────────────────

-- sessions → users (auth-style sessions; user deleted → sessions deleted)
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;
ALTER TABLE sessions
    ADD CONSTRAINT sessions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- responses → sessions (response goes with its session)
ALTER TABLE responses DROP CONSTRAINT IF EXISTS responses_session_id_fkey;
ALTER TABLE responses
    ADD CONSTRAINT responses_session_id_fkey
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE;

-- encoded_signals → responses
ALTER TABLE encoded_signals DROP CONSTRAINT IF EXISTS encoded_signals_response_id_fkey;
ALTER TABLE encoded_signals
    ADD CONSTRAINT encoded_signals_response_id_fkey
    FOREIGN KEY (response_id) REFERENCES responses(response_id) ON DELETE CASCADE;

-- ── User-level cascade chain ─────────────────────────────────────────────────

-- latent_states and history → users
ALTER TABLE latent_states DROP CONSTRAINT IF EXISTS latent_states_user_id_fkey;
ALTER TABLE latent_states
    ADD CONSTRAINT latent_states_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

ALTER TABLE latent_states_history DROP CONSTRAINT IF EXISTS latent_states_history_user_id_fkey;
ALTER TABLE latent_states_history
    ADD CONSTRAINT latent_states_history_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- private_feedback → users
ALTER TABLE private_feedback DROP CONSTRAINT IF EXISTS private_feedback_user_id_fkey;
ALTER TABLE private_feedback
    ADD CONSTRAINT private_feedback_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- employee_profiles → users (user-level analytical: follows user deletion)
ALTER TABLE employee_profiles DROP CONSTRAINT IF EXISTS employee_profiles_user_id_fkey;
ALTER TABLE employee_profiles
    ADD CONSTRAINT employee_profiles_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- ── Team-level feedback cascade ──────────────────────────────────────────────

-- feedback_authors → teams
ALTER TABLE feedback_authors DROP CONSTRAINT IF EXISTS feedback_authors_team_id_fkey;
ALTER TABLE feedback_authors
    ADD CONSTRAINT feedback_authors_team_id_fkey
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE;

-- ── SET NULL — parent can be removed, child row survives with null reference ──

-- users.org_id and users.team_id: user identity survives org/team deletion
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_org_id_fkey;
ALTER TABLE users
    ADD CONSTRAINT users_org_id_fkey
    FOREIGN KEY (org_id) REFERENCES orgs(org_id) ON DELETE SET NULL;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_team_id_fkey;
ALTER TABLE users
    ADD CONSTRAINT users_team_id_fkey
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE SET NULL;

-- invitations: keep the invitation record when team/user is removed
ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_team_id_fkey;
ALTER TABLE invitations
    ADD CONSTRAINT invitations_team_id_fkey
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE SET NULL;

ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_accepted_by_user_id_fkey;
ALTER TABLE invitations
    ADD CONSTRAINT invitations_accepted_by_user_id_fkey
    FOREIGN KEY (accepted_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL;

-- pipeline_jobs: retain job record when team is removed
ALTER TABLE pipeline_jobs DROP CONSTRAINT IF EXISTS pipeline_jobs_team_id_fkey;
ALTER TABLE pipeline_jobs
    ADD CONSTRAINT pipeline_jobs_team_id_fkey
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE SET NULL;

-- ── memberships: add missing FK constraints ───────────────────────────────────
-- memberships had NO FK constraints in the live DB. Adding them now.
-- First, purge any orphaned rows that would fail the FK checks (stale test data).
DELETE FROM memberships
    WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.user_id = memberships.user_id);
DELETE FROM memberships
    WHERE NOT EXISTS (SELECT 1 FROM orgs o WHERE o.org_id = memberships.org_id);
-- NOT VALID skips backfill scan on remaining rows; VALIDATE confirms consistency.

ALTER TABLE memberships DROP CONSTRAINT IF EXISTS memberships_user_id_fkey;
ALTER TABLE memberships
    ADD CONSTRAINT memberships_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE NOT VALID;
ALTER TABLE memberships VALIDATE CONSTRAINT memberships_user_id_fkey;

ALTER TABLE memberships DROP CONSTRAINT IF EXISTS memberships_org_id_fkey;
ALTER TABLE memberships
    ADD CONSTRAINT memberships_org_id_fkey
    FOREIGN KEY (org_id) REFERENCES orgs(org_id) ON DELETE CASCADE NOT VALID;
ALTER TABLE memberships VALIDATE CONSTRAINT memberships_org_id_fkey;

ALTER TABLE memberships DROP CONSTRAINT IF EXISTS memberships_team_id_fkey;
ALTER TABLE memberships
    ADD CONSTRAINT memberships_team_id_fkey
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE SET NULL NOT VALID;
ALTER TABLE memberships VALIDATE CONSTRAINT memberships_team_id_fkey;
