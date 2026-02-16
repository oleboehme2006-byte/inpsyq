
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Mock FormData
class MockFormData {
    data: { [key: string]: string } = {};
    append(key: string, value: string) { this.data[key] = value; }
    get(key: string) { return this.data[key]; }
}

async function main() {
    console.log('Testing Invite User Action...');

    // Dynamically import to ensure env vars are loaded first
    const { inviteUser } = await import('@/actions/admin-users');
    const { query } = await import('@/db/client');

    // 1. Get a team ID (need real ID)
    const teams = await query('SELECT team_id FROM teams LIMIT 1');
    if (teams.rows.length === 0) {
        console.error('No teams found. Seed db first.');
        process.exit(1);
    }
    const teamId = teams.rows[0].team_id;
    console.log('Using Team ID:', teamId);

    // 2. Mock Form Data
    const fd = new MockFormData();
    fd.append('email', 'test.invite@example.com');
    fd.append('name', 'Test Invitee');
    fd.append('teamId', teamId);
    fd.append('role', 'EMPLOYEE');

    // 3. Call Action
    try {
        const res = await inviteUser(null, fd as any);
        console.log('Result:', res);
    } catch (e: any) {
        console.error('Action Failed:', e);
    }

    process.exit(0);
}

main();
