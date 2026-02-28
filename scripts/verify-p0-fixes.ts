/**
 * Verification script for the three P0 audit fixes.
 *
 * Run with: npx tsx scripts/verify-p0-fixes.ts
 *
 * This performs structural checks (no network calls needed) to confirm
 * the fixes are in place. For runtime verification see the comments at
 * the bottom of each section.
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.join(__dirname, '..');
let pass = 0;
let fail = 0;

function check(label: string, condition: boolean, detail?: string) {
    if (condition) {
        console.log(`  ✓ ${label}`);
        pass++;
    } else {
        console.error(`  ✗ ${label}${detail ? ': ' + detail : ''}`);
        fail++;
    }
}

function readFile(rel: string): string {
    return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

// ─────────────────────────────────────────────────────────────────────────────
// P0-1: Vercel Cron Routing Fix
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[P0-1] Vercel cron routing + auth header');

const vercelJson = JSON.parse(readFile('vercel.json'));
const cronPath: string = vercelJson?.crons?.[0]?.path ?? '';
check('vercel.json cron path is /api/cron/run-weekly', cronPath === '/api/cron/run-weekly',
    `got: ${cronPath}`);

// Middleware public matcher must cover /api/cron/*
const middleware = readFile('middleware.ts');
check('middleware.ts has /api/cron/(.*) public route', middleware.includes("'/api/cron/(.*)'"));

// New cron route file exists
const cronRouteExists = fs.existsSync(path.join(ROOT, 'app/api/cron/run-weekly/route.ts'));
check('app/api/cron/run-weekly/route.ts exists', cronRouteExists);

if (cronRouteExists) {
    const cronRoute = readFile('app/api/cron/run-weekly/route.ts');

    // Must use Authorization: Bearer (Vercel standard), not x-cron-secret
    check('cron route checks Authorization header', cronRoute.includes("'authorization'"));
    check('cron route uses Bearer pattern', cronRoute.includes('`Bearer ${CRON_SECRET}`'));
    check('cron route uses CRON_SECRET env var', cronRoute.includes("process.env.CRON_SECRET"));

    // Must NOT use the old x-cron-secret header
    check('cron route does NOT use x-cron-secret', !cronRoute.includes('x-cron-secret'));

    // Must be matched by /api/cron/.* — path is correct, also verify route has force-dynamic
    check('cron route has force-dynamic export', cronRoute.includes("dynamic = 'force-dynamic'"));
}

// ─────────────────────────────────────────────────────────────────────────────
// P0-2: OpenAI Client Timeout + Retries
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[P0-2] OpenAI client timeout and maxRetries');

const llmClient = readFile('services/llm/client.ts');
check('OpenAI client has timeout: 30_000', llmClient.includes('timeout: 30_000'));
check('OpenAI client has maxRetries: 2', llmClient.includes('maxRetries: 2'));

// Model name preserved as-is (gpt-5-mini is intentional per user instruction)
check('LLM_CONFIG default model is gpt-5-mini', llmClient.includes("'gpt-5-mini'"));

// ─────────────────────────────────────────────────────────────────────────────
// P0-3: audit_events INSERT Column Fix
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[P0-3] audit_events INSERT column fix');

const adminRunWeekly = readFile('app/api/admin/system/run-weekly/route.ts');

// Must NOT contain the old non-existent columns
check('INSERT does not reference user_id column', !adminRunWeekly.includes('user_id, event_type, payload'));
check('INSERT does not reference payload column',
    !adminRunWeekly.match(/INSERT INTO audit_events[^)]*payload/));

// Must use the correct metadata column
check('INSERT uses metadata column', adminRunWeekly.includes('event_type, metadata, created_at'));

// userId must still be captured — now inside the JSON
check('userId stored in metadata JSON', adminRunWeekly.includes('triggered_by_user: userId'));

// Schema reference check
const schema = readFile('lib/schema.ts');
check('schema has metadata column (not payload)', schema.includes('metadata JSONB'));
check('schema does NOT have user_id in audit_events',
    !schema.match(/audit_events[\s\S]{0,300}user_id/));

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Result: ${pass} passed, ${fail} failed`);
if (fail > 0) {
    console.error('\nSome checks failed — review the errors above.');
    process.exit(1);
} else {
    console.log('\nAll P0 fix checks passed ✓');
}

/*
 * RUNTIME VERIFICATION (manual, with a local dev server running):
 *
 * P0-1 — cron endpoint reachable without auth cookie:
 *   curl -X POST http://localhost:3000/api/cron/run-weekly \
 *     -H "Authorization: Bearer wrong-secret"
 *   → expect 401 {"error":"Unauthorized","code":"INVALID_SECRET"}
 *
 *   curl -X POST http://localhost:3000/api/cron/run-weekly \
 *     -H "Authorization: Bearer <CRON_SECRET from .env.local>"
 *   → expect 200 or 409 (LOCKED), never a redirect to /login
 *
 * P0-2 — OpenAI timeout fires:
 *   Set OPENAI_API_KEY to a valid key, run a pipeline with a mock that delays
 *   >30s. The client should throw a RequestTimeout error, the deterministic
 *   fallback kicks in, and the pipeline continues.
 *
 * P0-3 — audit_events INSERT succeeds:
 *   Trigger the admin pipeline via POST /api/admin/system/run-weekly (dry_run: true).
 *   Confirm row appears in audit_events:
 *     SELECT * FROM audit_events WHERE event_type = 'ADMIN_RUN_WEEKLY_DRYRUN'
 *     ORDER BY created_at DESC LIMIT 1;
 *   → metadata JSONB should contain triggered_by_user, week_start, counts, etc.
 */
