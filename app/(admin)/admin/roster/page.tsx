/**
 * /admin/roster — Roster Management
 *
 * Hybrid page:
 *   - Server shell: fetches current teams, members, and pending invites
 *   - Client island: ImportPanel for CSV bulk import
 */

import React from 'react';
import { resolveAuthContext } from '@/lib/auth/context';
import { query } from '@/db/client';
import { ImportPanel } from '@/components/admin/roster/ImportPanel';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Users, Mail, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

interface TeamRow {
    teamId: string;
    teamName: string;
    memberCount: number;
}

interface MemberRow {
    userId: string;
    email: string;
    name: string | null;
    role: string;
    teamName: string | null;
    joinedAt: string | null;
}

interface InviteRow {
    inviteId: string;
    email: string;
    role: string;
    teamName: string | null;
    expiresAt: string | null;
}

async function getRosterData(orgId: string): Promise<{
    teams: TeamRow[];
    members: MemberRow[];
    invites: InviteRow[];
}> {
    const [teamsRes, membersRes, invitesRes] = await Promise.all([
        query(
            `SELECT t.team_id, t.name, COUNT(m.user_id)::int AS member_count
             FROM teams t
             LEFT JOIN memberships m ON m.team_id = t.team_id AND m.is_active = true
             WHERE t.org_id = $1 AND t.is_archived = false
             GROUP BY t.team_id, t.name
             ORDER BY t.name`,
            [orgId]
        ),
        query(
            `SELECT
                u.user_id,
                u.email,
                u.name,
                m.role,
                t.name AS team_name,
                m.created_at AS joined_at
             FROM memberships m
             JOIN users u ON u.user_id = m.user_id
             LEFT JOIN teams t ON t.team_id = m.team_id
             WHERE m.org_id = $1 AND m.is_active = true
             ORDER BY m.created_at DESC
             LIMIT 100`,
            [orgId]
        ),
        // Invites: parse email/role from payload signature in active_invites
        // active_invites stores JWT-like tokens; we read what we can from metadata
        query(
            `SELECT payload_signature AS invite_id, created_at, expires_at
             FROM active_invites
             WHERE org_id = $1 AND expires_at > NOW()
             ORDER BY created_at DESC
             LIMIT 50`,
            [orgId]
        ).catch(() => ({ rows: [] })),
    ]);

    const teams: TeamRow[] = teamsRes.rows.map(r => ({
        teamId:      r.team_id,
        teamName:    r.name,
        memberCount: r.member_count ?? 0,
    }));

    const members: MemberRow[] = membersRes.rows.map(r => ({
        userId:   r.user_id,
        email:    r.email,
        name:     r.name ?? null,
        role:     r.role ?? 'EMPLOYEE',
        teamName: r.team_name ?? null,
        joinedAt: r.joined_at
            ? format(new Date(r.joined_at), 'MMM d, yyyy')
            : null,
    }));

    // active_invites stores only the signature + metadata; extract what we can
    const invites: InviteRow[] = (invitesRes as any).rows.map((r: any) => ({
        inviteId:  r.invite_id,
        email:     '—',
        role:      '—',
        teamName:  null,
        expiresAt: r.expires_at
            ? format(new Date(r.expires_at), 'MMM d, yyyy HH:mm')
            : null,
    }));

    return { teams, members, invites };
}

function RoleBadge({ role }: { role: string }) {
    const cfg: Record<string, string> = {
        ADMIN:      'bg-[#8B5CF6]/10 text-[#8B5CF6]',
        EXECUTIVE:  'bg-blue-500/10 text-blue-400',
        TEAMLEAD:   'bg-engagement/10 text-engagement',
        EMPLOYEE:   'bg-white/5 text-text-secondary',
    };
    return (
        <span className={cn(
            'inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider',
            cfg[role] ?? cfg.EMPLOYEE,
        )}>
            {role}
        </span>
    );
}

