#!/usr/bin/env npx tsx
/**
 * VERIFICATION SCRIPT — Access & RBAC
 * 
 * Run with: npx tsx scripts/verify_access.ts
 * 
 * Tests:
 * 1. Role and permission checks
 * 2. Invite token creation and validation
 * 3. Membership lookups
 * 4. API route access validation (simulated)
 */

import {
    Role,
    ROLES,
    isValidRole,
    hasPermission,
    hasAnyPermission,
    isAtLeast,
    getHighestRole,
} from '../lib/access/roles';

import {
    createInviteToken,
    parseInviteToken,
} from '../lib/access/invite';

// ============================================================================
// Test Harness
// ============================================================================

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>): void {
    try {
        const result = fn();
        if (result instanceof Promise) {
            result
                .then(() => {
                    console.log(`✅ ${name}`);
                    passed++;
                })
                .catch((e) => {
                    console.error(`❌ ${name}`);
                    console.error(`   ${e instanceof Error ? e.message : e}`);
                    failed++;
                });
        } else {
            console.log(`✅ ${name}`);
            passed++;
        }
    } catch (e) {
        console.error(`❌ ${name}`);
        console.error(`   ${e instanceof Error ? e.message : e}`);
        failed++;
    }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
    if (actual !== expected) {
        throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
}

function assertTrue(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(`${message}: expected true, got false`);
    }
}

function assertFalse(condition: boolean, message: string): void {
    if (condition) {
        throw new Error(`${message}: expected false, got true`);
    }
}

console.log('\n=== ACCESS & RBAC VERIFICATION ===\n');

// ============================================================================
// Role Tests
// ============================================================================

console.log('--- Roles ---');

test('ROLES array contains all roles', () => {
    assertEqual(ROLES.length, 4, 'Should have 4 roles');
    assertTrue(ROLES.includes('ADMIN'), 'Should include ADMIN');
    assertTrue(ROLES.includes('EXECUTIVE'), 'Should include EXECUTIVE');
    assertTrue(ROLES.includes('TEAMLEAD'), 'Should include TEAMLEAD');
    assertTrue(ROLES.includes('EMPLOYEE'), 'Should include EMPLOYEE');
});

test('isValidRole validates correctly', () => {
    assertTrue(isValidRole('ADMIN'), 'ADMIN is valid');
    assertTrue(isValidRole('EMPLOYEE'), 'EMPLOYEE is valid');
    assertFalse(isValidRole('SUPERUSER'), 'SUPERUSER is invalid');
    assertFalse(isValidRole(''), 'Empty string is invalid');
});

test('hasPermission checks correctly', () => {
    assertTrue(hasPermission('ADMIN', 'admin:write'), 'ADMIN can admin:write');
    assertTrue(hasPermission('ADMIN', 'session:any'), 'ADMIN can session:any');
    assertTrue(hasPermission('EXECUTIVE', 'dashboard:org'), 'EXECUTIVE can dashboard:org');
    assertFalse(hasPermission('EMPLOYEE', 'admin:read'), 'EMPLOYEE cannot admin:read');
    assertFalse(hasPermission('TEAMLEAD', 'internal:write'), 'TEAMLEAD cannot internal:write');
});

test('hasAnyPermission works', () => {
    assertTrue(hasAnyPermission('EXECUTIVE', ['admin:read', 'admin:write']), 'EXECUTIVE has admin:read');
    assertFalse(hasAnyPermission('EMPLOYEE', ['admin:read', 'admin:write']), 'EMPLOYEE has neither');
});

test('isAtLeast compares roles correctly', () => {
    assertTrue(isAtLeast('ADMIN', 'EMPLOYEE'), 'ADMIN >= EMPLOYEE');
    assertTrue(isAtLeast('EXECUTIVE', 'TEAMLEAD'), 'EXECUTIVE >= TEAMLEAD');
    assertTrue(isAtLeast('TEAMLEAD', 'TEAMLEAD'), 'TEAMLEAD >= TEAMLEAD');
    assertFalse(isAtLeast('EMPLOYEE', 'TEAMLEAD'), 'EMPLOYEE < TEAMLEAD');
});

