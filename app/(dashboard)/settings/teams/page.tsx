'use client';

/**
 * TEAMS SETTINGS — Team management page
 */

import { useEffect, useState } from 'react';

interface Team {
    teamId: string;
    name: string;
    isArchived: boolean;
    memberCount: number;
}

export default function TeamsSettingsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [newTeamName, setNewTeamName] = useState('');
    const [creating, setCreating] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => { loadTeams(); }, []);

    async function loadTeams() {
        const res = await fetch('/api/org/teams');
        const data = await res.json();
        if (data.ok) setTeams(data.teams);
    }

    async function createTeam() {
        if (!newTeamName.trim()) return;
        setCreating(true);
        setMessage('');

        const res = await fetch('/api/org/teams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newTeamName.trim() }),
        });

        const data = await res.json();
        setCreating(false);

        if (data.ok) {
            setNewTeamName('');
            setMessage('Team created!');
            loadTeams();
        } else {
            setMessage(data.error?.message || 'Failed to create team');
        }
    }

    const activeTeams = teams.filter(t => !t.isArchived);
    const archivedTeams = teams.filter(t => t.isArchived);

    return (
        <div>
            <h1 style={s.title}>Teams</h1>
            <p style={s.subtitle}>Manage your organization&apos;s team structure.</p>

            {/* Create Team */}
            <div style={s.card}>
                <h3 style={s.cardTitle}>Create New Team</h3>
                <div style={s.createRow}>
                    <input
                        type="text"
                        placeholder="Team name..."
                        value={newTeamName}
                        onChange={e => setNewTeamName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && createTeam()}
                        style={s.input}
                    />
                    <button onClick={createTeam} disabled={creating} style={s.createBtn}>
                        {creating ? 'Creating...' : '+ Create Team'}
                    </button>
                </div>
                {message && <p style={s.message}>{message}</p>}
            </div>

            {/* Active Teams */}
            <div style={s.card}>
                <h3 style={s.cardTitle}>Active Teams ({activeTeams.length})</h3>
                {activeTeams.length === 0 ? (
                    <p style={s.empty}>No teams yet. Create your first team above.</p>
                ) : (
                    <div style={s.teamList}>
                        {activeTeams.map(team => (
                            <div key={team.teamId} style={s.teamRow}>
                                <div>
                                    <div style={s.teamName}>{team.name}</div>
                                    <div style={s.teamMeta}>{team.memberCount} member{team.memberCount !== 1 ? 's' : ''}</div>
                                </div>
                                <div style={s.teamId}>{team.teamId.slice(0, 8)}...</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Archived Teams */}
            {archivedTeams.length > 0 && (
                <div style={s.card}>
                    <h3 style={s.cardTitle}>Archived ({archivedTeams.length})</h3>
                    <div style={s.teamList}>
                        {archivedTeams.map(team => (
                            <div key={team.teamId} style={{ ...s.teamRow, opacity: 0.5 }}>
                                <div style={s.teamName}>{team.name}</div>
                                <div style={s.teamMeta}>{team.memberCount} members</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    title: { color: '#fff', fontSize: '24px', fontWeight: 600, margin: '0 0 8px' },
    subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: '0 0 32px' },
    card: {
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
    },
    cardTitle: { color: '#fff', fontSize: '16px', fontWeight: 500, margin: '0 0 16px' },
    createRow: { display: 'flex', gap: '12px' },
    input: {
        flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
        color: '#fff', fontSize: '14px', outline: 'none',
    },
    createBtn: {
        padding: '10px 20px', background: '#6366f1', color: '#fff',
        border: 'none', borderRadius: '8px', cursor: 'pointer',
        fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap',
    },
    message: { color: '#10b981', fontSize: '13px', marginTop: '8px' },
    empty: { color: 'rgba(255,255,255,0.3)', fontSize: '14px' },
    teamList: { display: 'flex', flexDirection: 'column', gap: '2px' },
    teamRow: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', borderRadius: '8px',
        background: 'rgba(255,255,255,0.02)',
    },
    teamName: { color: '#fff', fontSize: '14px', fontWeight: 500 },
    teamMeta: { color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '2px' },
    teamId: { color: 'rgba(255,255,255,0.2)', fontSize: '11px', fontFamily: 'monospace' },
};
