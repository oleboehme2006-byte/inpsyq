#!/usr/bin/env npx tsx
/**
 * PHASE 24.4 — Ops Coverage Verification (Production)
 * 
 * Diagnoses COVERAGE_GAP alerts by fetching health/diagnostic endpoints.
 * 
 * Required env:
 * - PROD_URL (e.g. https://app.inpsyq.com)
 * - INTERNAL_ADMIN_SECRET
 * 
 * Optional:
 * - ORG_ID (auto-discovered if not provided)
 */

import './_bootstrap';
import * as fs from 'fs';
import * as path from 'path';

const PROD_URL = process.env.PROD_URL?.replace(/\/$/, '');
const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;
const ORG_ID = process.env.ORG_ID;

const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', 'phase24_4');

interface FetchResult {
    url: string;
    status: number;
    isJson: boolean;
    data?: any;
    error?: string;
}

async function fetchEndpoint(path: string): Promise<FetchResult> {
    const url = `${PROD_URL}${path}`;
    try {
        const res = await fetch(url, {
            headers: {
                'x-internal-admin-secret': ADMIN_SECRET || '',
            },
        });

        const contentType = res.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');

        const text = await res.text();
        let data: any;

        if (isJson) {
            try {
                data = JSON.parse(text);
            } catch {
                data = { _raw: text.slice(0, 500) };
            }
        } else {
            data = { _html_preview: text.slice(0, 200) };
        }

        return { url, status: res.status, isJson, data };
    } catch (e: any) {
        return { url, status: 0, isJson: false, error: e.message };
    }
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 24.4 — Ops Coverage Diagnostic (Production)');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (!PROD_URL) {
        console.error('❌ PROD_URL environment variable is required');
        process.exit(1);
    }

    if (!ADMIN_SECRET) {
        console.error('❌ INTERNAL_ADMIN_SECRET environment variable is required');
        process.exit(1);
    }

    console.log(`Target: ${PROD_URL}`);
    console.log(`Org ID: ${ORG_ID || '(auto-discover)'}\n`);

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

    const results: Record<string, FetchResult> = {};

    // 1. Global Health
    console.log('1. Fetching /api/internal/ops/health/global...');
    results.health = await fetchEndpoint('/api/internal/ops/health/global');
    console.log(`   Status: ${results.health.status} (JSON: ${results.health.isJson})`);
    fs.writeFileSync(
        path.join(ARTIFACTS_DIR, 'prod_health.json'),
        JSON.stringify(results.health, null, 2)
    );

    // 2. Recent Incidents
    console.log('2. Fetching /api/internal/ops/incidents...');
    results.incidents = await fetchEndpoint('/api/internal/ops/incidents?limit=10');
    console.log(`   Status: ${results.incidents.status} (JSON: ${results.incidents.isJson})`);
    fs.writeFileSync(
        path.join(ARTIFACTS_DIR, 'prod_incidents.json'),
        JSON.stringify(results.incidents, null, 2)
    );

    // 3. Weekly Runs Diagnostic
    console.log('3. Fetching /api/internal/diag/weekly-runs...');
    results.weeklyRuns = await fetchEndpoint('/api/internal/diag/weekly-runs?limit=20');
    console.log(`   Status: ${results.weeklyRuns.status} (JSON: ${results.weeklyRuns.isJson})`);
    fs.writeFileSync(
        path.join(ARTIFACTS_DIR, 'prod_weekly_runs.json'),
        JSON.stringify(results.weeklyRuns, null, 2)
    );

    // 4. Run ops check (triggers alerting logic)
    console.log('4. Fetching /api/internal/ops/check (triggers alert evaluation)...');
    results.check = await fetchEndpoint('/api/internal/ops/check');
    console.log(`   Status: ${results.check.status} (JSON: ${results.check.isJson})`);
    fs.writeFileSync(
        path.join(ARTIFACTS_DIR, 'prod_check.json'),
        JSON.stringify(results.check, null, 2)
    );

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('SUMMARY:');

    if (results.health.isJson && results.health.data) {
        const h = results.health.data;
        console.log(`  Week targeted: ${h.weekStart || '(unknown)'}`);
        console.log(`  Total teams: ${h.totalTeams ?? '?'}`);
        console.log(`  OK: ${h.totalOk ?? '?'}, Degraded: ${h.totalDegraded ?? '?'}, Failed: ${h.totalFailed ?? '?'}`);

        if (h.totalTeams && h.totalFailed) {
            const failRate = ((h.totalFailed / h.totalTeams) * 100).toFixed(1);
            console.log(`  Failure rate: ${failRate}%`);

            if (parseFloat(failRate) > 10) {
                console.log('  ⚠️  COVERAGE_GAP alert would fire (>10% failure)');
            } else {
                console.log('  ✅ Coverage is healthy (<10% failure)');
            }
        }
    } else {
        console.log('  ⚠️  Health endpoint returned non-JSON or error');
    }

    // Write summary
    fs.writeFileSync(
        path.join(ARTIFACTS_DIR, 'prod_summary.json'),
        JSON.stringify({
            timestamp: new Date().toISOString(),
            prodUrl: PROD_URL,
            results: Object.fromEntries(
                Object.entries(results).map(([k, v]) => [k, { status: v.status, isJson: v.isJson }])
            ),
        }, null, 2)
    );

    console.log('\n✓ Artifacts saved to artifacts/phase24_4/');
}

main().catch(e => {
    console.error('Diagnostic Error:', e);
    process.exit(1);
});
