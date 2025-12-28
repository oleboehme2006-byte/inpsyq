/**
 * DATA GATHERER — Gather Measurement Data for Pipeline
 * 
 * Collects per-user measurement data from sessions/latent_states for a specific week.
 */

import { query } from '@/db/client';
import { UserMeasurementSnapshot } from './types';
import { weekStartISO as toWeekStartISO, weeksBefore, weeksAfter } from '@/lib/aggregation/week';

// ============================================================================
// Types
// ============================================================================

interface GatheredData {
    userMeasurements: UserMeasurementSnapshot[];
    sessionCount: number;
    userCount: number;
}

// ============================================================================
// Main Gatherer
// ============================================================================

/**
 * Gather measurement data for a team for a specific week.
 * Uses latent_states as the source of truth for parameter values.
 */
export async function gatherTeamMeasurements(
    orgId: string,
    teamId: string,
    weekStart: Date
): Promise<GatheredData> {
    const weekStartStr = toWeekStartISO(weekStart);
    const weekEndStr = weeksAfter(weekStartStr, 1);

    // Get users in this team
    const usersResult = await query(
        `SELECT user_id FROM users WHERE org_id = $1 AND team_id = $2 AND is_active = true`,
        [orgId, teamId]
    );

    const userIds = usersResult.rows.map(r => r.user_id);
    if (userIds.length === 0) {
        return { userMeasurements: [], sessionCount: 0, userCount: 0 };
    }

    // Get session count for this week
    const sessionsResult = await query(
        `SELECT COUNT(*) as count, user_id
     FROM sessions s
     WHERE s.user_id = ANY($1)
       AND s.started_at >= $2::date
       AND s.started_at < $3::date
       AND s.completed_at IS NOT NULL
     GROUP BY s.user_id`,
        [userIds, weekStartStr, weekEndStr]
    );

    const sessionCountByUser: Record<string, number> = {};
    let totalSessions = 0;
    for (const row of sessionsResult.rows) {
        sessionCountByUser[row.user_id] = parseInt(row.count);
        totalSessions += parseInt(row.count);
    }

    // Get latent states for all users
    const latentResult = await query(
        `SELECT user_id, parameter, mean, variance
     FROM latent_states
     WHERE user_id = ANY($1)`,
        [userIds]
    );

    // Group by user
    const userStates: Record<string, { means: Record<string, number>; variances: Record<string, number> }> = {};
    for (const row of latentResult.rows) {
        if (!userStates[row.user_id]) {
            userStates[row.user_id] = { means: {}, variances: {} };
        }
        userStates[row.user_id].means[row.parameter] = parseFloat(row.mean);
        userStates[row.user_id].variances[row.parameter] = parseFloat(row.variance);
    }

    // Build user measurements
    const userMeasurements: UserMeasurementSnapshot[] = [];
    for (const userId of userIds) {
        const state = userStates[userId];
        const sessionCount = sessionCountByUser[userId] || 0;

        // Only include users with data
        if (state && Object.keys(state.means).length > 0) {
            userMeasurements.push({
                userId,
                parameterMeans: state.means,
                parameterVariance: state.variances,
                sessionCount,
            });
        }
    }

    return {
        userMeasurements,
        sessionCount: totalSessions,
        userCount: userMeasurements.length,
    };
}

/**
 * Discover weeks with session data for a team.
 */
export async function discoverWeeksWithData(
    orgId: string,
    teamId: string
): Promise<Date[]> {
    const result = await query(
        `SELECT DISTINCT date_trunc('week', s.started_at)::date as week_start
     FROM sessions s
     JOIN users u ON s.user_id = u.user_id
     WHERE u.org_id = $1 AND u.team_id = $2
       AND s.completed_at IS NOT NULL
     ORDER BY week_start ASC`,
        [orgId, teamId]
    );

    return result.rows.map(r => new Date(r.week_start));
}

/**
 * Get list of teams in an org.
 */
export async function getTeamsForOrg(orgId: string): Promise<string[]> {
    const result = await query(
        `SELECT team_id FROM teams WHERE org_id = $1`,
        [orgId]
    );
    return result.rows.map(r => r.team_id);
}

/**
 * Check if row exists and get its input hash.
 */
export async function getExistingRowHash(
    orgId: string,
    teamId: string,
    weekStart: Date
): Promise<string | null> {
    const weekStartStr = toWeekStartISO(weekStart);
    const result = await query(
        `SELECT input_hash FROM org_aggregates_weekly
     WHERE org_id = $1 AND team_id = $2 AND week_start = $3`,
        [orgId, teamId, weekStartStr]
    );

    if (result.rows.length === 0) return null;
    return result.rows[0].input_hash || null;
}
