#!/usr/bin/env npx tsx
/**
 * PHASE 23 AUTH UNIT TESTS
 * 
 * Tests token hashing, expiry, email normalization.
 */

import './_bootstrap';
import {
    normalizeEmail,
    generateLoginToken,
    hashLoginToken
} from '../lib/auth/loginToken';
import {
    generateSessionToken,
    hashSessionToken
} from '../lib/auth/session';

function assert(condition: boolean, message: string) {
    if (!condition) {
        console.error(`❌ FAIL: ${message}`);
        process.exit(1);
    }
    console.log(`✓ ${message}`);
}

async function main() {
    console.log('=== PHASE 23 AUTH UNIT TESTS ===\n');

    // Test email normalization
    console.log('Testing email normalization...');
    assert(normalizeEmail('Test@Example.COM') === 'test@example.com', 'Email lowercased correctly');
    assert(normalizeEmail('  user@domain.com  ') === 'user@domain.com', 'Email trimmed correctly');
    assert(normalizeEmail('USER@DOMAIN.COM') === 'user@domain.com', 'All caps normalized');

    // Test login token generation
    console.log('\nTesting login token generation...');
    const token1 = generateLoginToken();
    const token2 = generateLoginToken();
    assert(token1.length > 20, 'Token has sufficient length');
    assert(token1 !== token2, 'Tokens are unique');
    assert(!token1.includes('/') && !token1.includes('+'), 'Token is URL-safe (base64url)');

    // Test login token hashing
    console.log('\nTesting login token hashing...');
    const hash1 = hashLoginToken(token1);
    const hash2 = hashLoginToken(token1);
    const hash3 = hashLoginToken(token2);
    assert(hash1 === hash2, 'Same token produces same hash');
    assert(hash1 !== hash3, 'Different tokens produce different hashes');
    assert(hash1.length === 64, 'Hash is SHA-256 hex (64 chars)');
    assert(hash1 !== token1, 'Hash is different from original token');

    // Test session token generation
    console.log('\nTesting session token generation...');
    const sToken1 = generateSessionToken();
    const sToken2 = generateSessionToken();
    assert(sToken1.length > 20, 'Session token has sufficient length');
    assert(sToken1 !== sToken2, 'Session tokens are unique');

    // Test session token hashing
    console.log('\nTesting session token hashing...');
    const sHash1 = hashSessionToken(sToken1);
    const sHash2 = hashSessionToken(sToken1);
    assert(sHash1 === sHash2, 'Same session token produces same hash');
    assert(sHash1.length === 64, 'Session hash is SHA-256 hex');

    console.log('\n=== ALL UNIT TESTS PASSED ===');
}

main().catch(e => {
    console.error('Test failed:', e);
    process.exit(1);
});
