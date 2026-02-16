
import { Suspense } from 'react';
import { getUsers, getTeams } from '@/actions/admin-users';
import { UserTable } from '@/components/admin/users/UserTable';

export default async function AdminUsersPage() {
    // Parallel data fetching
    const [users, teams] = await Promise.all([
        getUsers(),
        getTeams()
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-display font-semibold text-white">User Management</h1>
                <p className="text-text-secondary text-sm">Manage team members, roles, and invitations.</p>
            </div>

            <Suspense fallback={<div className="text-white">Loading users...</div>}>
                <UserTable users={users} teams={teams} />
            </Suspense>
        </div>
    );
}
