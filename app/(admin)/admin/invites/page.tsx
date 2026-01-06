'use client';

/**
 * ADMIN: Invites Page
 * 
 * View and create invitations for the organization.
 */

import { useState, useEffect, useCallback } from 'react';

interface Invite {
    inviteId: string;
    orgId: string;
    createdBy: string | null;
    createdAt: string;
    expiresAt: string;
}

interface Team {
    teamId: string;
    name: string;
}

type Role = 'EMPLOYEE' | 'TEAMLEAD' | 'EXECUTIVE' | 'ADMIN';

export default function AdminInvitesPage() {
    const [invites, setInvites] = useState<Invite[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<Role>('EMPLOYEE');
    const [teamId, setTeamId] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const [invitesRes, teamsRes] = await Promise.all([
                fetch('/api/admin/invites'),
                fetch('/api/admin/teams'),
            ]);

            if (invitesRes.ok) {
                const data = await invitesRes.json();
                setInvites(data.invites || []);
            }

            if (teamsRes.ok) {
                const data = await teamsRes.json();
                setTeams(data.teams || []);
            }
        } catch (e: any) {
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRoleChange = (newRole: Role) => {
        setRole(newRole);
        if (newRole !== 'TEAMLEAD') {
            setTeamId('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setFormSuccess(null);
        setSubmitting(true);

        try {
            const res = await fetch('/api/admin/invites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    role,
                    teamId: role === 'TEAMLEAD' ? teamId : undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                setFormError(data.error?.message || 'Failed to create invite');
            } else {
                setFormSuccess(data.emailSent ? 'Invite sent via email' : 'Invite created');
                setEmail('');
                setRole('EMPLOYEE');
                setTeamId('');
                fetchData();
            }
        } catch (e: any) {
            setFormError('Network error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRevoke = async (inviteId: string) => {
        if (!confirm('Revoke this invite?')) return;

        try {
            const res = await fetch('/api/admin/invites/revoke', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inviteId }),
            });

            if (res.ok) {
                fetchData();
            }
        } catch (e: any) {
            console.error('Revoke failed:', e);
        }
    };

    if (loading) {
        return (
            <div className="p-8" data-testid="admin-invites-page">
                <div className="text-slate-500">Loading...</div>
            </div>
        );
    }

    return (
        <div className="p-8" data-testid="admin-invites-page">
            <header className="mb-8">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                    Invites
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Create and manage user invitations for your organization.
                </p>
            </header>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Create Invite Form */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 mb-8">
                <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Create Invite</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="user@example.com"
                                required
                                data-testid="invite-email"
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Role
                            </label>
                            <select
                                value={role}
                                onChange={(e) => handleRoleChange(e.target.value as Role)}
                                data-testid="invite-role"
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                                <option value="EMPLOYEE">Employee</option>
                                <option value="TEAMLEAD">Team Lead</option>
                                <option value="EXECUTIVE">Executive</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>

                        {role === 'TEAMLEAD' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Team
                                </label>
                                <select
                                    value={teamId}
                                    onChange={(e) => setTeamId(e.target.value)}
                                    required
                                    data-testid="invite-team"
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                >
                                    <option value="">Select team...</option>
                                    {teams.map((t) => (
                                        <option key={t.teamId} value={t.teamId}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {formError && (
                        <div className="text-sm text-red-600 dark:text-red-400">{formError}</div>
                    )}
                    {formSuccess && (
                        <div className="text-sm text-green-600 dark:text-green-400">{formSuccess}</div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        data-testid="invite-submit"
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-lg transition-colors"
                    >
                        {submitting ? 'Creating...' : 'Create Invite'}
                    </button>
                </form>
            </div>

            {/* Pending Invites Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-lg font-medium text-slate-900 dark:text-white">Pending Invites</h2>
                </div>

                {invites.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                        No pending invites
                    </div>
                ) : (
                    <table className="w-full" data-testid="invites-table">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Invite ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Created</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Expires</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {invites.map((invite) => (
                                <tr key={invite.inviteId}>
                                    <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-300 font-mono">
                                        {invite.inviteId.slice(0, 12)}...
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                        {new Date(invite.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                        {new Date(invite.expiresAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => handleRevoke(invite.inviteId)}
                                            className="text-sm text-red-600 dark:text-red-400 hover:underline"
                                        >
                                            Revoke
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
