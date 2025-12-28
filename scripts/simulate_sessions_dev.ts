/**
 * Multi-Week Direct DB Simulation (Dev-Only, LLM-Free)
 * 
 * Generates deterministic sessions across multiple weeks for longitudinal trends.
 * 
 * Usage:
 *   npm run sim:dev              # Full: 9 weeks, 10 users
 *   npm run sim:dev:small        # Quick: 2 weeks, 3 users
 *   npx tsx scripts/simulate_sessions_dev.ts --weeks 12 --users 15
 */

import './_bootstrap';
// Env loaded by bootstrap

import { query } from '../db/client';
import { randomUUID, createHash } from 'crypto';
import {
    DEV_ORG_ID,
    DEV_TEAM_ID,
    getUsersForTeam,
    stableHash,
} from '../lib/dev/fixtures';
import { ITEM_BANK } from '../services/measurement/item_bank';

// Guard: Dev only
if (process.env.NODE_ENV === 'production') {
    console.error('❌ sim:dev is DEV-ONLY. Refusing to run in production.');
    process.exit(1);
}

// UUID v4 regex for validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isValidUUID(value: string): boolean {
    return UUID_REGEX.test(value);
}

function deterministicUUID(key: string): string {
    const hash = createHash('sha256').update(key).digest('hex');
    return [
        hash.slice(0, 8),
        hash.slice(8, 12),
        '4' + hash.slice(13, 16),
        '8' + hash.slice(17, 20),
        hash.slice(20, 32),
    ].join('-');
}

// Parse CLI args
function parseArgs() {
    const args = process.argv.slice(2);
    const isSmall = args.includes('--small') || args.includes('-s');

    const getArg = (flag: string, def: number) => {
        const idx = args.indexOf(flag);
        return idx >= 0 && args[idx + 1] ? parseInt(args[idx + 1]) : def;
    };

    return {
        weeks: getArg('--weeks', isSmall ? 2 : 9),
        users: getArg('--users', isSmall ? 3 : 10),
        items: getArg('--items', 10),
        startWeeksAgo: getArg('--start-weeks-ago', isSmall ? 1 : 8),
    };
}

const config = parseArgs();

interface SimStats {
    sessionsCreated: number;
    responsesCreated: number;
    signalsCreated: number;
}

/**
 * Get ISO Monday of a week, offset from current week.
 * weeksAgo=0 means current week's Monday.
 */
function getWeekStartDate(weeksAgo: number): Date {
    const now = new Date();
    const day = now.getUTCDay();
    const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff));
    monday.setDate(monday.getDate() - (weeksAgo * 7));
    monday.setUTCHours(0, 0, 0, 0);
    return monday;
}

// Select items deterministically for a session
function selectItems(userId: string, weekIndex: number): typeof ITEM_BANK {
    const seed = stableHash(`${userId}-${weekIndex}`);
    const shuffled = [...ITEM_BANK].sort((a, b) => {
        const ha = stableHash(`${seed}-${a.item_id}`);
        const hb = stableHash(`${seed}-${b.item_id}`);
        return ha - hb;
    });
    return shuffled.slice(0, config.items);
}

/**
 * Generate deterministic response with week-based variation for trends.
 * Creates gradual improvement/deterioration patterns with noise.
 */
function generateResponse(
    item: typeof ITEM_BANK[0],
    userId: string,
    weekIndex: number,
    totalWeeks: number
): string | number {
    const hash = stableHash(`${userId}-${weekIndex}-${item.item_id}`);

    // Week-based drift: earlier weeks slightly worse, later weeks slightly better
    const progressFactor = weekIndex / Math.max(totalWeeks - 1, 1);
    const driftDirection = (hash % 3) - 1; // -1, 0, or 1 per construct
    const drift = driftDirection * 0.15 * progressFactor;

    // Add controlled noise
    const noise = ((hash % 100) / 100 - 0.5) * 0.2;

    switch (item.type) {
        case 'rating':
            const min = item.rating_spec?.scale_min || 1;
            const max = item.rating_spec?.scale_max || 7;
            const mid = (min + max) / 2;
            let value = mid + drift * (max - min) / 2 + noise * (max - min) / 4;
            value = Math.round(Math.max(min, Math.min(max, value)));
            return value;
        case 'choice':
            const choices = item.choice_spec?.choices || ['Yes', 'No'];
            return choices[hash % choices.length];
        default:
            const texts = [
                'Things are going well this week.',
                'Some challenges with deadlines.',
                'Team communication is good.',
                'Workload is manageable.',
                'Leadership is responsive.',
            ];
            return texts[hash % texts.length];
    }
}

