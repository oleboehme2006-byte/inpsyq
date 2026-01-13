#!/usr/bin/env npx tsx
/**
 * PHASE 36.7a — SQL Parameter Guard Verification
 * 
 * Validates that SQL queries have matching placeholder counts.
 */

import './_bootstrap';
import * as fs from 'fs';
import * as path from 'path';

const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', 'phase36_7a');

/**
 * Assert SQL placeholders match params count.
 */
function assertSqlParamsMatch(sql: string, params: unknown[]): void {
    // Find highest placeholder index
    const matches = sql.match(/\$(\d+)/g);
    if (!matches) {
        if (params.length > 0) {
            throw new Error(`SQL has no placeholders but ${params.length} params provided`);
        }
        return;
    }

    const indices = matches.map(m => parseInt(m.slice(1)));
    const maxIndex = Math.max(...indices);

    if (maxIndex !== params.length) {
        throw new Error(`SQL needs ${maxIndex} params but ${params.length} provided. SQL: ${sql.slice(0, 100)}...`);
    }
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 36.7a — SQL Parameter Guard');
    console.log('═══════════════════════════════════════════════════════════════\n');

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

    const tests: { name: string; sql: string; params: unknown[]; shouldPass: boolean }[] = [
        {
            name: 'ADMIN membership (fixed)',
            sql: 'INSERT INTO memberships (user_id, org_id, role) VALUES ($1, $2, $3)',
            params: ['user-id', 'org-id', 'ADMIN'],
            shouldPass: true,
        },
        {
            name: 'EMPLOYEE membership',
            sql: `INSERT INTO memberships (user_id, org_id, team_id, role) VALUES ($1, $2, $3, 'EMPLOYEE')`,
            params: ['user-id', 'org-id', 'team-id'],
            shouldPass: true,
        },
        {
            name: 'Org insert',
            sql: 'INSERT INTO organizations (id, name) VALUES ($1, $2)',
            params: ['org-id', 'Test Org'],
            shouldPass: true,
        },
        {
            name: 'Invalid - too many params',
            sql: 'INSERT INTO users (email) VALUES ($1)',
            params: ['email', 'extra'],
            shouldPass: false,
        },
    ];

    let passed = 0;
    let failed = 0;
    const results: any[] = [];

    for (const test of tests) {
        try {
            assertSqlParamsMatch(test.sql, test.params);
            if (test.shouldPass) {
                console.log(`  ✓ ${test.name}`);
                passed++;
                results.push({ name: test.name, passed: true });
            } else {
                console.log(`  ⛔ ${test.name} (should have failed but passed)`);
                failed++;
                results.push({ name: test.name, passed: false, error: 'Expected to fail' });
            }
        } catch (e: any) {
            if (!test.shouldPass) {
                console.log(`  ✓ ${test.name} (correctly rejected)`);
                passed++;
                results.push({ name: test.name, passed: true, rejected: true });
            } else {
                console.log(`  ⛔ ${test.name}: ${e.message}`);
                failed++;
                results.push({ name: test.name, passed: false, error: e.message });
            }
        }
    }

    const summary = {
        timestamp: new Date().toISOString(),
        passed,
        failed,
        results,
    };

    fs.writeFileSync(
        path.join(ARTIFACTS_DIR, 'sql_guard.json'),
        JSON.stringify(summary, null, 2)
    );

    if (failed > 0) {
        console.log(`\n⛔ ${failed} tests failed`);
        process.exit(1);
    }

    console.log('\n✓ SQL GUARD PASSED');
}

main().catch(e => { console.error(e); process.exit(1); });
