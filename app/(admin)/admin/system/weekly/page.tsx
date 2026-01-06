'use client';

/**
 * ADMIN: Weekly Runs Page
 * 
 * View weekly pipeline run history.
 */

import { useState, useEffect, useCallback } from 'react';

interface WeeklyRun {
    runId: string;
    weekStart: string | null;
    status: string;
    startedAt: string;
    finishedAt: string | null;
    errorMessage: string | null;
    teamsProcessed: number | null;
    teamsFailed: number | null;
}

export default function AdminWeeklyPage() {
    const [runs, setRuns] = useState<WeeklyRun[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRuns = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/system/weekly?limit=50');
            if (res.ok) {
                const data = await res.json();
                setRuns(data.runs || []);
            } else {
                setError('Failed to load weekly runs');
            }
        } catch (e: any) {
            setError('Failed to load weekly runs');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRuns();
    }, [fetchRuns]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'FAILED':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            case 'RUNNING':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            default:
                return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
        }
    };

    return (
        <div className="p-8" data-testid="admin-weekly-page">
            <header className="mb-8">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                    Weekly Runs
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                    History of weekly pipeline executions.
                </p>
            </header>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                    {error}
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading...</div>
                ) : runs.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                        No weekly runs found. Runs will appear here after the weekly pipeline executes.
                    </div>
                ) : (
                    <table className="w-full" data-testid="weekly-runs-table">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Week</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Started</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Teams</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Error</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {runs.map((run) => (
                                <tr key={run.runId}>
                                    <td className="px-4 py-3 text-sm text-slate-900 dark:text-white font-mono">
                                        {run.weekStart || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusBadge(run.status)}`}>
                                            {run.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                        {new Date(run.startedAt).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                        {run.teamsProcessed !== null ? (
                                            <span>
                                                {run.teamsProcessed}
                                                {run.teamsFailed !== null && run.teamsFailed > 0 && (
                                                    <span className="text-red-500"> ({run.teamsFailed} failed)</span>
                                                )}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-red-600 dark:text-red-400">
                                        {run.errorMessage ? (
                                            <span className="truncate max-w-xs block" title={run.errorMessage}>
                                                {run.errorMessage.slice(0, 50)}{run.errorMessage.length > 50 ? '...' : ''}
                                            </span>
                                        ) : '-'}
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
