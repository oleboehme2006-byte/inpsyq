#!/usr/bin/env npx tsx
/**
 * PHASE 24 UNIT TESTS — Role Ordering and Permission Matrix
 */

import './_bootstrap';
import {
    Role,
    ROLES,
    ROLE_PRIORITY,
    ROLE_PERMISSIONS,
    hasPermission,
    isAtLeast,
    getHighestRole
} from '../lib/access/roles';

function assert(condition: boolean, message: string) {
    if (!condition) {
        console.error(`❌ FAIL: ${message}`);
        process.exit(1);
    }
    console.log(`✓ ${message}`);
}

async function main() {
    console.log('=== PHASE 24 UNIT TESTS ===\n');

    // Test 1: Role ordering
    console.log('Test 1: Role priority ordering...');
    assert(ROLE_PRIORITY['ADMIN'] > ROLE_PRIORITY['EXECUTIVE'], 'ADMIN > EXECUTIVE');
    assert(ROLE_PRIORITY['EXECUTIVE'] > ROLE_PRIORITY['TEAMLEAD'], 'EXECUTIVE > TEAMLEAD');
    assert(ROLE_PRIORITY['TEAMLEAD'] > ROLE_PRIORITY['EMPLOYEE'], 'TEAMLEAD > EMPLOYEE');

    // Test 2: isAtLeast helper
    console.log('\nTest 2: isAtLeast helper...');
    assert(isAtLeast('ADMIN', 'ADMIN'), 'ADMIN >= ADMIN');
    assert(isAtLeast('ADMIN', 'EXECUTIVE'), 'ADMIN >= EXECUTIVE');
    assert(isAtLeast('EXECUTIVE', 'TEAMLEAD'), 'EXECUTIVE >= TEAMLEAD');
    assert(!isAtLeast('EMPLOYEE', 'TEAMLEAD'), 'EMPLOYEE not >= TEAMLEAD');
    assert(!isAtLeast('TEAMLEAD', 'EXECUTIVE'), 'TEAMLEAD not >= EXECUTIVE');

    // Test 3: Permission matrix - EMPLOYEE restrictions
    console.log('\nTest 3: EMPLOYEE permission restrictions...');
    assert(hasPermission('EMPLOYEE', 'session:own'), 'EMPLOYEE can session:own');
    assert(!hasPermission('EMPLOYEE', 'dashboard:org'), 'EMPLOYEE cannot dashboard:org');
    assert(!hasPermission('EMPLOYEE', 'dashboard:team'), 'EMPLOYEE cannot dashboard:team');
    assert(!hasPermission('EMPLOYEE', 'admin:read'), 'EMPLOYEE cannot admin:read');
    assert(!hasPermission('EMPLOYEE', 'admin:write'), 'EMPLOYEE cannot admin:write');

    // Test 4: Permission matrix - TEAMLEAD
    console.log('\nTest 4: TEAMLEAD permissions...');
    assert(hasPermission('TEAMLEAD', 'dashboard:team'), 'TEAMLEAD can dashboard:team');
    assert(!hasPermission('TEAMLEAD', 'dashboard:org'), 'TEAMLEAD cannot dashboard:org');
    assert(!hasPermission('TEAMLEAD', 'admin:write'), 'TEAMLEAD cannot admin:write');

    // Test 5: Permission matrix - EXECUTIVE
    console.log('\nTest 5: EXECUTIVE permissions...');
    assert(hasPermission('EXECUTIVE', 'dashboard:org'), 'EXECUTIVE can dashboard:org');
    assert(hasPermission('EXECUTIVE', 'dashboard:team'), 'EXECUTIVE can dashboard:team');
    assert(!hasPermission('EXECUTIVE', 'admin:write'), 'EXECUTIVE cannot admin:write');
    assert(!hasPermission('EXECUTIVE', 'internal:write'), 'EXECUTIVE cannot internal:write');

    // Test 6: Permission matrix - ADMIN
    console.log('\nTest 6: ADMIN permissions...');
    assert(hasPermission('ADMIN', 'dashboard:org'), 'ADMIN can dashboard:org');
    assert(hasPermission('ADMIN', 'dashboard:team'), 'ADMIN can dashboard:team');
    assert(hasPermission('ADMIN', 'admin:read'), 'ADMIN can admin:read');
    assert(hasPermission('ADMIN', 'admin:write'), 'ADMIN can admin:write');

    // Test 7: getHighestRole
    console.log('\nTest 7: getHighestRole helper...');
    assert(getHighestRole(['EMPLOYEE', 'TEAMLEAD']) === 'TEAMLEAD', 'Highest of EMPLOYEE,TEAMLEAD is TEAMLEAD');
    assert(getHighestRole(['ADMIN', 'EMPLOYEE']) === 'ADMIN', 'Highest of ADMIN,EMPLOYEE is ADMIN');
    assert(getHighestRole([]) === null, 'Empty array returns null');

    console.log('\n=== ALL UNIT TESTS PASSED ===');
}

main().catch(e => {
    console.error('Test failed:', e);
    process.exit(1);
});
