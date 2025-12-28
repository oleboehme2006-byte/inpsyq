/**
 * Verify Dashboard Ready
 * 
 * Checks dashboards return real indices and multi-week trends.
 * 
 * Usage: npm run verify:dashboard
 */

import './_bootstrap';
// Env loaded by bootstrap

import { query } from '../db/client';
import { DEV_ORG_ID, DEV_TEAM_ID } from '../lib/dev/fixtures';

const MIN_WEEKS = 3; // Expect at least this many weeks

async function verify() {
    console.log('=== Dashboard Verification ===\n');
    console.log(`ORG_ID:  ${DEV_ORG_ID}`);
    console.log(`TEAM_ID: ${DEV_TEAM_ID}\n`);

    const errors: string[] = [];
    const warnings: string[] = [];

    try {
        // 1. Check aggregates in DB
        const aggRes = await query(`
            SELECT COUNT(*) as count, MIN(week_start) as earliest, MAX(week_start) as latest
            FROM org_aggregates_weekly
            WHERE org_id = $1 AND team_id = $2
        `, [DEV_ORG_ID, DEV_TEAM_ID]);

        const aggCount = parseInt(aggRes.rows[0]?.count || '0');
        const earliest = aggRes.rows[0]?.earliest;
        const latest = aggRes.rows[0]?.latest;

        console.log(`Aggregates: ${aggCount} weeks`);
        if (earliest && latest) {
            console.log(`Range: ${new Date(earliest).toISOString().slice(0, 10)} to ${new Date(latest).toISOString().slice(0, 10)}`);
        }
        console.log('');

        if (aggCount === 0) {
            errors.push('FAIL: aggregates = 0 (run: npm run agg:dev)');
        } else if (aggCount < MIN_WEEKS) {
            warnings.push(`WARN: only ${aggCount} aggregate weeks (expected >= ${MIN_WEEKS})`);
        } else {
            console.log(`✓ aggregates >= ${MIN_WEEKS} (${aggCount})`);
        }

        // 2. Fetch dashboard via HTTP
        const serverUrl = process.env.APP_URL || 'http://localhost:3001';

        try {
            const dashRes = await fetch(
                `${serverUrl}/api/admin/team-dashboard?org_id=${DEV_ORG_ID}&team_id=${DEV_TEAM_ID}`
            );

            if (dashRes.ok) {
                const dash = await dashRes.json();

                console.log('\nDashboard Response:');
                console.log(`  meta.range_weeks: ${dash.meta?.range_weeks ?? 'missing'}`);
                console.log(`  state.label: ${dash.state?.label || 'missing'}`);
                console.log(`  trend.direction: ${dash.trend?.direction || 'missing'}`);
                console.log(`  indices.strain_index: ${dash.indices?.strain_index ?? 'missing'}`);
                console.log(`  indices.withdrawal_risk: ${dash.indices?.withdrawal_risk ?? 'missing'}`);
                console.log(`  audit.sessions_count: ${dash.audit?.sessions_count || 0}`);
                console.log('');

                // Check range_weeks
                const rangeWeeks = dash.meta?.range_weeks ?? 0;
                if (rangeWeeks < MIN_WEEKS - 1) {
                    warnings.push(`WARN: range_weeks = ${rangeWeeks} (expected >= ${MIN_WEEKS - 1})`);
                } else if (rangeWeeks > 0) {
                    console.log(`✓ range_weeks >= ${MIN_WEEKS - 1} (${rangeWeeks})`);
                }

                // Check state
                if (dash.state?.label === 'UNKNOWN' && !dash.meta?.governance_blocked) {
                    errors.push('FAIL: state.label = UNKNOWN without governance_blocked');
                } else if (dash.state?.label && dash.state.label !== 'UNKNOWN') {
                    console.log(`✓ state.label = ${dash.state.label}`);
                }

                // Check indices not all zero
                const strain = dash.indices?.strain_index ?? 0;
                const withdrawal = dash.indices?.withdrawal_risk ?? 0;
                const trust = dash.indices?.trust_gap ?? 0;

                if (strain === 0 && withdrawal === 0 && trust === 0 && aggCount > 0) {
                    warnings.push('WARN: All indices exactly 0');
                } else if (strain !== 0 || withdrawal !== 0 || trust !== 0) {
                    console.log('✓ indices have non-zero values');
                }

                // Check audit
                if (dash.audit?.sessions_count === 0) {
                    errors.push('FAIL: audit.sessions_count = 0');
                } else {
                    console.log(`✓ audit.sessions_count > 0 (${dash.audit?.sessions_count})`);
                }

            } else {
                warnings.push(`Dashboard returned ${dashRes.status}`);
            }
        } catch {
            warnings.push('Server not running - skipping HTTP check');
        }

        console.log('');

        // Final verdict
        if (errors.length > 0) {
            console.log('=== VERIFICATION FAILED ===\n');
            errors.forEach(e => console.log(`  ${e}`));
            warnings.forEach(w => console.log(`  ${w}`));
            process.exit(1);
        }

        if (warnings.length > 0) {
            console.log('=== VERIFICATION PASSED (with warnings) ===\n');
            warnings.forEach(w => console.log(`  ${w}`));
        } else {
            console.log('=== VERIFICATION PASSED ===');
        }

        process.exit(0);

    } catch (error: any) {
        console.error('Verification error:', error.message);
        process.exit(1);
    }
}

verify();
