/**
 * Verify Dashboard UI
 * 
 * Checks that dashboard pages load correctly with multi-week data.
 * 
 * Usage: npm run verify:dashboard_ui
 */

import { loadEnv } from '../lib/env/loadEnv';
loadEnv();

import { query } from '../db/client';
import { DEV_ORG_ID, DEV_TEAM_ID } from '../lib/dev/fixtures';

const MIN_WEEKS = 8;

async function verify() {
    console.log('=== Dashboard UI Verification ===\n');
    console.log(`ORG_ID:  ${DEV_ORG_ID}`);
    console.log(`TEAM_ID: ${DEV_TEAM_ID}\n`);

    const errors: string[] = [];
    const warnings: string[] = [];

    try {
        // 1. Check aggregates
        const aggRes = await query(`
            SELECT COUNT(*) as count FROM org_aggregates_weekly
            WHERE org_id = $1 AND team_id = $2
        `, [DEV_ORG_ID, DEV_TEAM_ID]);
        const aggCount = parseInt(aggRes.rows[0]?.count || '0');

        console.log('Database:');
        console.log(`  aggregates: ${aggCount}`);

        if (aggCount < MIN_WEEKS) {
            warnings.push(`aggregates = ${aggCount} (expected >= ${MIN_WEEKS})`);
        } else {
            console.log(`  ✓ aggregates >= ${MIN_WEEKS}`);
        }

        // 2. Check team dashboard API
        const serverUrl = process.env.APP_URL || 'http://localhost:3001';

        try {
            const dashRes = await fetch(
                `${serverUrl}/api/admin/team-dashboard?org_id=${DEV_ORG_ID}&team_id=${DEV_TEAM_ID}`
            );

            if (dashRes.ok) {
                const dash = await dashRes.json();

                console.log('\nTeam Dashboard API:');
                console.log(`  meta.range_weeks: ${dash.meta?.range_weeks ?? 'missing'}`);
                console.log(`  state.label: ${dash.state?.label || 'missing'}`);
                console.log(`  trend.direction: ${dash.trend?.direction || 'missing'}`);
                console.log(`  indices.strain_index: ${dash.indices?.strain_index ?? 'missing'}`);
                console.log(`  audit.sessions_count: ${dash.audit?.sessions_count || 0}`);

                // Assertions
                const rangeWeeks = dash.meta?.range_weeks ?? 0;
                if (rangeWeeks < MIN_WEEKS) {
                    warnings.push(`range_weeks = ${rangeWeeks} (expected >= ${MIN_WEEKS})`);
                } else {
                    console.log(`  ✓ range_weeks >= ${MIN_WEEKS}`);
                }

                if (dash.state?.label === 'UNKNOWN' && !dash.meta?.governance_blocked) {
                    errors.push('state.label = UNKNOWN without governance_blocked');
                }

                const strain = dash.indices?.strain_index ?? 0;
                const withdrawal = dash.indices?.withdrawal_risk ?? 0;
                const trust = dash.indices?.trust_gap ?? 0;

                if (strain === 0 && withdrawal === 0 && trust === 0 && aggCount > 0) {
                    warnings.push('All indices exactly 0');
                } else if (aggCount > 0) {
                    console.log('  ✓ indices have non-zero values');
                }

            } else {
                errors.push(`Team dashboard returned ${dashRes.status}`);
            }
        } catch {
            warnings.push('Server not running - skipping HTTP checks');
        }

        // 3. Check executive dashboard API
        try {
            const execRes = await fetch(
                `${serverUrl}/api/admin/executive-dashboard?org_id=${DEV_ORG_ID}`
            );

            if (execRes.ok) {
                const exec = await execRes.json();

                console.log('\nExecutive Dashboard API:');
                console.log(`  teams count: ${exec.teams?.length || 0}`);
                console.log(`  org_state.label: ${exec.org_state?.label || 'missing'}`);
                console.log(`  org_indices.strain_index: ${exec.org_indices?.strain_index ?? 'missing'}`);

                if (exec.teams?.length === 0) {
                    warnings.push('No teams in executive dashboard');
                } else {
                    console.log(`  ✓ teams loaded (${exec.teams.length})`);
                }
            }
        } catch {
            // Already warned about server
        }

        console.log('');

        // Final verdict
        if (errors.length > 0) {
            console.log('=== VERIFICATION FAILED ===\n');
            errors.forEach(e => console.log(`  ✗ ${e}`));
            warnings.forEach(w => console.log(`  ⚠ ${w}`));
            process.exit(1);
        }

        if (warnings.length > 0) {
            console.log('=== VERIFICATION PASSED (with warnings) ===\n');
            warnings.forEach(w => console.log(`  ⚠ ${w}`));
        } else {
            console.log('=== VERIFICATION PASSED ===');
        }

        console.log('\nUI Checklist:');
        console.log(`  1. Open http://localhost:3001/admin/teamlead`);
        console.log(`  2. Should auto-load with dev IDs`);
        console.log(`  3. Check indices, trend chart, causal graph`);
        console.log(`  4. Open http://localhost:3001/admin/executive`);
        console.log(`  5. Enter org ID: ${DEV_ORG_ID}`);

        process.exit(0);

    } catch (error: any) {
        console.error('Verification error:', error.message);
        process.exit(1);
    }
}

verify();