test('getHighestRole returns highest', () => {
    assertEqual(getHighestRole(['EMPLOYEE', 'ADMIN', 'TEAMLEAD']), 'ADMIN', 'Should return ADMIN');
    assertEqual(getHighestRole(['EMPLOYEE', 'TEAMLEAD']), 'TEAMLEAD', 'Should return TEAMLEAD');
    assertEqual(getHighestRole([]), null, 'Empty array returns null');
});

// ============================================================================
// Invite Token Tests
// ============================================================================

console.log('\n--- Invite Tokens ---');

test('createInviteToken creates valid token', () => {
    const token = createInviteToken({
        orgId: '123e4567-e89b-12d3-a456-426614174000',
        role: 'EMPLOYEE',
    });
    assertTrue(typeof token === 'string', 'Token is string');
    assertTrue(token.includes('.'), 'Token has separator');
    const parts = token.split('.');
    assertEqual(parts.length, 2, 'Token has 2 parts');
});

test('parseInviteToken validates correctly', () => {
    const token = createInviteToken({
        orgId: '123e4567-e89b-12d3-a456-426614174000',
        teamId: '456e7890-e89b-12d3-a456-426614174001',
        role: 'TEAMLEAD',
        email: 'test@example.com',
    });

    const parsed = parseInviteToken(token);
    assertTrue(parsed.ok, 'Token should parse successfully');
    if (parsed.ok) {
        assertEqual(parsed.payload.orgId, '123e4567-e89b-12d3-a456-426614174000', 'orgId matches');
        assertEqual(parsed.payload.teamId, '456e7890-e89b-12d3-a456-426614174001', 'teamId matches');
        assertEqual(parsed.payload.role, 'TEAMLEAD', 'role matches');
        assertEqual(parsed.payload.email, 'test@example.com', 'email matches');
    }
});

test('parseInviteToken rejects invalid tokens', () => {
    const invalid1 = parseInviteToken('');
    assertFalse(invalid1.ok, 'Empty string is invalid');

    const invalid2 = parseInviteToken('notavalidtoken');
    assertFalse(invalid2.ok, 'No separator is invalid');

    const invalid3 = parseInviteToken('abc.def');
    assertFalse(invalid3.ok, 'Invalid signature is invalid');
});

test('parseInviteToken rejects expired tokens', () => {
    // Create a token that expires immediately
    const token = createInviteToken({
        orgId: '123e4567-e89b-12d3-a456-426614174000',
        role: 'EMPLOYEE',
        expiresInHours: -1, // Already expired
    });

    const parsed = parseInviteToken(token);
    assertFalse(parsed.ok, 'Expired token should fail');
    if (!parsed.ok) {
        assertTrue(parsed.error.includes('expired'), 'Error mentions expiry');
    }
});

// ============================================================================
// Access Flow Tests (Simulated)
// ============================================================================

console.log('\n--- Access Flow (Simulated) ---');

test('EXECUTIVE can create invites (permission check)', () => {
    assertTrue(hasPermission('EXECUTIVE', 'invite:create'), 'EXECUTIVE has invite:create');
});

test('EMPLOYEE cannot create invites (permission check)', () => {
    assertFalse(hasPermission('EMPLOYEE', 'invite:create'), 'EMPLOYEE lacks invite:create');
});

test('TEAMLEAD can access team dashboard (permission check)', () => {
    assertTrue(hasPermission('TEAMLEAD', 'dashboard:team'), 'TEAMLEAD has dashboard:team');
});

test('TEAMLEAD cannot access org dashboard (permission check)', () => {
    assertFalse(hasPermission('TEAMLEAD', 'dashboard:org'), 'TEAMLEAD lacks dashboard:org');
});

test('EMPLOYEE can only operate on own sessions (permission check)', () => {
    assertTrue(hasPermission('EMPLOYEE', 'session:own'), 'EMPLOYEE has session:own');
    assertFalse(hasPermission('EMPLOYEE', 'session:any'), 'EMPLOYEE lacks session:any');
});

test('ADMIN can operate on any session (permission check)', () => {
    assertTrue(hasPermission('ADMIN', 'session:any'), 'ADMIN has session:any');
});

// ============================================================================
// Summary
// ============================================================================

// Give async tests time to complete
setTimeout(() => {
    console.log('\n=== ACCESS VERIFICATION SUMMARY ===');
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        console.log('\n⚠️  Some tests failed. Review errors above.');
        process.exit(1);
    } else {
        console.log('\n✅ All access tests passed.');
        process.exit(0);
    }
}, 100);
