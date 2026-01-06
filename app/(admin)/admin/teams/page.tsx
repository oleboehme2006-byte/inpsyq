'use client';

/**
 * ADMIN: Teams Page
 * 
 * View, create, rename, and archive teams.
 */

import { useState, useEffect, useCallback } from 'react';

interface Team {
    teamId: string;
    name: string;
    isArchived: boolean;
    createdAt: string;
    memberCount: number;
}

export default function AdminTeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Create form
    const [newName, setNewName] = useState('');
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchTeams = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/teams');
            if (res.ok) {
                const data = await res.json();
                setTeams(data.teams || []);
            } else {
                setError('Failed to load teams');
            }
        } catch (e: any) {
            setError('Failed to load teams');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTeams();
    }, [fetchTeams]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError(null);
        setCreating(true);

        try {
            const res = await fetch('/api/admin/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                setCreateError(data.error?.message || 'Failed to create team');
            } else {
                setNewName('');
                fetchTeams();
            }
        } catch (e: any) {
            setCreateError('Network error');
        } finally {
            setCreating(false);
        }
    };

    const handleRename = async (teamId: string) => {
        setSaving(true);

        try {
            const res = await fetch('/api/admin/teams', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId, name: editName }),
            });

            const data = await res.json();

            if (res.ok && data.ok) {
                setEditingId(null);
                fetchTeams();
            }
        } catch (e: any) {
            console.error('Rename failed:', e);
        } finally {
            setSaving(false);
        }
    };

    const handleArchiveToggle = async (team: Team) => {
        const action = team.isArchived ? 'unarchive' : 'archive';
        if (!confirm(`Are you sure you want to ${action} "${team.name}"?`)) return;

        try {
            const res = await fetch('/api/admin/teams', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId: team.teamId, isArchived: !team.isArchived }),
            });

            if (res.ok) {
                fetchTeams();
            }
        } catch (e: any) {
            console.error('Archive toggle failed:', e);
        }
    };

    if (loading) {
        return (
            <div className="p-8" data-testid="admin-teams-page">
                <div className="text-slate-500">Loading...</div>
            </div>
        );
    }

    return (
        <div className="p-8" data-testid="admin-teams-page">
            <header className="mb-8">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                    Teams
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Create and manage teams in your organization.
                </p>
            </header>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Create Team Form */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 mb-8">
                <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Create Team</h2>

                <form onSubmit={handleCreate} className="flex gap-4">
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Team name"
                        required
                        minLength={2}
                        maxLength={100}
                        data-testid="team-create-name"
                        className="flex-1 max-w-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <button
                        type="submit"
                        disabled={creating || !newName.trim()}
                        data-testid="team-create-submit"
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-lg transition-colors"
                    >
                        {creating ? 'Creating...' : 'Create Team'}
                    </button>
                </form>

                {createError && (
                    <div className="mt-2 text-sm text-red-600 dark:text-red-400">{createError}</div>
                )}
            </div>

            {/* Teams Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {teams.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                        No teams yet. Create your first team.
                    </div>
                ) : (
                    <table className="w-full" data-testid="teams-table">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Members</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {teams.map((team) => (
                                <tr key={team.teamId} data-testid={`team-row-${team.teamId}`}>
                                    <td className="px-4 py-3">
                                        {editingId === team.teamId ? (
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                data-testid={`team-rename-${team.teamId}`}
                                                className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                                            />
                                        ) : (
                                            <span className={`text-sm font-medium ${team.isArchived ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                                                {team.name}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                        {team.memberCount}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${team.isArchived
                                                ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                            }`}>
                                            {team.isArchived ? 'Archived' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {editingId === team.teamId ? (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleRename(team.teamId)}
                                                    disabled={saving}
                                                    className="text-sm px-2 py-1 bg-purple-600 text-white rounded"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="text-sm text-slate-500"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => {
                                                        setEditingId(team.teamId);
                                                        setEditName(team.name);
                                                    }}
                                                    className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                                                >
                                                    Rename
                                                </button>
                                                <button
                                                    onClick={() => handleArchiveToggle(team)}
                                                    data-testid={`team-archive-${team.teamId}`}
                                                    className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                                >
                                                    {team.isArchived ? 'Unarchive' : 'Archive'}
                                                </button>
                                            </div>
                                        )}
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