async function simulateSession(
    userId: string,
    weekIndex: number,
    weekStart: Date,
    stats: SimStats
): Promise<void> {
    // Session created_at: week_start + deterministic offset
    const userOffset = stableHash(userId) % 48; // 0-47 hours
    const sessionTime = new Date(weekStart.getTime() + (2 * 24 + userOffset) * 60 * 60 * 1000);

    const sessionId = randomUUID();

    if (!isValidUUID(sessionId) || !isValidUUID(userId)) {
        throw new Error(`Invalid UUID: session=${sessionId}, user=${userId}`);
    }

    await query(`
        INSERT INTO sessions (session_id, user_id, started_at, completed_at)
        VALUES ($1, $2, $3, $3)
    `, [sessionId, userId, sessionTime.toISOString()]);
    stats.sessionsCreated++;

    const items = selectItems(userId, weekIndex);

    for (const item of items) {
        const interactionId = deterministicUUID(`interaction-${item.item_id}`);

        await query(`
            INSERT INTO interactions (interaction_id, type, prompt_text, parameter_targets, expected_signal_strength, cooldown_days)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (interaction_id) DO UPDATE SET type = $2
        `, [
            interactionId,
            item.type,
            item.prompt + ` ||| {"item_code":"${item.item_id}"}`,
            [item.construct],
            0.8,
            7
        ]);

        const rawInput = generateResponse(item, userId, weekIndex, config.weeks);

        const responseTime = new Date(sessionTime.getTime() + (stableHash(`${sessionId}-${item.item_id}`) % 300) * 1000);

        const responseRes = await query(`
            INSERT INTO responses (session_id, interaction_id, raw_input, created_at)
            VALUES ($1, $2, $3, $4)
            RETURNING response_id
        `, [sessionId, interactionId, String(rawInput), responseTime.toISOString()]);
        const responseId = responseRes.rows[0].response_id;
        stats.responsesCreated++;

        // Signal value with week variation
        let signalValue = 0.5;
        if (item.type === 'rating') {
            const min = item.rating_spec?.scale_min || 1;
            const max = item.rating_spec?.scale_max || 7;
            signalValue = (Number(rawInput) - min) / (max - min);
        } else if (item.type === 'choice' && item.choice_spec?.option_codes) {
            const code = item.choice_spec.option_codes[String(rawInput)];
            if (code && code[0]) {
                signalValue = code[0].direction > 0 ? 0.7 : 0.3;
            }
        }

        const signals = { [item.construct]: signalValue };
        const uncertainty = { [item.construct]: 0.15 };

        await query(`
            INSERT INTO encoded_signals (response_id, signals, uncertainty, confidence, flags, topics)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [responseId, signals, uncertainty, 0.8, {}, []]);
        stats.signalsCreated++;

        // Update latent state with week-aware decay
        try {
            await query(`
                INSERT INTO latent_states (user_id, parameter, mean, variance, updated_at)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (user_id, parameter) 
                DO UPDATE SET 
                    mean = (latent_states.mean * 0.7 + $3 * 0.3),
                    variance = GREATEST(0.05, latent_states.variance * 0.95),
                    updated_at = $5
            `, [userId, item.construct, signalValue, 0.15, responseTime.toISOString()]);
        } catch {
            // Non-fatal
        }
    }
}

async function simulate() {
    console.log('=== Multi-Week Direct DB Simulation (LLM-Free) ===\n');
    console.log(`Weeks: ${config.weeks}, Users: ${config.users}, Items/Session: ${config.items}`);
    console.log(`Starting ${config.startWeeksAgo} weeks ago\n`);

    const teamUsers = getUsersForTeam(DEV_TEAM_ID).slice(0, config.users);

    if (teamUsers.length === 0) {
        console.error('No users found. Run: npm run seed:dev');
        process.exit(1);
    }

    for (const user of teamUsers) {
        if (!isValidUUID(user.id)) {
            console.error(`Invalid user UUID in fixtures: ${user.id}`);
            process.exit(1);
        }
    }

    const stats: SimStats = {
        sessionsCreated: 0,
        responsesCreated: 0,
        signalsCreated: 0,
    };

    const weekDates: Date[] = [];
    for (let w = 0; w < config.weeks; w++) {
        const weeksAgo = config.startWeeksAgo - w;
        weekDates.push(getWeekStartDate(weeksAgo));
    }

    console.log('Week dates:');
    weekDates.forEach((d, i) => console.log(`  ${i + 1}. ${d.toISOString().slice(0, 10)}`));
    console.log('');

    for (let w = 0; w < config.weeks; w++) {
        const weekStart = weekDates[w];
        process.stdout.write(`Week ${w + 1}/${config.weeks} (${weekStart.toISOString().slice(0, 10)}): `);

        for (const user of teamUsers) {
            await simulateSession(user.id, w, weekStart, stats);
            process.stdout.write('.');
        }

        console.log(' ✓');
    }

    console.log('\n=== Simulation Complete ===\n');
    console.log(`  Sessions:  ${stats.sessionsCreated}`);
    console.log(`  Responses: ${stats.responsesCreated}`);
    console.log(`  Signals:   ${stats.signalsCreated}`);
    console.log('');
    console.log('Stable IDs:');
    console.log(`  ORG_ID=${DEV_ORG_ID}`);
    console.log(`  TEAM_ID=${DEV_TEAM_ID}`);
    console.log('');
    console.log('Next: npm run agg:dev');

    process.exit(0);
}

simulate().catch(err => {
    console.error('Simulation failed:', err);
    process.exit(1);
});
