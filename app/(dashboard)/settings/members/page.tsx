'use client';

/**
 * MEMBERS SETTINGS — Member management + invite page
 */

import { useEffect, useState } from 'react';

interface Member {
    userId: string;
    email: string;
    name: string;
    role: string;
    teamId: string | null;
    teamName: string | null;
    isActive: boolean;
}

interface Team {
    teamId: string;
    name: string;
}

export default function MembersSettingsPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('EMPLOYEE');
    const [inviteTeam, setInviteTeam] = useState('');
    const [inviting, setInviting] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadMembers();
        loadTeams();
    }, []);

    async function loadMembers() {
        const res = await fetch('/api/org/members');
        const data = await res.json();
        if (data.ok) setMembers(data.members);
    }

    async function loadTeams() {
        const res = await fetch('/api/org/teams');
        const data = await res.json();
        if (data.ok) setTeams(data.teams);
    }

    async function sendInvite() {
        if (!inviteEmail.trim()) return;
        setInviting(true);
        setMessage('');

        const res = await fetch('/api/org/invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: inviteEmail.trim(),
                role: inviteRole,
                teamId: inviteRole === 'TEAMLEAD' ? inviteTeam : undefined,
            }),
        });

        const data = await res.json();
        setInviting(false);

        if (data.ok) {
            setMessage(data.emailSent ? 'Invitation sent!' : 'Invite created (email pending)');
            setInviteEmail('');
            setShowInvite(false);
        } else {
            setMessage(data.error?.message || 'Failed to send invite');
        }
    }

    const activeMembers = members.filter(m => m.isActive !== false);
    const inactiveMembers = members.filter(m => m.isActive === false);

    return (
        <div>
            <div style={s.header}>
                <div>
                    <h1 style={s.title}>Members</h1>
                    <p style={s.subtitle}>Manage your team members and send invitations.</p>
                </div>
                <button onClick={() => setShowInvite(!showInvite)} style={s.inviteBtn}>
                    + Invite Member
                </button>
            </div>

            {message && <div style={s.toast}>{message}</div>}

            {/* Invite Panel */}
            {showInvite && (
                <div style={s.card}>
                    <h3 style={s.cardTitle}>Send Invitation</h3>
                    <div style={s.inviteForm}>
                        <div style={s.field}>
                            <label style={s.label}>Email</label>
                            <input
                                type="email"
                                placeholder="colleague@company.com"
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                style={s.input}
                            />
                        </div>
                        <div style={s.fieldRow}>
                            <div style={s.field}>
                                <label style={s.label}>Role</label>
                                <select
                                    value={inviteRole}
                                    onChange={e => setInviteRole(e.target.value)}
                                    style={s.select}
                                >
                                    <option value="EMPLOYEE">Employee</option>
                                    <option value="TEAMLEAD">Team Lead</option>
                                    <option value="EXECUTIVE">Executive</option>
                                </select>
                            </div>
                            {inviteRole === 'TEAMLEAD' && (
                                <div style={s.field}>
                                    <label style={s.label}>Team</label>
                                    <select
                                        value={inviteTeam}
                                        onChange={e => setInviteTeam(e.target.value)}
                                        style={s.select}
                                    >
                                        <option value="">Select team...</option>
                                        {teams.map(t => (
                                            <option key={t.teamId} value={t.teamId}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <button onClick={sendInvite} disabled={inviting} style={s.sendBtn}>
                            {inviting ? 'Sending...' : 'Send Invitation'}
                        </button>
                    </div>
                </div>
            )}

            {/* Members Table */}
            <div style={s.card}>
                <h3 style={s.cardTitle}>Active Members ({activeMembers.length})</h3>
                <div style={s.table}>
                    <div style={s.tableHeader}>
                        <span style={s.colEmail}>Email</span>
                        <span style={s.colRole}>Role</span>
                        <span style={s.colTeam}>Team</span>
                    </div>
                    {activeMembers.map(m => (
                        <div key={m.userId} style={s.tableRow}>
                            <span style={s.colEmail}>
                                <div style={s.memberName}>{m.name || m.email}</div>
                                {m.name && <div style={s.memberEmail}>{m.email}</div>}
                            </span>
                            <span style={s.colRole}>
                                <span style={{ ...s.roleBadge, background: roleColor(m.role) }}>{m.role}</span>
                            </span>
                            <span style={s.colTeam}>{m.teamName || '—'}</span>
                        </div>
                    ))}
                </div>
            </div>

            {inactiveMembers.length > 0 && (
                <div style={s.card}>
                    <h3 style={s.cardTitle}>Inactive ({inactiveMembers.length})</h3>
                    <div style={s.table}>
                        {inactiveMembers.map(m => (
                            <div key={m.userId} style={{ ...s.tableRow, opacity: 0.5 }}>
                                <span style={s.colEmail}>{m.email}</span>
                                <span style={s.colRole}>{m.role}</span>
                                <span style={s.colTeam}>{m.teamName || '—'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function roleColor(role: string): string {
    switch (role) {
        case 'ADMIN': return 'rgba(239,68,68,0.2)';
        case 'EXECUTIVE': return 'rgba(99,102,241,0.2)';
        case 'TEAMLEAD': return 'rgba(16,185,129,0.2)';
        default: return 'rgba(255,255,255,0.06)';
    }
}

const s: Record<string, React.CSSProperties> = {
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
    title: { color: '#fff', fontSize: '24px', fontWeight: 600, margin: '0 0 8px' },
    subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: 0 },
    inviteBtn: {
        padding: '10px 20px', background: '#6366f1', color: '#fff',
        border: 'none', borderRadius: '8px', cursor: 'pointer',
        fontSize: '14px', fontWeight: 500,
    },
    toast: {
        padding: '12px 16px', background: 'rgba(16,185,129,0.15)',
        border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px',
        color: '#10b981', fontSize: '13px', marginBottom: '20px',
    },
    card: {
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
    },
    cardTitle: { color: '#fff', fontSize: '16px', fontWeight: 500, margin: '0 0 16px' },
    inviteForm: { display: 'flex', flexDirection: 'column', gap: '16px' },
    field: { flex: 1 },
    fieldRow: { display: 'flex', gap: '12px' },
    label: { display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 500, marginBottom: '6px' },
    input: {
        width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
        color: '#fff', fontSize: '14px', outline: 'none',
    },
    select: {
        width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
        color: '#fff', fontSize: '14px', outline: 'none',
    },
    sendBtn: {
        padding: '10px 24px', background: '#10b981', color: '#fff',
        border: 'none', borderRadius: '8px', cursor: 'pointer',
        fontSize: '14px', fontWeight: 500, alignSelf: 'flex-start',
    },
    table: { display: 'flex', flexDirection: 'column' },
    tableHeader: {
        display: 'flex', padding: '8px 16px', fontSize: '11px',
        color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
        letterSpacing: '0.05em', fontWeight: 600,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
    },
    tableRow: {
        display: 'flex', padding: '12px 16px', alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
    },
    colEmail: { flex: 2 },
    colRole: { flex: 1 },
    colTeam: { flex: 1, color: 'rgba(255,255,255,0.5)', fontSize: '13px' },
    memberName: { color: '#fff', fontSize: '14px', fontWeight: 500 },
    memberEmail: { color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '2px' },
    roleBadge: {
        padding: '3px 10px', borderRadius: '12px',
        fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.7)',
    },
};
