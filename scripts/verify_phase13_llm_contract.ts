#!/usr/bin/env npx tsx
/**
 * VERIFY PHASE 13 — LLM Contract & Fallbacks
 * 
 * Tests the interpretation service logic in isolation:
 * 1. Default deterministic generation works
 * 2. Idempotency (cache hits) works
 * 3. Configuration loading respects fallbacks
 * 4. Grounding verification logic works
 */

import './_bootstrap';
import { getOrCreateTeamInterpretation } from '../services/interpretation/service';
import { assertGroundingMap } from '../lib/interpretation/grounding';
import { getLLMConfig } from '../services/llm/config';
import { DEV_ORG_ID, DEV_TEAMS } from '../lib/dev/fixtures';

const TEAM_ID = DEV_TEAMS[0].id;
const ORG_ID = DEV_ORG_ID;

let passed = 0;
let failed = 0;

function test(name: string, condition: boolean, detail?: string) {
    if (condition) {
        console.log(`✅ ${name}${detail ? ` (${detail})` : ''}`);
        passed++;
    } else {
        console.error(`❌ ${name}${detail ? ` - ${detail}` : ''}`);
        failed++;
    }
}

async function main() {
    console.log('=== Phase 13 LLM Contract Verification ===\n');

    // 1. Test Config Defaults
    console.log('--- Configuration ---');
    const config = getLLMConfig();
    test('Default provider is disabled', config.provider === 'disabled');
    test('Numeric cap defaults to 6', config.numericCap === 6);
    test('Safety caps enforced', config.maxTokensTeam <= 2000);

    // 2. Test Grounding Logic
    console.log('\n--- Grounding Logic ---');
    const mockInput: any = {
        indices: [{ indexId: 'strain', current: { value: 0.5 } }],
        attribution: { internalDrivers: [{ label: 'Workload' }] }
    };

    try {
        assertGroundingMap([
            { claimId: '1', claimText: 'Strain is 0.5', sources: ['$.indices[0].current.value'] }
        ], mockInput);
        test('Valid grounding map accepted', true);
    } catch (e) {
        test('Valid grounding map accepted', false, String(e));
    }

    try {
        assertGroundingMap([
            { claimId: '2', claimText: 'Fake', sources: ['$.indices[0].fake.value'] }
        ], mockInput);
        test('Invalid path rejected', false, 'Should have thrown');
    } catch (e) {
        test('Invalid path rejected', true);
    }

    // 3. Test Service Deterministic Generation
    console.log('\n--- Service Generation (Deterministic) ---');
    try {
        // Run generation
        const result1 = await getOrCreateTeamInterpretation(ORG_ID, TEAM_ID);
        test('Generated deterministic result', result1.generated === true || result1.cacheHit === true);
        test('Model ID is fallback', result1.record.modelId === 'deterministic-fallback');

        // Run again (expect cache hit)
        const result2 = await getOrCreateTeamInterpretation(ORG_ID, TEAM_ID);
        test('Cache hit on second call', result2.cacheHit === true);
        test('Input hashes match', result1.record.inputHash === result2.record.inputHash);

    } catch (e: any) {
        console.error('Service error:', e);
        test('Service generation', false, e.message);
    }

    // Summary
    console.log(`\n=== Summary ===`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        console.log('⚠️ Contract verification failed');
        process.exit(1);
    } else {
        console.log('✅ Phase 13 contract verification passed');
        process.exit(0);
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
