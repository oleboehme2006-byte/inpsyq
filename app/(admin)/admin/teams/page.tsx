'use client';

/**
 * ADMIN: Teams Page
 * 
 * View, create, rename, and archive teams.
 * Styled with dashboard-consistent design tokens.
 */

import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Pencil, Archive, ArchiveRestore, ExternalLink, X, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
            <div className="p-8 flex items-center justify-center min-h-[50vh]" data-testid="admin-teams-page">
                <Loader2 className="w-6 h-6 text-text-tertiary animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1200px] mx-auto animate-in fade-in duration-500" data-testid="admin-teams-page">
            {/* Header */}
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Users className="w-6 h-6 text-[#8B5CF6]" strokeWidth={1.5} />
                    <h1 className="text-3xl font-display font-medium text-white tracking-tight">
                        Teams
                    </h1>
                </div>
                <p className="text-sm text-text-secondary">
                    Create and manage teams in your organization.
                </p>
            </header>

            {error && (
                <div className="mb-6 p-4 bg-[#E11D48]/10 border border-[#E11D48]/20 rounded-xl text-sm text-[#E11D48]">
                    {error}
                </div>
            )}

            {/* Create Team Card */}
            <div className="bg-[#050505] border border-white/10 rounded-xl p-6 mb-8">
                <h2 className="text-base font-display font-medium text-white mb-4">Create Team</h2>

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
                        className="flex-1 max-w-xs px-4 py-2.5 border border-white/10 rounded-lg bg-bg-base text-white placeholder:text-text-tertiary focus:outline-none focus:border-[#8B5CF6]/50 focus:ring-1 focus:ring-[#8B5CF6]/30 transition-all text-sm"
                    />
                    <button
                        type="submit"
                        disabled={creating || !newName.trim()}
                        data-testid="team-create-submit"
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:bg-[#8B5CF6]/40 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        {creating ? 'Creating...' : 'Create Team'}
                    </button>
                </form>

                {createError && (
                    <div className="mt-3 text-sm text-[#E11D48]">{createError}</div>
                )}
            </div>

            {/* Teams Table */}
            <div className="bg-[#050505] border border-white/10 rounded-xl overflow-hidden">
                {teams.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
                        <p className="text-sm text-text-tertiary">No teams yet. Create your first team.</p>
                    </div>
                ) : (
                    <table className="w-full" data-testid="teams-table">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-6 py-3 text-left text-[10px] font-mono text-text-tertiary uppercase tracking-widest">Name</th>
                                <th className="px-6 py-3 text-left text-[10px] font-mono text-text-tertiary uppercase tracking-widest">Members</th>
                                <th className="px-6 py-3 text-left text-[10px] font-mono text-text-tertiary uppercase tracking-widest">Status</th>
                                <th className="px-6 py-3 text-right text-[10px] font-mono text-text-tertiary uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {teams.map((team) => (
                                <tr
                                    key={team.teamId}
                                    data-testid={`team-row-${team.teamId}`}
                                    className="hover:bg-white/[0.02] transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        {editingId === team.teamId ? (
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                data-testid={`team-rename-${team.teamId}`}
                                                className="px-3 py-1.5 border border-[#8B5CF6]/30 rounded-lg bg-bg-base text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]/30"
                                                autoFocus
                                            />
                                        ) : (
                                            <span className={cn(
                                                "text-sm font-medium",
                                                team.isArchived ? "text-text-tertiary line-through" : "text-white"
                                            )}>
                                                {team.name}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-text-secondary font-mono">{team.memberCount}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "inline-flex items-center px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest rounded-full",
                                            team.isArchived
                                                ? "bg-white/5 text-text-tertiary"
                                                : "bg-[#10B981]/10 text-[#10B981]"
                                        )}>
                                            {team.isArchived ? 'Archived' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            {editingId === team.teamId ? (
                                                <>
                                                    <button
                                                        onClick={() => handleRename(team.teamId)}
                                                        disabled={saving}
                                                        className="p-1.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white transition-colors"
                                                        title="Save"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-tertiary hover:text-white transition-colors"
                                                        title="Cancel"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <a
                                                        href={`/team/${team.teamId}`}
                                                        className="p-1.5 rounded-lg hover:bg-white/5 text-text-tertiary hover:text-[#8B5CF6] transition-colors"
                                                        title="View Dashboard"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(team.teamId);
                                                            setEditName(team.name);
                                                        }}
                                                        className="p-1.5 rounded-lg hover:bg-white/5 text-text-tertiary hover:text-white transition-colors"
                                                        title="Rename"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleArchiveToggle(team)}
                                                        data-testid={`team-archive-${team.teamId}`}
                                                        className="p-1.5 rounded-lg hover:bg-white/5 text-text-tertiary hover:text-white transition-colors"
                                                        title={team.isArchived ? 'Unarchive' : 'Archive'}
                                                    >
                                                        {team.isArchived
                                                            ? <ArchiveRestore className="w-3.5 h-3.5" />
                                                            : <Archive className="w-3.5 h-3.5" />
                                                        }
                                                    </button>
                                                </>
                                            )}
                                        </div>
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
