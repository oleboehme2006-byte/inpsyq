
import fs from 'fs';
import path from 'path';

// 1. Load Environment Variables (Manual shim for standalone execution)
const loadEnv = () => {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        console.log('[Seed] Loading .env.local...');
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        });
    } else {
        console.log('[Seed] No .env.local found. Relying on process.env.');
    }

    if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
        console.error('[Seed] Error: DATABASE_URL is missing.');
        process.exit(1);
    }
};

loadEnv();

// 2. Import Generator (Must happen AFTER env load)
// We use dynamic import to prevent hoisting
async function main() {
    console.log('------------------------------------------------');
    console.log('  INPSYQ STANDALONE SEEDING TOOL');
    console.log('------------------------------------------------');

    // Safety check: Ensure Env is loaded
    if (!process.env.DATABASE_URL) {
        console.error('[Seed] Error: DATABASE_URL missing after load attempt.');
        process.exit(1);
    }

    console.log('Target DB:', process.env.DATABASE_URL.split('@')[1] || 'Unknown');

    // Safety check (Double confirm if prod?)
    // While we want to allow this, let's just log a warning.

    // Dynamic import to respect env vars loaded above
    const { syntheticDataGenerator } = await import('@/mock/syntheticDataGenerator');

    try {
        const result = await syntheticDataGenerator.generate();
        console.log('\n[Seed] SUCCESS');
        console.log('------------------------------------------------');
        console.log('Org ID:   ', result.orgId);
        console.log('Team A:   ', result.teamAId);
        console.log('Team B:   ', result.teamBId);
        console.log('------------------------------------------------');
        process.exit(0);
    } catch (e) {
        console.error('\n[Seed] FAILED', e);
        process.exit(1);
    }
}

main();
