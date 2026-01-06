'use client';

/**
 * ADMIN: Members Page
 * 
 * View and manage organization members.
 */

import { useState, useEffect, useCallback } from 'react';

interface Member {
    userId: string;
    email: string | null;
    name: string | null;
    role: string;
    teamId: string | null;
    teamName: string | null;
    createdAt: string;
    isActive: boolean;
}

interface Team {
    teamId: string;
    name: string;
}

type Role = 'EMPLOYEE' | 'TEAMLEAD' | 'EXECUTIVE' | 'ADMIN';

export default function AdminUsersPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editRole, setEditRole] = useState<Role>('EMPLOYEE');
    const [editTeamId, setEditTeamId] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const [membersRes, teamsRes] = await Promise.all([
                fetch('/api/admin/members'),
                fetch('/api/admin/teams'),
            ]);

            if (membersRes.ok) {
                const data = await membersRes.json();
                setMembers(data.members || []);
            } else {
                setError('Failed to load members');
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

    const startEdit = (member: Member) => {
        setEditingId(member.userId);
        setEditRole(member.role as Role);
        setEditTeamId(member.teamId || '');
        setSaveError(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setSaveError(null);
    };

    const handleRoleChange = (newRole: Role) => {
        setEditRole(newRole);
        if (newRole !== 'TEAMLEAD') {
            setEditTeamId('');
        }
    };

    const handleSave = async (userId: string) => {
        setSaving(true);
        setSaveError(null);

        try {
            const res = await fetch('/api/admin/members', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    role: editRole,
                    teamId: editRole === 'TEAMLEAD' ? editTeamId : null,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                setSaveError(data.error?.message || 'Failed to save');
            } else {
                setEditingId(null);
                fetchData();
            }
        } catch (e: any) {
            setSaveError('Network error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8" data-testid="admin-users-page">
                <div className="text-slate-500">Loading...</div>
            </div>
        );
    }

    return (
        <div className="p-8" data-testid="admin-users-page">
            <header className="mb-8">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                    Members
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                    View and manage organization members and their role assignments.
                </p>
            </header>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Members Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {members.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                        No members found
                    </div>
                ) : (
                    <table className="w-full" data-testid="members-table">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">User</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Role</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Team</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {members.map((member) => {
                                const isEditing = editingId === member.userId;

                                return (
                                    <tr key={member.userId} data-testid={`member-row-${member.userId}`}>
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-medium text-slate-900 dark:text-white">
                                                {member.name || member.email || 'Unknown'}
                                            </div>
                                            {member.email && member.name && (
                                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                                    {member.email}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isEditing ? (
                                                <select
                                                    value={editRole}
                                                    onChange={(e) => handleRoleChange(e.target.value as Role)}
                                                    className="text-sm px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                >
                                                    <option value="EMPLOYEE">Employee</option>
                                                    <option value="TEAMLEAD">Team Lead</option>
                                                    <option value="EXECUTIVE">Executive</option>
                                                    <option value="ADMIN">Admin</option>
                                                </select>
                                            ) : (
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${member.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                                        member.role === 'EXECUTIVE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                                            member.role === 'TEAMLEAD' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                                'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                                                    }`}>
                                                    {member.role}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isEditing && editRole === 'TEAMLEAD' ? (
                                                <select
                                                    value={editTeamId}
                                                    onChange={(e) => setEditTeamId(e.target.value)}
                                                    className="text-sm px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                >
                                                    <option value="">Select team...</option>
                                                    {teams.map((t) => (
                                                        <option key={t.teamId} value={t.teamId}>{t.name}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                                    {member.teamName || '-'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${member.isActive
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                                }`}>
                                                {member.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {isEditing ? (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleSave(member.userId)}
                                                        disabled={saving || (editRole === 'TEAMLEAD' && !editTeamId)}
                                                        data-testid={`member-save-${member.userId}`}
                                                        className="text-sm px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded"
                                                    >
                                                        {saving ? '...' : 'Save'}
                                                    </button>
                                                    <button
                                                        onClick={cancelEdit}
                                                        className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                                    >
                                                        Cancel
                                                    </button>
                                                    {saveError && (
                                                        <span className="text-xs text-red-600 dark:text-red-400">{saveError}</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => startEdit(member)}
                                                    className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                                                >
                                                    Edit
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
