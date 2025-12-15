'use client';

import React, { useState, useEffect } from 'react';

export interface DemoSettings {
    orgId: string;
    teamId: string;
    weekStart: string;
}

interface DemoConfigProps {
    onConfigApply: (settings: DemoSettings) => void;
}

export default function DemoConfig({ onConfigApply }: DemoConfigProps) {
    const [orgId, setOrgId] = useState('');
    const [teamId, setTeamId] = useState('');
    const [weekStart, setWeekStart] = useState('');
    const [availableWeeks, setAvailableWeeks] = useState<string[]>([]);
    const [loadingWeeks, setLoadingWeeks] = useState(false);

    // Auto-fetch weeks when org/team change to populate dropdown
    useEffect(() => {
        if (!orgId || !teamId) return;

        setLoadingWeeks(true);
        fetch(`/api/admin/weekly?org_id=${orgId}&team_id=${teamId}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // Extract unique week starts and sort descending
                    const weeks = Array.from(new Set(data.map((d: any) => d.week_start))).sort().reverse();
                    setAvailableWeeks(weeks as string[]);
                    if (weeks.length > 0 && !weekStart) {
                        setWeekStart(weeks[0] as string);
                    }
                }
            })
            .catch(err => console.error('Failed to fetch weeks', err))
            .finally(() => setLoadingWeeks(false));
    }, [orgId, teamId]);

    const handleApply = () => {
        if (orgId && teamId && weekStart) {
            onConfigApply({ orgId, teamId, weekStart });
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Organization ID</label>
                <input
                    type="text"
                    value={orgId}
                    onChange={(e) => setOrgId(e.target.value)}
                    placeholder="UUID..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/50 outline-none"
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Team ID</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={teamId}
                        onChange={(e) => setTeamId(e.target.value)}
                        placeholder="UUID..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/50 outline-none"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Target Week {loadingWeeks && <span className="animate-pulse text-purple-400 ml-2">...</span>}
                </label>
                <select
                    value={weekStart}
                    onChange={(e) => setWeekStart(e.target.value)}
                    disabled={availableWeeks.length === 0}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/50 outline-none disabled:opacity-50"
                >
                    <option value="">Select Week</option>
                    {availableWeeks.map(w => (
                        <option key={w} value={w}>{new Date(w).toLocaleDateString()}</option>
                    ))}
                </select>
            </div>

            <button
                onClick={handleApply}
                disabled={!orgId || !teamId || !weekStart}
                className="bg-purple-600 hover:bg-purple-500 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-[38px] flex items-center justify-center"
            >
                Load Data
            </button>
        </div>
    );
}