export default async function RosterPage() {
    const auth = await resolveAuthContext();
    const orgId = auth.context?.orgId;
    if (!orgId) {
        return (
            <div className="p-8 text-text-secondary">
                No organization selected.{' '}
                <Link href="/org/select" className="text-[#8B5CF6] underline">Select one</Link>.
            </div>
        );
    }

    const { teams, members, invites } = await getRosterData(orgId);

    return (
        <div className="p-8 max-w-[1200px] mx-auto space-y-8">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-display font-semibold text-white">Roster</h1>
                <p className="text-text-secondary mt-1 text-sm">
                    Manage team members, pending invites, and bulk import via CSV.
                </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl border border-white/10 bg-[#050505] p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-engagement" />
                        <span className="text-xs font-mono text-text-tertiary uppercase tracking-wider">Active Members</span>
                    </div>
                    <p className="text-3xl font-display font-semibold text-white">{members.length}</p>
                    <p className="text-xs text-text-secondary mt-1">across {teams.length} team{teams.length !== 1 ? 's' : ''}</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#050505] p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-withdrawal" />
                        <span className="text-xs font-mono text-text-tertiary uppercase tracking-wider">Pending Invites</span>
                    </div>
                    <p className={cn('text-3xl font-display font-semibold', invites.length > 0 ? 'text-withdrawal' : 'text-white')}>
                        {invites.length}
                    </p>
                    <p className="text-xs text-text-secondary mt-1">awaiting acceptance</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#050505] p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-4 h-4 text-[#8B5CF6]" />
                        <span className="text-xs font-mono text-text-tertiary uppercase tracking-wider">Teams</span>
                    </div>
                    <p className="text-3xl font-display font-semibold text-white">{teams.length}</p>
                    <p className="text-xs text-text-secondary mt-1">
                        {teams.length === 0 ? 'No teams yet' : `avg ${Math.round(members.length / Math.max(teams.length, 1))} members`}
                    </p>
                </div>
            </div>

            {/* Import Panel (client island) */}
            <ImportPanel />

            {/* Teams overview */}
            {teams.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-[#050505] p-6">
                    <h2 className="text-base font-display font-medium text-white mb-4">Teams</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {teams.map(team => (
                            <Link
                                key={team.teamId}
                                href={`/admin/teams`}
                                className="rounded-lg bg-white/[0.02] border border-white/5 px-4 py-3 hover:bg-white/[0.04] transition-colors"
                            >
                                <p className="text-sm font-medium text-white truncate">{team.teamName}</p>
                                <p className="text-xs text-text-tertiary mt-0.5 font-mono">
                                    {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
                                </p>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Members table */}
            <div className="rounded-xl border border-white/10 bg-[#050505] p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-display font-medium text-white">
                        Members
                        {members.length > 0 && (
                            <span className="ml-2 text-sm font-normal text-text-tertiary">
                                ({members.length})
                            </span>
                        )}
                    </h2>
                    <Link
                        href="/admin/users"
                        className="text-xs text-[#8B5CF6] hover:text-white transition-colors"
                    >
                        Manage users →
                    </Link>
                </div>

                {members.length === 0 ? (
                    <div className="flex items-center gap-2 py-6 text-text-secondary">
                        <Users className="w-5 h-5 text-text-tertiary" />
                        <div>
                            <p className="text-sm">No members yet. Use the import panel above to add users.</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 text-[11px] font-mono text-text-tertiary uppercase tracking-widest">
                                    <th className="px-3 py-2">Email</th>
                                    <th className="px-3 py-2">Name</th>
                                    <th className="px-3 py-2">Role</th>
                                    <th className="px-3 py-2">Team</th>
                                    <th className="px-3 py-2 text-right">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {members.map(m => (
                                    <tr key={m.userId} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-3 py-2.5 text-xs text-white font-mono">{m.email}</td>
                                        <td className="px-3 py-2.5 text-xs text-text-secondary">
                                            {m.name ?? <span className="text-text-tertiary">—</span>}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <RoleBadge role={m.role} />
                                        </td>
                                        <td className="px-3 py-2.5 text-xs text-text-secondary">
                                            {m.teamName ?? <span className="text-text-tertiary">—</span>}
                                        </td>
                                        <td className="px-3 py-2.5 text-right text-xs text-text-tertiary">
                                            {m.joinedAt ?? '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pending invites */}
            {invites.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-[#050505] p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Mail className="w-4 h-4 text-withdrawal" />
                        <h2 className="text-base font-display font-medium text-white">
                            Pending Invites ({invites.length})
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 text-[11px] font-mono text-text-tertiary uppercase tracking-widest">
                                    <th className="px-3 py-2">Token (partial)</th>
                                    <th className="px-3 py-2 text-right">Expires</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {invites.map(inv => (
                                    <tr key={inv.inviteId} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-3 py-2.5 font-mono text-[11px] text-text-tertiary">
                                            {inv.inviteId.slice(0, 16)}…
                                        </td>
                                        <td className="px-3 py-2.5 text-right text-xs text-text-secondary">
                                            {inv.expiresAt ?? '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

        </div>
    );
}
