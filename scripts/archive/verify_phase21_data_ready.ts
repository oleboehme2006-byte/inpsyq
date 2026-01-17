/**
 * PHASE 21.B — Data Readiness Verification
 * 
 * Validates:
 * 1. Products exist for fixture teams for current week
 * 2. Interpretations exist for fixture teams for current week
 * 3. Prints summary table
 */

import './_bootstrap';
import { query } from '../db/client';
import { getCanonicalWeek } from '../lib/week';

const FIXTURE_ORG_ID = '11111111-1111-4111-8111-111111111111';
const FIXTURE_TEAMS = [
    { id: '22222222-2222-4222-8222-222222222201', name: 'Engineering' },
    { id: '22222222-2222-4222-8222-222222222202', name: 'Sales' },
];

interface TeamDataStatus {
    teamId: string;
    teamName: string;
    weekLabel: string;
    productRows: number;
    interpretationRows: number;
    status: 'OK' | 'MISSING_PRODUCTS' | 'MISSING_INTERPRETATIONS' | 'MISSING_BOTH';
}

async function checkDataForTeam(teamId: string, teamName: string, weekStart: string): Promise<TeamDataStatus> {
    // Check products
    const productResult = await query(
        `SELECT COUNT(*) as count FROM org_aggregates_weekly 
         WHERE org_id = $1 AND team_id = $2 AND week_start = $3`,
        [FIXTURE_ORG_ID, teamId, weekStart]
    );
    const productRows = parseInt(productResult.rows[0]?.count || '0');

    // Check interpretations
    const interpResult = await query(
        `SELECT COUNT(*) as count FROM weekly_interpretations 
         WHERE org_id = $1 AND team_id = $2 AND week_start = $3 AND is_active = true`,
        [FIXTURE_ORG_ID, teamId, weekStart]
    );
    const interpretationRows = parseInt(interpResult.rows[0]?.count || '0');

    let status: TeamDataStatus['status'] = 'OK';
    if (productRows === 0 && interpretationRows === 0) {
        status = 'MISSING_BOTH';
    } else if (productRows === 0) {
        status = 'MISSING_PRODUCTS';
    } else if (interpretationRows === 0) {
        status = 'MISSING_INTERPRETATIONS';
    }

    return {
        teamId,
        teamName,
        weekLabel: getCanonicalWeek(new Date(weekStart)).weekLabel,
        productRows,
        interpretationRows,
        status,
    };
}

async function getLatestWeekWithData(): Promise<string | null> {
    const result = await query(
        `SELECT DISTINCT week_start FROM org_aggregates_weekly 
         WHERE org_id = $1 
         ORDER BY week_start DESC LIMIT 1`,
        [FIXTURE_ORG_ID]
    );
    return result.rows[0]?.week_start || null;
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 21.B — Data Readiness Verification');
    console.log('═══════════════════════════════════════════════════════════════');

    const { weekStart: currentWeekStart, weekLabel: currentWeekLabel, weekStartStr } = getCanonicalWeek();
    console.log(`Current week: ${currentWeekLabel} (${weekStartStr})`);

    const latestDataWeek = await getLatestWeekWithData();
    if (latestDataWeek) {
        console.log(`Latest data week: ${getCanonicalWeek(new Date(latestDataWeek)).weekLabel} (${latestDataWeek})`);
    } else {
        console.log('Latest data week: NONE');
    }
    console.log('');

    // Check current week first
    const weekToCheck = weekStartStr;

    console.log('┌────────────────────┬────────────┬──────────┬───────────────┬────────────────────┐');
    console.log('│ Team               │ Week       │ Products │ Interpretations│ Status            │');
    console.log('├────────────────────┼────────────┼──────────┼───────────────┼────────────────────┤');

    const results: TeamDataStatus[] = [];
    for (const team of FIXTURE_TEAMS) {
        const status = await checkDataForTeam(team.id, team.name, weekToCheck);
        results.push(status);

        const statusIcon = status.status === 'OK' ? '\x1b[32m✓ OK\x1b[0m' : `\x1b[31m✗ ${status.status}\x1b[0m`;
        console.log(`│ ${status.teamName.padEnd(18)} │ ${status.weekLabel.padEnd(10)} │ ${String(status.productRows).padStart(8)} │ ${String(status.interpretationRows).padStart(13)} │ ${statusIcon.padEnd(30)} │`);
    }

    console.log('└────────────────────┴────────────┴──────────┴───────────────┴────────────────────┘');
    console.log('');

    const failures = results.filter(r => r.status !== 'OK');

    if (failures.length > 0) {
        console.log('\x1b[31m✗ DATA READINESS FAILED\x1b[0m');
        console.log('');
        console.log('To fix, run:');
        console.log('  npm run pipeline:dev:rebuild');
        console.log('  npm run interpretations:dev:rebuild');
        console.log('');

        // Also check if there's data for a different week
        if (latestDataWeek && latestDataWeek !== weekToCheck) {
            console.log(`Note: Data exists for ${latestDataWeek} but not current week ${weekToCheck}.`);
            console.log('This may indicate the weekly pipeline has not run for the current week.');
        }

        process.exit(1);
    } else {
        console.log('\x1b[32m✓ DATA READINESS PASSED\x1b[0m');
        console.log('Products and interpretations exist for all fixture teams.');
    }
}

main().catch(e => {
    console.error('Data readiness check error:', e.message);
    process.exit(1);
});
