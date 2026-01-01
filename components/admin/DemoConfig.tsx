'use client';

import React, { useState, useEffect, useCallback } from 'react';

export interface DemoSettings {
    orgId: string;
    teamId: string;
    weekStart: string;
}

interface DemoConfigProps {
    onConfigApply: (settings: DemoSettings) => void;
    autoLoadInDev?: boolean;
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
    return UUID_REGEX.test(id);
}

const STORAGE_KEY = 'inpsyq_dashboard_ids';

// Stable dev IDs
const DEV_ORG_ID = '11111111-1111-4111-8111-111111111111';
const DEV_TEAM_ID = '22222222-2222-4222-8222-222222222201';

export default function DemoConfig({ onConfigApply, autoLoadInDev = true }: DemoConfigProps) {
    const [orgId, setOrgId] = useState('');
    const [teamId, setTeamId] = useState('');
    const [weekStart, setWeekStart] = useState('');
    const [availableWeeks, setAvailableWeeks] = useState<string[]>([]);
    const [loadingWeeks, setLoadingWeeks] = useState(false);
    const [loadingIds, setLoadingIds] = useState(false);
    const [errors, setErrors] = useState<{ orgId?: string; teamId?: string }>({});
    const [loaded, setLoaded] = useState(false);
    const [autoLoaded, setAutoLoaded] = useState(false);

    const isDev = process.env.NODE_ENV !== 'production';

    // Calculate default week (current Monday)
    const getDefaultWeek = (): string => {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(now.setDate(diff));
        return monday.toISOString().slice(0, 10);
    };

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const { orgId: storedOrg, teamId: storedTeam } = JSON.parse(stored);
                if (storedOrg && isValidUUID(storedOrg)) setOrgId(storedOrg);
                if (storedTeam && isValidUUID(storedTeam)) setTeamId(storedTeam);
            }
        } catch {
            // Ignore storage errors
        }
    }, []);

    // Save to localStorage when IDs change
    useEffect(() => {
        if (orgId && teamId && isValidUUID(orgId) && isValidUUID(teamId)) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({ orgId, teamId }));
            } catch {
                // Ignore storage errors
            }
        }
    }, [orgId, teamId]);

    // Auto-fetch weeks when org/team change
    useEffect(() => {
        if (!orgId || !teamId || !isValidUUID(orgId) || !isValidUUID(teamId)) return;

        setLoadingWeeks(true);
        fetch(`/api/admin/weekly?org_id=${orgId}&team_id=${teamId}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const weeks = Array.from(new Set(data.map((d: any) => d.week_start))).sort().reverse();
                    setAvailableWeeks(weeks as string[]);
                    if (weeks.length > 0) {
                        setWeekStart(weeks[0] as string);
                    }
                }
            })
            .catch(err => console.error('Failed to fetch weeks', err))
            .finally(() => setLoadingWeeks(false));
    }, [orgId, teamId]);

    // Set default week on mount
    useEffect(() => {
        if (!weekStart) {
            setWeekStart(getDefaultWeek());
        }
    }, [weekStart]);

    // Auto-fill + auto-load in dev mode on mount
    useEffect(() => {
        if (!isDev || !autoLoadInDev || autoLoaded) return;

        const doAutoLoad = async () => {
            setAutoLoaded(true);
            setLoadingIds(true);

            // Try to get from /api/internal/ids first
            let finalOrgId = orgId;
            let finalTeamId = teamId;

            try {
                const res = await fetch('/api/internal/ids');
                if (res.ok) {
                    const data = await res.json();
                    if (data.orgId && isValidUUID(data.orgId)) finalOrgId = data.orgId;
                    if (data.teamId && isValidUUID(data.teamId)) finalTeamId = data.teamId;
                }
            } catch {
                // Fall back to hardcoded dev IDs
                finalOrgId = finalOrgId || DEV_ORG_ID;
                finalTeamId = finalTeamId || DEV_TEAM_ID;
            }

            // Use stable dev IDs if still empty
            if (!finalOrgId) finalOrgId = DEV_ORG_ID;
            if (!finalTeamId) finalTeamId = DEV_TEAM_ID;

            setOrgId(finalOrgId);
            setTeamId(finalTeamId);
            setLoadingIds(false);

            // Auto-apply after a short delay to allow state updates
            setTimeout(() => {
                const week = weekStart || getDefaultWeek();
                if (isValidUUID(finalOrgId) && isValidUUID(finalTeamId)) {
                    onConfigApply({ orgId: finalOrgId, teamId: finalTeamId, weekStart: week });
                    setLoaded(true);
                }
            }, 100);
        };

        doAutoLoad();
    }, [isDev, autoLoadInDev, autoLoaded, orgId, teamId, weekStart, onConfigApply]);

    // Manual auto-fill from /api/internal/ids
    const handleAutoFill = useCallback(async () => {
        setLoadingIds(true);
        setErrors({});
        try {
            const res = await fetch('/api/internal/ids');
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            if (data.orgId) setOrgId(data.orgId);
            if (data.teamId) setTeamId(data.teamId);
            if (!weekStart) setWeekStart(getDefaultWeek());
        } catch (err: any) {
            console.error('Auto-fill failed:', err);
            setErrors({ orgId: 'Auto-fill failed: ' + err.message });
        } finally {
            setLoadingIds(false);
        }
    }, [weekStart]);

    // Validate and apply
    const handleApply = useCallback(() => {
        const newErrors: { orgId?: string; teamId?: string } = {};

        if (!orgId) {
            newErrors.orgId = 'Required';
        } else if (!isValidUUID(orgId)) {
            newErrors.orgId = 'Invalid UUID format';
        }

        if (!teamId) {
            newErrors.teamId = 'Required';
        } else if (!isValidUUID(teamId)) {
            newErrors.teamId = 'Invalid UUID format';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            const finalWeek = weekStart || getDefaultWeek();
            setWeekStart(finalWeek);
            onConfigApply({ orgId, teamId, weekStart: finalWeek });
            setLoaded(true);
        }
    }, [orgId, teamId, weekStart, onConfigApply]);

    // Handle Enter key
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleApply();
        }
    }, [handleApply]);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                {/* Org ID */}
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Organization ID
                    </label>
                    <input
                        type="text"
                        value={orgId}
                        onChange={(e) => { setOrgId(e.target.value); setErrors({}); }}
                        onKeyDown={handleKeyDown}
                        placeholder="UUID..."
                        className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/50 outline-none font-mono text-xs ${errors.orgId ? 'border-red-500' : 'border-slate-700'
                            }`}
                    />
                    {errors.orgId && (
                        <div className="text-red-500 text-xs">{errors.orgId}</div>
                    )}
                </div>

                {/* Team ID */}
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Team ID
                    </label>
                    <input
                        type="text"
                        value={teamId}
                        onChange={(e) => { setTeamId(e.target.value); setErrors({}); }}
                        onKeyDown={handleKeyDown}
                        placeholder="UUID..."
                        className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/50 outline-none font-mono text-xs ${errors.teamId ? 'border-red-500' : 'border-slate-700'
                            }`}
                    />
                    {errors.teamId && (
                        <div className="text-red-500 text-xs">{errors.teamId}</div>
                    )}
                </div>

                {/* Week Select */}
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        Target Week
                        {loadingWeeks && <span className="animate-pulse text-purple-400">...</span>}
                    </label>
                    <input
                        type="date"
                        value={weekStart}
                        onChange={(e) => setWeekStart(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/50 outline-none"
                    />
                </div>

                {/* Load Button */}
                <button
                    onClick={handleApply}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-medium py-2 px-6 rounded-lg transition-colors h-[38px] flex items-center justify-center"
                >
                    Load Data
                </button>
            </div>

            {/* Dev tools row */}
            <div className="flex items-center gap-4">
                {isDev && (
                    <button
                        onClick={handleAutoFill}
                        disabled={loadingIds}
                        className="text-xs text-slate-500 hover:text-purple-400 transition-colors flex items-center gap-1"
                    >
                        {loadingIds ? '...' : '⚡'} Auto-fill from /api/internal/ids
                    </button>
                )}

                {loaded && (
                    <div className="text-xs text-green-600 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Loaded: {orgId.slice(0, 8)}...{teamId.slice(-4)}
                    </div>
                )}
            </div>
        </div>
    );
}
