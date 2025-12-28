/**
 * Bootstrap Development Script
 * 
 * Creates seed data AND runs synthetic sessions to populate latent states.
 * DEV-ONLY: Will refuse to run in production.
 * 
 * Usage: npm run bootstrap:dev
 */

import './_bootstrap';
// Env loaded by bootstrap

import { query } from '../db/client';
import { randomUUID } from 'crypto';

// Guard: Dev only
if (process.env.NODE_ENV === 'production') {
    console.error('❌ bootstrap:dev is DEV-ONLY. Refusing to run in production.');
    process.exit(1);
}

const APP_URL = process.env.APP_URL || 'http://localhost:3001';
const USERS_PER_TEAM = 5;
const SESSIONS_PER_USER = 3;

async function bootstrap() {
    console.log('=== Development Bootstrap ===\n');
    console.log(`Target: ${APP_URL}\n`);

    // 1. Create org/teams/users
    const orgId = randomUUID();
    const teamId = randomUUID();
    const userIds: string[] = [];

    console.log('Creating org...');
    await query(`INSERT INTO orgs (org_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [orgId, 'Bootstrap Org']);

    console.log('Creating team...');
    await query(`INSERT INTO teams (team_id, org_id, name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [teamId, orgId, 'Bootstrap Team']);

    console.log(`Creating ${USERS_PER_TEAM} users...`);
    for (let i = 0; i < USERS_PER_TEAM; i++) {
        const userId = randomUUID();
        userIds.push(userId);
        await query(`INSERT INTO users (user_id, org_id, team_id, is_active) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`, [userId, orgId, teamId, true]);
    }

    console.log('');
    console.log('IDs:');
    console.log(`  ORG_ID=${orgId}`);
    console.log(`  TEAM_ID=${teamId}`);
    console.log(`  USER_IDS=${userIds.slice(0, 3).join(', ')}...`);
    console.log('');

    // 2. Run synthetic sessions through public API
    console.log(`Running ${SESSIONS_PER_USER} sessions per user...\n`);

    let totalSessions = 0;
    let totalResponses = 0;

    for (const userId of userIds) {
        for (let s = 0; s < SESSIONS_PER_USER; s++) {
            try {
                // Start session
                const startRes = await fetch(`${APP_URL}/api/session/start`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId }),
                });

                if (!startRes.ok) {
                    console.error(`  Session start failed for ${userId.slice(0, 8)}:`, await startRes.text());
                    continue;
                }

                const session = await startRes.json();
                const sessionId = session.sessionId;
                const interactions = session.interactions || [];

                if (interactions.length === 0) {
                    console.warn(`  No interactions returned for ${userId.slice(0, 8)}`);
                    continue;
                }

                // Generate synthetic responses
                const responses = interactions.map((i: any) => ({
                    interaction_id: i.interaction_id,
                    raw_input: generateSyntheticResponse(i.type),
                }));

                // Submit responses
                const submitRes = await fetch(`${APP_URL}/api/session/submit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId, userId, responses }),
                });

                if (!submitRes.ok) {
                    console.error(`  Submit failed for ${userId.slice(0, 8)}:`, await submitRes.text());
                    continue;
                }

                totalSessions++;
                totalResponses += responses.length;
                process.stdout.write('.');

            } catch (err: any) {
                console.error(`  Error for ${userId.slice(0, 8)}:`, err.message);
            }
        }
    }

    console.log('\n');
    console.log('=== Bootstrap Complete ===\n');
    console.log(`  Sessions: ${totalSessions}`);
    console.log(`  Responses: ${totalResponses}`);
    console.log('');
    console.log('Verify with:');
    console.log(`  curl -s "http://localhost:3001/api/internal/diag/team-stats?org_id=${orgId}&team_id=${teamId}" | jq`);
    console.log(`  curl -s "http://localhost:3001/api/admin/team-dashboard?org_id=${orgId}&team_id=${teamId}" | jq '.audit'`);
    console.log('');

    process.exit(0);
}

function generateSyntheticResponse(type: string): string | number {
    switch (type) {
        case 'rating':
            return Math.floor(Math.random() * 5) + 1; // 1-5
        case 'choice':
            return ['Often', 'Sometimes', 'Rarely', 'Never'][Math.floor(Math.random() * 4)];
        case 'text':
        case 'dialog':
        case 'reflection':
            const phrases = [
                'Things are going well overall.',
                'Some challenges with deadlines lately.',
                'Team communication has improved.',
                'More support would be helpful.',
                'Workload is manageable.',
                'Leadership is responsive.',
                'Feeling motivated this week.',
                'Some uncertainty about priorities.',
            ];
            return phrases[Math.floor(Math.random() * phrases.length)];
        default:
            return 'OK';
    }
}

bootstrap().catch(err => {
    console.error('Bootstrap failed:', err);
    process.exit(1);
});
