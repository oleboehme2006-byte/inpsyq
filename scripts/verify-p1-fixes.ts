/**
 * Structural verification for P1/P2 audit fixes.
 * Run with: npx tsx scripts/verify-p1-fixes.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.join(__dirname, '..');
let pass = 0;
let fail = 0;

function check(label: string, ok: boolean, detail?: string) {
    if (ok) { console.log(`  ✓ ${label}`); pass++; }
    else { console.error(`  ✗ ${label}${detail ? ': ' + detail : ''}`); fail++; }
}
function read(rel: string) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function exists(rel: string) { return fs.existsSync(path.join(ROOT, rel)); }

// ─── Fix 1: Zod validation on measurement submit ────────────────────────────
console.log('\n[Fix 1] Zod validation + standardized errors on /api/measurement/submit');

const submit = read('app/api/measurement/submit/route.ts');
check('Imports zod', submit.includes("from 'zod'"));
check('Defines SubmitRequestSchema', submit.includes('SubmitRequestSchema'));
check('Validates sessionId as UUID', submit.includes('.uuid('));
check('Validates responses array min(1)', submit.includes('.min(1'));
check('Uses safeParse()', submit.includes('.safeParse('));
check('Returns 422 on validation error', submit.includes('422'));
check('Imports checkRateLimit', submit.includes('checkRateLimit'));
check('apiError helper present', submit.includes('function apiError'));
check('Success response includes ok:true', submit.includes('ok: true'));
check('Error envelope is { ok: false, error: { code, message } }',
    submit.includes('ok: false, error: { code'));

// ─── Fix 2: Rate limiter ────────────────────────────────────────────────────
console.log('\n[Fix 2] In-memory rate limiter');

check('submitRateLimit.ts exists', exists('lib/rateLimit/submitRateLimit.ts'));
const rl = exists('lib/rateLimit/submitRateLimit.ts') ? read('lib/rateLimit/submitRateLimit.ts') : '';
check('Exports checkRateLimit function', rl.includes('export function checkRateLimit'));
check('Has WINDOW_MS constant', rl.includes('WINDOW_MS'));
check('Has LIMIT constant', rl.includes('LIMIT'));
check('Returns allowed + retryAfterSecs', rl.includes('retryAfterSecs'));
check('Submit route returns 429 when limited', submit.includes("status: 429"));
check('Submit route sends Retry-After header', submit.includes("'Retry-After'"));

// ─── Fix 3: Vercel maxDuration ──────────────────────────────────────────────
console.log('\n[Fix 3] Vercel maxDuration: 300 for pipeline routes');

const vercel = JSON.parse(read('vercel.json'));
const fns = vercel.functions ?? {};
const pipelineRoutes = [
    'app/api/cron/run-weekly/route.ts',
    'app/api/internal/run-weekly/route.ts',
    'app/api/admin/system/run-weekly/route.ts',
];
for (const route of pipelineRoutes) {
    check(`maxDuration=300 for ${route.split('/').pop()}`,
        fns[route]?.maxDuration === 300, `got ${fns[route]?.maxDuration}`);
}

// ─── Fix 4: Sentry setup ────────────────────────────────────────────────────
console.log('\n[Fix 4] Sentry setup');

check('sentry.client.config.ts exists', exists('sentry.client.config.ts'));
check('sentry.server.config.ts exists', exists('sentry.server.config.ts'));
check('sentry.edge.config.ts exists', exists('sentry.edge.config.ts'));
check('instrumentation.ts exists', exists('instrumentation.ts'));
check('next.config.js exists', exists('next.config.js'));

const instr = exists('instrumentation.ts') ? read('instrumentation.ts') : '';
check('instrumentation.ts exports register()', instr.includes('export async function register'));
check('register() handles nodejs runtime', instr.includes("'nodejs'"));
check('register() handles edge runtime', instr.includes("'edge'"));

const clientCfg = exists('sentry.client.config.ts') ? read('sentry.client.config.ts') : '';
check('Client config uses NEXT_PUBLIC_SENTRY_DSN', clientCfg.includes('NEXT_PUBLIC_SENTRY_DSN'));
check('Client config has enabled guard', clientCfg.includes('enabled:'));

const serverCfg = exists('sentry.server.config.ts') ? read('sentry.server.config.ts') : '';
check('Server config uses SENTRY_DSN', serverCfg.includes('SENTRY_DSN'));
check('Server config has enabled guard', serverCfg.includes('enabled:'));

const nextCfg = exists('next.config.js') ? read('next.config.js') : '';
check('next.config.js uses withSentryConfig', nextCfg.includes('withSentryConfig'));
check('next.config.js has hideSourceMaps', nextCfg.includes('hideSourceMaps'));

// ─── Summary ────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Result: ${pass} passed, ${fail} failed`);
if (fail > 0) { console.error('\nSome checks failed.'); process.exit(1); }
else { console.log('\nAll P1/P2 fix checks passed ✓'); }
