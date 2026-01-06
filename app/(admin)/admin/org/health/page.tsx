'use client';

/**
 * ADMIN: Organization Health Page
 * 
 * View coverage snapshot for the organization.
 */

import { useState, useEffect, useCallback } from 'react';

interface HealthSnapshot {
    targetWeekStart: string;
    lastUpdatedAt: string;
    totalTeams: number;
    okTeams: number;
    degradedTeams: number;
    failedTeams: number;
    missingProducts: number;
    missingInterpretations: number;
    locksStuck: number;
    recentFailures: number;
}

export default function AdminOrgHealthPage() {
    const [health, setHealth] = useState<HealthSnapshot | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchHealth = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/admin/org/health?week_offset=-1');
            if (res.ok) {
                const data = await res.json();
                setHealth(data.health);
            } else {
                setError('Failed to load health snapshot');
            }
        } catch (e: any) {
            setError('Failed to load health snapshot');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHealth();
    }, [fetchHealth]);

    const coveragePercent = health && health.totalTeams > 0
        ? ((health.okTeams / health.totalTeams) * 100).toFixed(1)
        : '0';

    return (
        <div className="p-8" data-testid="admin-org-health-page">
            <header className="mb-8 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                        Organization Health
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Coverage snapshot for the last completed week.
                    </p>
                </div>
                <button
                    onClick={fetchHealth}
                    disabled={loading}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                >
                    {loading ? 'Refreshing...' : 'Refresh'}
                </button>
            </header>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                    {error}
                </div>
            )}

            {loading && !health ? (
                <div className="text-slate-500">Loading...</div>
            ) : health ? (
                <div className="space-y-6">
                    {/* Week Info */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                        <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Target Week</div>
                        <div className="text-xl font-medium text-slate-900 dark:text-white" data-testid="target-week-start">
                            {health.targetWeekStart}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            Last updated: {new Date(health.lastUpdatedAt).toLocaleString()}
                        </div>
                    </div>

                    {/* Coverage Stats */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Teams</div>
                            <div className="text-2xl font-semibold text-slate-900 dark:text-white">
                                {health.totalTeams}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">OK Teams</div>
                            <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
                                {health.okTeams}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Degraded</div>
                            <div className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
                                {health.degradedTeams}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Failed/Missing</div>
                            <div className="text-2xl font-semibold text-red-600 dark:text-red-400">
                                {health.failedTeams}
                            </div>
                        </div>
                    </div>

                    {/* Coverage Bar */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Coverage</span>
                            <span className="text-sm text-slate-600 dark:text-slate-400">{coveragePercent}%</span>
                        </div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 transition-all"
                                style={{ width: `${coveragePercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Details */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Details</h3>
                        <dl className="grid gap-4 md:grid-cols-2">
                            <div>
                                <dt className="text-sm text-slate-500 dark:text-slate-400">Missing Products</dt>
                                <dd className="text-lg font-medium text-slate-900 dark:text-white">{health.missingProducts}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-slate-500 dark:text-slate-400">Missing Interpretations</dt>
                                <dd className="text-lg font-medium text-slate-900 dark:text-white">{health.missingInterpretations}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-slate-500 dark:text-slate-400">Stuck Locks</dt>
                                <dd className="text-lg font-medium text-slate-900 dark:text-white">{health.locksStuck}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-slate-500 dark:text-slate-400">Recent Failures (24h)</dt>
                                <dd className="text-lg font-medium text-slate-900 dark:text-white">{health.recentFailures}</dd>
                            </div>
                        </dl>
                    </div>

                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        Health checks use the last completed week (week_offset=-1).
                        This matches the data produced by the weekly runner.
                    </p>
                </div>
            ) : null}
        </div>
    );
}
