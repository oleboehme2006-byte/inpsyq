'use client';

/**
 * GENERAL SETTINGS — Org config page
 * 
 * Allows EXECUTIVE/ADMIN to update:
 * - Week start day
 * - Pulse delivery time
 * - Timezone
 */

import { useEffect, useState } from 'react';

interface OrgConfig {
    name: string;
    slug: string;
    weekStartDay: number;
    pulseTime: string;
    timezone: string;
    subscriptionStatus: string;
    planId: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIMEZONES = [
    'Europe/Berlin', 'Europe/London', 'Europe/Paris', 'Europe/Amsterdam',
    'America/New_York', 'America/Chicago', 'America/Los_Angeles',
    'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney',
];

export default function GeneralSettingsPage() {
    const [config, setConfig] = useState<OrgConfig | null>(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetch('/api/org/config')
            .then(r => r.json())
            .then(data => {
                if (data.ok) setConfig(data.org);
            });
    }, []);

    async function save() {
        if (!config) return;
        setSaving(true);
        setMessage('');

        const res = await fetch('/api/org/config', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                weekStartDay: config.weekStartDay,
                pulseTime: config.pulseTime,
                timezone: config.timezone,
            }),
        });

        const data = await res.json();
        setSaving(false);
        setMessage(data.ok ? 'Saved!' : data.error?.message || 'Failed to save');
    }

    if (!config) return <div style={s.loading}>Loading...</div>;

    return (
        <div>
            <h1 style={s.title}>General Settings</h1>
            <p style={s.subtitle}>Configure your organization's pulse schedule.</p>

            <div style={s.card}>
                <div style={s.field}>
                    <label style={s.label}>Organization</label>
                    <div style={s.readOnly}>{config.name}</div>
                    <div style={s.slug}>Slug: {config.slug}</div>
                </div>

                <div style={s.divider} />

                <div style={s.field}>
                    <label style={s.label}>Week Start Day</label>
                    <select
                        style={s.select}
                        value={config.weekStartDay}
                        onChange={e => setConfig({ ...config, weekStartDay: parseInt(e.target.value) })}
                    >
                        {DAYS.map((day, i) => (
                            <option key={i} value={i}>{day}</option>
                        ))}
                    </select>
                </div>

                <div style={s.field}>
                    <label style={s.label}>Pulse Delivery Time</label>
                    <input
                        type="time"
                        style={s.input}
                        value={config.pulseTime}
                        onChange={e => setConfig({ ...config, pulseTime: e.target.value })}
                    />
                </div>

                <div style={s.field}>
                    <label style={s.label}>Timezone</label>
                    <select
                        style={s.select}
                        value={config.timezone}
                        onChange={e => setConfig({ ...config, timezone: e.target.value })}
                    >
                        {TIMEZONES.map(tz => (
                            <option key={tz} value={tz}>{tz}</option>
                        ))}
                    </select>
                </div>

                <div style={s.actions}>
                    <button onClick={save} disabled={saving} style={s.saveBtn}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    {message && <span style={s.message}>{message}</span>}
                </div>
            </div>
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    loading: { color: 'rgba(255,255,255,0.5)', padding: '48px' },
    title: { color: '#fff', fontSize: '24px', fontWeight: 600, margin: '0 0 8px' },
    subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: '0 0 32px' },
    card: {
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '24px',
    },
    field: { marginBottom: '20px' },
    label: { display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 500, marginBottom: '6px' },
    readOnly: { color: '#fff', fontSize: '16px', fontWeight: 500 },
    slug: { color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginTop: '4px' },
    divider: { height: '1px', background: 'rgba(255,255,255,0.06)', margin: '20px 0' },
    select: {
        width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
        color: '#fff', fontSize: '14px', outline: 'none',
    },
    input: {
        padding: '10px 12px', background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
        color: '#fff', fontSize: '14px', outline: 'none',
    },
    actions: { display: 'flex', alignItems: 'center', gap: '16px', marginTop: '24px' },
    saveBtn: {
        padding: '10px 24px', background: '#6366f1', color: '#fff',
        border: 'none', borderRadius: '8px', cursor: 'pointer',
        fontSize: '14px', fontWeight: 500,
    },
    message: { color: '#10b981', fontSize: '13px' },
};
