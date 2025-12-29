
import { query } from '@/db/client';
import { getISOMondayUTC, weekStartISO } from '@/lib/aggregation/week';

export interface OrgHealthSnapshot {
    orgId: string;
    weekStart: string; // The target week being observed
    lastUpdatedAt: string;

    // Coverage
    teamsTotal: number;
    teamsWithProducts: number;
    teamsWithInterpretation: number;

    // Status Counts
    teamsOk: number;
    teamsDegraded: number;
    teamsFailed: number;

    // Operational Issues
    missingProducts: number;
    missingInterpretations: number;
    locksStuck: number;
    recentFailures: number;
}

export interface GlobalHealthSnapshot {
    weekStart: string;
    totalOrgs: number;
    totalTeams: number;
    totalOk: number;
    totalDegraded: number;
    totalFailed: number;
    globalIssues: {
        missingProducts: number;
        missingInterpretations: number;
        locksStuck: number;
    };
}

/**
 * Get health snapshot for a specific org and week.
 * "Current week" usually means the most recent completed week (last Monday).
 */
export async function getOrgHealthSnapshot(
    orgId: string,
    weekOffset: number = 0
): Promise<OrgHealthSnapshot> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - (7 * weekOffset));
    const targetWeek = weekStartISO(getISOMondayUTC(targetDate)); // e.g., '2023-10-23'

    // 1. Get all teams for org
    const teamsRes = await query(`SELECT team_id FROM teams WHERE org_id = $1`, [orgId]);
    const teamIds = teamsRes.rows.map(r => r.team_id as string);
    const teamsTotal = teamIds.length;

    if (teamsTotal === 0) {
        return {
            orgId,
            weekStart: targetWeek,
            lastUpdatedAt: new Date().toISOString(),
            teamsTotal: 0,
            teamsWithProducts: 0,
            teamsWithInterpretation: 0,
            teamsOk: 0,
            teamsDegraded: 0,
            teamsFailed: 0,
            missingProducts: 0,
            missingInterpretations: 0,
            locksStuck: 0,
            recentFailures: 0
        };
    }

    // 2. Check Products (org_aggregates_weekly)
    const productRes = await query(`
        SELECT team_id FROM org_aggregates_weekly 
        WHERE org_id = $1 AND week_start = $2
    `, [orgId, targetWeek]);
    const productTeamIds = new Set(productRes.rows.map(r => r.team_id));

    // 3. Check Interpretations (weekly_interpretations)
    // Only count active ones
    const interpRes = await query(`
        SELECT team_id FROM weekly_interpretations
        WHERE org_id = $1 AND week_start = $2 AND is_active = true
    `, [orgId, targetWeek]);
    const interpTeamIds = new Set(interpRes.rows.map(r => r.team_id));

    // 4. Check Locks (Stuck > 30 mins)
    // weekly_locks table uses `lock_key` (e.g. "org:team:week" or similar)
    // We assume key starts with orgId.
    const lockRes = await query(`
        SELECT lock_key FROM weekly_locks
        WHERE lock_key LIKE $1 
          AND status = 'ACQUIRED'
          AND acquired_at < NOW() - INTERVAL '30 minutes'
    `, [`${orgId}:%`]);

    const stuckLockTeams = new Set<string>();
    for (const r of lockRes.rows) {
        // failed attempts to parse might occur if key format differs
        const parts = (r.lock_key as string).split(':');
        if (parts.length >= 2) {
            stuckLockTeams.add(parts[1]); // Assuming orgId:teamId:week
        }
    }

    // 5. Check Recent Failures (Audit Events last 24h relating to this org)
    // event_type LIKE 'WEEKLY_RUN_FAILED%'
    const failRes = await query(`
        SELECT COUNT(*) as count FROM audit_events
        WHERE org_id = $1 
        AND event_type LIKE 'WEEKLY_RUN_FAILED%'
        AND created_at > NOW() - INTERVAL '24 hours'
    `, [orgId]);
    const recentFailures = parseInt(failRes.rows[0].count || '0', 10);

    // Aggregation
    let teamsOk = 0;
    let teamsDegraded = 0;
    let teamsFailed = 0;

    let missingProducts = 0;
    let missingInterpretations = 0;

    for (const tid of teamIds) {
        const hasProduct = productTeamIds.has(tid);
        const hasInterp = interpTeamIds.has(tid);
        const isLocked = stuckLockTeams.has(tid);

        if (hasProduct && hasInterp) {
            teamsOk++;
        } else if (hasProduct && !hasInterp) {
            // Product exists, but interpretation missing -> Degraded
            teamsDegraded++;
            missingInterpretations++;
        } else {
            // No product -> Failed (or just waiting)
            // If it's the current week and we haven't run yet, it might be OK.
            // But for "Operational Health", gap = failed/pending.
            teamsFailed++;
            missingProducts++;
        }
    }

    return {
        orgId,
        weekStart: targetWeek,
        lastUpdatedAt: new Date().toISOString(),
        teamsTotal,
        teamsWithProducts: productTeamIds.size,
        teamsWithInterpretation: interpTeamIds.size,
        teamsOk,
        teamsDegraded,
        teamsFailed,
        missingProducts,
        missingInterpretations,
        locksStuck: stuckLockTeams.size,
        recentFailures
    };
}

/**
 * Get accurate global health snapshot aggregating all orgs.
 */
export async function getGlobalHealthSnapshot(weekOffset: number = 0): Promise<GlobalHealthSnapshot> {
    // Determine target week
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - (7 * weekOffset));
    const targetWeek = weekStartISO(getISOMondayUTC(targetDate));

    // Get all orgs
    const orgRes = await query(`SELECT org_id FROM orgs`);
    const orgs = orgRes.rows;

    let totalTeams = 0;
    let totalOk = 0;
    let totalDegraded = 0;
    let totalFailed = 0;
    const globalIssues = {
        missingProducts: 0,
        missingInterpretations: 0,
        locksStuck: 0
    };

    // Parallel aggregate (limited concurrency if needed, but for "internal admin" usage this is fine)
    // Or we could write a single massive query.
    // For simplicity and reuse:

    const snapshots = await Promise.all(orgs.map(o => getOrgHealthSnapshot(o.org_id, weekOffset)));

    for (const s of snapshots) {
        totalTeams += s.teamsTotal;
        totalOk += s.teamsOk;
        totalDegraded += s.teamsDegraded;
        totalFailed += s.teamsFailed;
        globalIssues.missingProducts += s.missingProducts;
        globalIssues.missingInterpretations += s.missingInterpretations;
        globalIssues.locksStuck += s.locksStuck;
    }

    return {
        weekStart: targetWeek,
        totalOrgs: orgs.length,
        totalTeams,
        totalOk,
        totalDegraded,
        totalFailed,
        globalIssues
    };
}
