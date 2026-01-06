'use client';
/**
 * Admin Setup Wizard Page
 * 
 * Step-by-step onboarding checklist to make an org operational.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/admin/AdminShell';

type StepStatus = 'OK' | 'AT_RISK' | 'CRITICAL';

interface StepResult {
    status: StepStatus;
    [key: string]: any;
}

interface SetupStatus {
    ok: boolean;
    orgId: string;
    orgName: string;
    targetWeekStart: string;
    steps: {
        orgSelected: StepResult;
        teams: StepResult;
        access: StepResult;
        pipeline: StepResult;
        dashboards: StepResult;
    };
}

interface RunWeeklyResult {
    ok: boolean;
    result?: {
        status: 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'DRY_RUN';
        weekStart: string;
        durationMs: number;
        counts?: {
            teamsTotal: number;
            teamsSuccess: number;
            teamsFailed: number;
        };
        error?: string;
    };
    error?: { code: string; message: string };
}

export default function AdminSetupPage() {
    const [status, setStatus] = useState<SetupStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [runningWeekly, setRunningWeekly] = useState(false);
    const [dryRun, setDryRun] = useState(true);
    const [weeklyResult, setWeeklyResult] = useState<RunWeeklyResult | null>(null);

    const fetchStatus = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/setup/status');
            if (!res.ok) throw new Error('Failed to fetch status');
            const data = await res.json();
            setStatus(data);
        } catch (e: any) {
            setError(e.message || 'Failed to load setup status');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    const handleRunWeekly = async () => {
        setRunningWeekly(true);
        setWeeklyResult(null);
        try {
            const res = await fetch('/api/admin/system/run-weekly', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ week_offset: -1, dry_run: dryRun }),
            });
            const data = await res.json();
            setWeeklyResult(data);
            // Auto refresh status after run
            if (data.ok) {
                await fetchStatus();
            }
        } catch (e: any) {
            setWeeklyResult({ ok: false, error: { code: 'NETWORK', message: e.message } });
        } finally {
            setRunningWeekly(false);
        }
    };

    const getStatusBadge = (s: StepStatus) => {
        switch (s) {
            case 'OK':
                return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'AT_RISK':
                return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'CRITICAL':
                return 'bg-red-500/20 text-red-400 border-red-500/30';
        }
    };

    const getStatusIcon = (s: StepStatus) => {
        switch (s) {
            case 'OK':
                return '✓';
            case 'AT_RISK':
                return '⚠';
            case 'CRITICAL':
                return '✗';
        }
    };

    return (
        <AdminShell>
            <div className="p-8" data-testid="admin-setup-page">
                <header className="mb-8 flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                            Setup Wizard
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            Complete these steps to make your organization operational.
                        </p>
                    </div>
                    <button
                        onClick={fetchStatus}
                        disabled={loading}
                        data-testid="setup-refresh"
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                    >
                        {loading ? 'Refreshing...' : 'Re-check'}
                    </button>
                </header>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                        {error}
                    </div>
                )}

                {status && (
                    <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                            Target Week: <strong className="text-slate-900 dark:text-white">{status.targetWeekStart}</strong>
                            {' | '}
                            Org: <strong className="text-slate-900 dark:text-white">{status.orgName}</strong>
                        </span>
                    </div>
                )}

                {loading && !status ? (
                    <div className="text-slate-500">Loading...</div>
                ) : status ? (
                    <div className="space-y-4">
                        {/* Step A: Org Selected */}
                        <div
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6"
                            data-testid="setup-step-A"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium border ${getStatusBadge(status.steps.orgSelected.status)}`}>
                                        {getStatusIcon(status.steps.orgSelected.status)}
                                    </span>
                                    <div>
                                        <h3 className="font-medium text-slate-900 dark:text-white">A. Organization Selected</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                            You are managing <strong>{status.orgName}</strong>
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href="/org/select"
                                    className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                                >
                                    Switch Org
                                </Link>
                            </div>
                        </div>

                        {/* Step B: Teams */}
                        <div
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6"
                            data-testid="setup-step-B"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium border ${getStatusBadge(status.steps.teams.status)}`}>
                                        {getStatusIcon(status.steps.teams.status)}
                                    </span>
                                    <div>
                                        <h3 className="font-medium text-slate-900 dark:text-white">B. Teams Created</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                            {status.steps.teams.activeCount} active team{status.steps.teams.activeCount !== 1 ? 's' : ''}
                                            {status.steps.teams.status === 'CRITICAL' && ' — Create at least one team to proceed'}
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href="/admin/teams"
                                    className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                                >
                                    Manage Teams
                                </Link>
                            </div>
                        </div>

                        {/* Step C: Access */}
                        <div
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6"
                            data-testid="setup-step-C"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium border ${getStatusBadge(status.steps.access.status)}`}>
                                        {getStatusIcon(status.steps.access.status)}
                                    </span>
                                    <div>
                                        <h3 className="font-medium text-slate-900 dark:text-white">C. Access Configured</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                            {status.steps.access.memberCount} member{status.steps.access.memberCount !== 1 ? 's' : ''}
                                            {status.steps.access.inviteCount > 0 && `, ${status.steps.access.inviteCount} pending invite${status.steps.access.inviteCount !== 1 ? 's' : ''}`}
                                        </p>
                                        {status.steps.access.note && (
                                            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                                                {status.steps.access.note}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <Link
                                    href="/admin/invites"
                                    className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                                >
                                    Invite Users
                                </Link>
                            </div>
                        </div>

                        {/* Step D: Pipeline */}
                        <div
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6"
                            data-testid="setup-step-D"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium border ${getStatusBadge(status.steps.pipeline.status)}`}>
                                        {getStatusIcon(status.steps.pipeline.status)}
                                    </span>
                                    <div>
                                        <h3 className="font-medium text-slate-900 dark:text-white">D. Weekly Pipeline</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                            {status.steps.pipeline.okTeamsCount} OK, {status.steps.pipeline.degradedTeamsCount} degraded, {status.steps.pipeline.missingTeamsCount} missing
                                            {!status.steps.pipeline.hasProducts && ' — No products generated yet'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <input
                                            type="checkbox"
                                            checked={dryRun}
                                            onChange={(e) => setDryRun(e.target.checked)}
                                            data-testid="setup-run-weekly-dryrun-toggle"
                                            className="rounded"
                                        />
                                        Dry run
                                    </label>
                                    <button
                                        onClick={handleRunWeekly}
                                        disabled={runningWeekly}
                                        data-testid="setup-run-weekly"
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                                    >
                                        {runningWeekly ? 'Running...' : 'Run Weekly'}
                                    </button>
                                </div>
                            </div>

                            {weeklyResult && (
                                <div
                                    className={`mt-4 p-4 rounded-lg text-sm ${weeklyResult.ok
                                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                        }`}
                                    data-testid="setup-run-weekly-result"
                                >
                                    {weeklyResult.ok && weeklyResult.result ? (
                                        <div>
                                            <strong>Status: {weeklyResult.result.status}</strong>
                                            <span className="ml-2">({weeklyResult.result.durationMs}ms)</span>
                                            {weeklyResult.result.counts && (
                                                <span className="ml-2">
                                                    — {weeklyResult.result.counts.teamsSuccess}/{weeklyResult.result.counts.teamsTotal} teams
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <div>
                                            <strong>Error:</strong> {weeklyResult.error?.message || 'Unknown error'}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Step E: Dashboards */}
                        <div
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6"
                            data-testid="setup-step-E"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium border ${getStatusBadge(status.steps.dashboards.status)}`}>
                                        {getStatusIcon(status.steps.dashboards.status)}
                                    </span>
                                    <div>
                                        <h3 className="font-medium text-slate-900 dark:text-white">E. Dashboards Ready</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                            Executive: {status.steps.dashboards.executiveOk ? '✓' : '✗'}
                                            {status.steps.dashboards.sampleTeamId && (
                                                <> | Sample Team: {status.steps.dashboards.sampleTeamOk ? '✓' : '✗'}</>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Link
                                        href="/executive"
                                        className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                                    >
                                        Executive
                                    </Link>
                                    {status.steps.dashboards.sampleTeamId && (
                                        <Link
                                            href={`/team/${status.steps.dashboards.sampleTeamId}`}
                                            className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                                        >
                                            Team
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </AdminShell>
    );
}
