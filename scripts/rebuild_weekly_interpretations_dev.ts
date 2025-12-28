#!/usr/bin/env npx tsx
/**
 * REBUILD WEEKLY INTERPRETATIONS — Dev Script
 * 
 * Generates interpretations for all fixture teams.
 * 
 * Usage: npm run interpretations:dev:rebuild
 */

import 'dotenv/config';
import { query } from '../db/client';
import { DEV_ORG_ID, DEV_TEAMS } from '../lib/dev/fixtures';
import { getOrCreateTeamInterpretation, getOrCreateOrgInterpretation } from '../services/interpretation/service';

// Guard
if (process.env.NODE_ENV === 'production') {
    console.error('❌ DEV-ONLY');
    process.exit(1);
}

async function main() {
    console.log('=== Rebuild Weekly Interpretations ===\n');

    let generated = 0;
    let reused = 0;
    let missing = 0;

    // Generate for each team
    console.log('--- Team Interpretations ---');
    for (const team of DEV_TEAMS) {
        try {
            const result = await getOrCreateTeamInterpretation(DEV_ORG_ID, team.id);

            if (result.generated) {
                console.log(`✅ [GENERATED] ${team.name}: ${result.record.weekStart}`);
                generated++;
            } else {
                console.log(`📋 [CACHED] ${team.name}: ${result.record.weekStart}`);
                reused++;
            }
        } catch (error: any) {
            if (error.message.includes('NO_WEEKLY_PRODUCT')) {
                console.log(`⚠️  [NO DATA] ${team.name}`);
                missing++;
            } else {
                console.error(`❌ [ERROR] ${team.name}: ${error.message}`);
            }
        }
    }

    // Generate org-level
    console.log('\n--- Org Interpretation ---');
    try {
        const result = await getOrCreateOrgInterpretation(DEV_ORG_ID);

        if (result.generated) {
            console.log(`✅ [GENERATED] Org-level: ${result.record.weekStart}`);
            generated++;
        } else {
            console.log(`📋 [CACHED] Org-level: ${result.record.weekStart}`);
            reused++;
        }
    } catch (error: any) {
        if (error.message.includes('NO_WEEKLY_PRODUCT')) {
            console.log(`⚠️  [NO DATA] Org-level`);
            missing++;
        } else {
            console.error(`❌ [ERROR] Org-level: ${error.message}`);
        }
    }

    // Summary
    console.log('\n=== Summary ===');
    console.log(`Generated: ${generated}`);
    console.log(`Cached: ${reused}`);
    console.log(`Missing data: ${missing}`);

    console.log('\n--- Diagnostics ---');
    console.log(`curl -s "http://localhost:3001/api/internal/diag/interpretation?org_id=${DEV_ORG_ID}" -H "X-DEV-USER-ID: 33333333-3333-4333-8333-0000000000001" | jq`);

    process.exit(0);
}

main().catch(err => {
    console.error('Rebuild failed:', err);
    process.exit(1);
});
