'use client';

/**
 * ADMIN: System Alerts Page
 * 
 * View stored and computed alerts.
 */

import { useState, useEffect, useCallback } from 'react';

interface Alert {
    alertId: string;
    alertType: string;
    severity: string;
    message: string;
    targetWeekStart?: string;
    details?: any;
    createdAt?: string;
    computedAt?: string;
    resolvedAt?: string;
    isComputed: boolean;
}

export default function AdminAlertsPage() {
    const [storedAlerts, setStoredAlerts] = useState<Alert[]>([]);
    const [computedAlerts, setComputedAlerts] = useState<Alert[]>([]);
    const [hasStoredAlerts, setHasStoredAlerts] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAlerts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/system/alerts?limit=100');
            if (res.ok) {
                const data = await res.json();
                setStoredAlerts(data.storedAlerts || []);
                setComputedAlerts(data.computedAlerts || []);
                setHasStoredAlerts(data.hasStoredAlerts || false);
            } else {
                setError('Failed to load alerts');
            }
        } catch (e: any) {
            setError('Failed to load alerts');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAlerts();
    }, [fetchAlerts]);

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            case 'warning':
                return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
            case 'info':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            default:
                return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
        }
    };

    const allAlerts = [...computedAlerts, ...storedAlerts];

    return (
        <div className="p-8" data-testid="admin-alerts-page">
            <header className="mb-8 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                        System Alerts
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Current and historical system alerts.
                    </p>
                </div>
                <button
                    onClick={fetchAlerts}
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

            {!hasStoredAlerts && computedAlerts.length > 0 && (
                <div className="mb-6 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
                    Computed alerts (not stored). These represent the current system state.
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading...</div>
                ) : allAlerts.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                        No alerts. The system is healthy.
                    </div>
                ) : (
                    <table className="w-full" data-testid="alerts-table">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Severity</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Message</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Week</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {allAlerts.map((alert) => (
                                <tr key={alert.alertId}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                                                {alert.alertType}
                                            </span>
                                            {alert.isComputed && (
                                                <span className="text-xs text-slate-400">(computed)</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded uppercase ${getSeverityBadge(alert.severity)}`}>
                                            {alert.severity}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 max-w-md">
                                        {alert.message}
                                        {alert.details && (
                                            <div className="mt-1 text-xs text-slate-400">
                                                {JSON.stringify(alert.details)}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 font-mono">
                                        {alert.targetWeekStart || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                        {alert.createdAt
                                            ? new Date(alert.createdAt).toLocaleString()
                                            : alert.computedAt
                                                ? 'Now'
                                                : '-'
                                        }
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
