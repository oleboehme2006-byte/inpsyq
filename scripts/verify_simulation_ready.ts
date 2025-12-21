/**
 * Verify Simulation Ready
 * 
 * Checks that simulation created sufficient data for dashboard rendering.
 * Fails if sessions exist but responses = 0.
 * 
 * Usage: npm run verify:sim
 */

import { loadEnv } from '../lib/env/loadEnv';
loadEnv();

import { query } from '../db/client';
import { DEV_ORG_ID, DEV_TEAM_ID } from '../lib/dev/fixtures';

interface Counts {
    sessions: number;
    responses: number;
    signals: number;
    latent_states: number;
}

async function verify() {
    console.log('=== Simulation Verification ===\n');
    console.log(`ORG_ID:  ${DEV_ORG_ID}`);
    console.log(`TEAM_ID: ${DEV_TEAM_ID}\n`);

    const errors: string[] = [];

    try {
        // Query all counts
        const [sessionsRes, responsesRes, signalsRes, latentRes] = await Promise.all([
            query(`
                SELECT COUNT(*) as count FROM sessions s
                JOIN users u ON s.user_id = u.user_id
                WHERE u.org_id = $1 AND u.team_id = $2
            `, [DEV_ORG_ID, DEV_TEAM_ID]),
            query(`
                SELECT COUNT(*) as count FROM responses r
                JOIN sessions s ON r.session_id = s.session_id
                JOIN users u ON s.user_id = u.user_id
                WHERE u.org_id = $1 AND u.team_id = $2
            `, [DEV_ORG_ID, DEV_TEAM_ID]),
            query(`
                SELECT COUNT(*) as count FROM encoded_signals es
                JOIN responses r ON es.response_id = r.response_id
                JOIN sessions s ON r.session_id = s.session_id
                JOIN users u ON s.user_id = u.user_id
                WHERE u.org_id = $1 AND u.team_id = $2
            `, [DEV_ORG_ID, DEV_TEAM_ID]),
            query(`
                SELECT COUNT(*) as count FROM latent_states ls
                JOIN users u ON ls.user_id = u.user_id
                WHERE u.org_id = $1 AND u.team_id = $2
            `, [DEV_ORG_ID, DEV_TEAM_ID]),
        ]);

        const counts: Counts = {
            sessions: parseInt(sessionsRes.rows[0]?.count || '0'),
            responses: parseInt(responsesRes.rows[0]?.count || '0'),
            signals: parseInt(signalsRes.rows[0]?.count || '0'),
            latent_states: parseInt(latentRes.rows[0]?.count || '0'),
        };

        console.log('Database Counts:');
        console.log(`  sessions:      ${counts.sessions}`);
        console.log(`  responses:     ${counts.responses}`);
        console.log(`  signals:       ${counts.signals}`);
        console.log(`  latent_states: ${counts.latent_states}`);
        console.log('');

        // Assertions
        if (counts.sessions === 0) {
            errors.push('FAIL: sessions = 0 (simulation did not run or failed)');
        } else {
            console.log(`✓ sessions > 0 (${counts.sessions})`);
        }

        if (counts.responses === 0) {
            if (counts.sessions > 0) {
                errors.push('FAIL: responses = 0 but sessions > 0 (responses not inserted)');
            } else {
                errors.push('FAIL: responses = 0');
            }
        } else {
            console.log(`✓ responses > 0 (${counts.responses})`);
        }

        if (counts.signals === 0 && counts.responses > 0) {
            errors.push('WARN: signals = 0 but responses > 0 (signals not inserted)');
        } else if (counts.signals > 0) {
            console.log(`✓ signals > 0 (${counts.signals})`);
        }

        if (counts.latent_states === 0 && counts.responses > 0) {
            errors.push('WARN: latent_states = 0 (inference may not have run)');
        } else if (counts.latent_states > 0) {
            console.log(`✓ latent_states > 0 (${counts.latent_states})`);
        }

        console.log('');

        // Final verdict
        const hasFailures = errors.some(e => e.startsWith('FAIL'));

        if (hasFailures) {
            console.log('=== VERIFICATION FAILED ===\n');
            errors.forEach(e => console.log(`  ${e}`));
            console.log('');
            process.exit(1);
        }

        if (errors.length > 0) {
            console.log('=== VERIFICATION PASSED (with warnings) ===\n');
            errors.forEach(e => console.log(`  ${e}`));
        } else {
            console.log('=== VERIFICATION PASSED ===');
        }

        console.log('');
        process.exit(0);

    } catch (error: any) {
        console.error('Verification error:', error.message);
        process.exit(1);
    }
}

verify();
