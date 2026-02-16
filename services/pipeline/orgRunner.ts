/**
 * ORG RUNNER — Organization Level Aggregation
 * 
 * Aggregates all Team data for a specific week into a single Organization view.
 * Populates `org_stats_weekly`.
 */

import { query } from '@/db/client';
import { weekStartISO as toWeekStartISO, getISOMondayUTC } from '@/lib/aggregation/week';
import { COMPUTE_VERSION } from './schema';

export async function runWeeklyOrgRollup(
    orgId: string,
    weekStart: Date
): Promise<void> {
    const weekStartStr = toWeekStartISO(getISOMondayUTC(weekStart));

    // 1. Fetch all team aggregates for this week
    const teamResults = await query(
        `SELECT indices, attribution, team_state
         FROM org_aggregates_weekly
         WHERE org_id = $1 AND week_start = $2::date`,
        [orgId, weekStartStr]
    );

    if (teamResults.rows.length === 0) {
        console.log(`[OrgRunner] No team data for org ${orgId} week ${weekStartStr}`);
        return;
    }

    const teamData = teamResults.rows.map(r => ({
        indices: r.indices as Record<string, number>,
        attribution: r.attribution as any[], // Systemic driver candidates
        state: r.team_state
    }));

    // 2. Aggregate Indices (Weighted by Team Size? simplified to Average for now)
    const indicesSum: Record<string, number> = {};
    const indicesCount: Record<string, number> = {};

    for (const team of teamData) {
        for (const [key, val] of Object.entries(team.indices)) {
            if (!indicesSum[key]) { indicesSum[key] = 0; indicesCount[key] = 0; }
            indicesSum[key] += val;
            indicesCount[key]++;
        }
    }

    const orgIndices: Record<string, { value: number; qualitative: string }> = {};
    for (const [key, sum] of Object.entries(indicesSum)) {
        const avg = sum / indicesCount[key];
        orgIndices[key] = {
            value: avg,
            qualitative: getQualitative(avg)
        };
    }

    // 3. Systemic Drivers (Drivers appearing in > 1 team)
    const driverCounts: Record<string, { count: number; sumScore: number }> = {};

    for (const team of teamData) {
        if (!team.attribution) continue;
        for (const attr of team.attribution) {
            // Internal drivers in attribution result?
            // attr has { internal: [{ driverFamily, contributionScore }] }
            if (attr.internal) {
                for (const d of attr.internal) {
                    const key = d.driverFamily;
                    if (!driverCounts[key]) driverCounts[key] = { count: 0, sumScore: 0 };
                    driverCounts[key].count++;
                    driverCounts[key].sumScore += d.contributionScore;
                }
            }
        }
    }

    const systemicDrivers = Object.entries(driverCounts)
        .filter(([_, stats]) => stats.count > 1) // Must affect at least 2 teams
        .map(([key, stats]) => ({
            driverFamily: key,
            affectedTeams: stats.count,
            aggregateImpact: stats.sumScore / teamData.length // Simple impact metric
        }))
        .sort((a, b) => b.aggregateImpact - a.aggregateImpact)
        .slice(0, 5);

    // 4. Build Series (History)
    // Fetch last 12 weeks of Org Stats to build series
    const historyResult = await query(
        `SELECT week_start, indices 
         FROM org_stats_weekly 
         WHERE org_id = $1 AND week_start < $2::date
         ORDER BY week_start DESC 
         LIMIT 11`,
        [orgId, weekStartStr]
    );

    const historyPoints = historyResult.rows.reverse().map(r => ({
        weekStart: toWeekStartISO(r.week_start),
        ...r.indices // { strain: { value }, ... } needs flattening?
        // orgIndices was { strain: { value, qualitative } }
    }));

    // Flatten history for series snapshot
    // SeriesPointSnapshot: { weekStart, strain, withdrawalRisk, ... } (numbers)
    const seriesPoints = historyPoints.map(p => {
        const pt: any = { weekStart: p.weekStart };
        // p has indices keys like 'strain': { value: 0.5 }
        // We need 'strain': 0.5
        for (const [k, v] of Object.entries(p)) {
            if (k === 'weekStart') continue;
            if (typeof v === 'object' && v !== null && 'value' in (v as any)) {
                pt[k] = (v as any).value;
            }
        }
        return pt;
    });

    // Add current week
    const currentPoint: any = { weekStart: weekStartStr };
    for (const [k, v] of Object.entries(orgIndices)) {
        currentPoint[k] = v.value;
    }
    seriesPoints.push(currentPoint);

    const seriesSnapshot = {
        weeks: seriesPoints.length,
        points: seriesPoints
    };

    // 4. Upsert Org Stats
    await query(
        `INSERT INTO org_stats_weekly
         (org_id, week_start, compute_version, indices, systemic_drivers, series, updated_at)
         VALUES ($1, $2::date, $3, $4, $5, $6, NOW())
         ON CONFLICT (org_id, week_start)
         DO UPDATE SET
           compute_version = $3,
           indices = $4,
           systemic_drivers = $5,
           series = $6,
           updated_at = NOW()`,
        [
            orgId,
            weekStartStr,
            COMPUTE_VERSION,
            JSON.stringify(orgIndices),
            JSON.stringify(systemicDrivers),
            JSON.stringify(seriesSnapshot)
        ]
    );
    console.log(`[OrgRunner] Upserted org stats for ${orgId} week ${weekStartStr}`);
}


function getQualitative(val: number): string {
    if (val >= 0.75) return 'Critical';
    if (val >= 0.5) return 'Elevated';
    if (val >= 0.25) return 'Moderate';
    return 'Low';
}
