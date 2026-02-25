/**
 * /admin — Admin Overview
 *
 * Server component. Fetches four data sources in parallel:
 *   1. Setup status (4-step onboarding health)
 *   2. Org health snapshot (team OK / Degraded / Failed counts)
 *   3. Latest 3 pipeline runs
 *   4. Active alerts (top 5)
 *
 * Renders a live operational snapshot — no static placeholder cards.
 */

import React from 'react';
import { resolveAuthContext } from '@/lib/auth/context';
import {
    getSetupStatusSummary,
    getOrgHealthSummary,
    getLatestRuns,
    getRecentAlerts,
} from '@/lib/admin/overviewData';
import { SetupChecklist } from '@/components/admin/setup/SetupChecklist';
import {
    AlertTriangle, AlertCircle, CheckCircle2, XCircle,
    Activity, Clock, Users, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

// ─── Status helpers ───────────────────────────────────────────────────────────

function RunStatusBadge({ status }: { status: string }) {
    const cfg: Record<string, string> = {
        COMPLETED: 'bg-engagement/10 text-engagement',
        PARTIAL:   'bg-withdrawal/10 text-withdrawal',
        FAILED:    'bg-strain/10 text-strain',
        DRY_RUN:   'bg-[#8B5CF6]/10 text-[#8B5CF6]',
        UNKNOWN:   'bg-white/10 text-text-secondary',
    };
    return (
        <span className={cn(
            'inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider',
            cfg[status] ?? cfg.UNKNOWN,
        )}>
            {status}
        </span>
    );
}

function AlertSeverityIcon({ severity }: { severity: string }) {
    if (severity === 'critical') return <XCircle    className="w-4 h-4 text-strain"     />;
    if (severity === 'warning')  return <AlertTriangle className="w-4 h-4 text-withdrawal" />;
    return                               <AlertCircle  className="w-4 h-4 text-[#8B5CF6]" />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminOverviewPage() {
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

    // Parallel fetch — all four sources at once
    const [setupData, healthData, recentRuns, alerts] = await Promise.all([
        getSetupStatusSummary(orgId),
        getOrgHealthSummary(orgId),
        getLatestRuns(orgId, 3),
        getRecentAlerts(orgId, 5),
    ]);

    const latestRun = recentRuns[0] ?? null;
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-8">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-display font-semibold text-white">Admin Overview</h1>
                <p className="text-text-secondary mt-1 text-sm">
                    Live operational snapshot for your organization.
                </p>
            </div>

            {/* Critical alert banner (only if CRITICAL items exist) */}
            {criticalAlerts.length > 0 && (
                <div className="rounded-xl border border-strain/30 bg-strain/5 p-4 flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-strain shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-strain">
                            {criticalAlerts.length} critical issue{criticalAlerts.length !== 1 ? 's' : ''} require attention
                        </p>
                        <p className="text-xs text-text-secondary mt-0.5">
                            {criticalAlerts[0].message}
                        </p>
                    </div>
                    <Link
                        href="/admin/system"
                        className="ml-auto text-xs font-medium text-strain hover:text-white transition-colors whitespace-nowrap"
                    >
                        View alerts →
                    </Link>
                </div>
            )}

            {/* Top row: 4 stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Teams OK */}
                <div className="rounded-xl border border-white/10 bg-[#050505] p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-4 h-4 text-engagement" />
                        <span className="text-xs font-mono text-text-tertiary uppercase tracking-wider">Teams OK</span>
                    </div>
                    <p className="text-3xl font-display font-semibold text-white">{healthData.okTeams}</p>
                    <p className="text-xs text-text-secondary mt-1">of {healthData.totalTeams} total</p>
                </div>

                {/* Degraded */}
                <div className="rounded-xl border border-white/10 bg-[#050505] p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-withdrawal" />
                        <span className="text-xs font-mono text-text-tertiary uppercase tracking-wider">Degraded</span>
                    </div>
                    <p className={cn('text-3xl font-display font-semibold', healthData.degradedTeams > 0 ? 'text-withdrawal' : 'text-white')}>
                        {healthData.degradedTeams}
                    </p>
                    <p className="text-xs text-text-secondary mt-1">teams with fallback data</p>
                </div>

                {/* Failed */}
                <div className="rounded-xl border border-white/10 bg-[#050505] p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <XCircle className="w-4 h-4 text-strain" />
                        <span className="text-xs font-mono text-text-tertiary uppercase tracking-wider">Failed</span>
                    </div>
                    <p className={cn('text-3xl font-display font-semibold', healthData.failedTeams > 0 ? 'text-strain' : 'text-white')}>
                        {healthData.failedTeams}
                    </p>
                    <p className="text-xs text-text-secondary mt-1">pipeline failures this week</p>
                </div>

                {/* Latest Run */}
                <div className="rounded-xl border border-white/10 bg-[#050505] p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-4 h-4 text-[#8B5CF6]" />
                        <span className="text-xs font-mono text-text-tertiary uppercase tracking-wider">Last Run</span>
                    </div>
                    {latestRun ? (
                        <>
                            <RunStatusBadge status={latestRun.status} />
                            <p className="text-xs text-text-secondary mt-2">
                                {latestRun.startedAt ?? 'Unknown time'}
                            </p>
                        </>
                    ) : (
                        <p className="text-sm text-text-secondary">No runs yet</p>
                    )}
                </div>
            </div>

            {/* Middle row: Setup checklist + Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Setup Checklist */}
                <SetupChecklist data={setupData} compact={false} />

                {/* Alerts Feed */}
                <div className="rounded-xl border border-white/10 bg-[#050505] p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-display font-medium text-white">Active Alerts</h2>
                        <Link href="/admin/system" className="text-xs text-[#8B5CF6] hover:text-white transition-colors">
                            View all →
                        </Link>
                    </div>

                    {alerts.length === 0 ? (
                        <div className="flex items-center gap-2 py-6 text-text-tertiary">
                            <CheckCircle2 className="w-5 h-5 text-engagement" />
                            <span className="text-sm">No active alerts — system is healthy.</span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {alerts.map(alert => (
                                <div
                                    key={alert.alertId}
                                    className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0"
                                >
                                    <AlertSeverityIcon severity={alert.severity} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-mono text-text-tertiary uppercase tracking-wider">
                                            {alert.alertType.replace(/_/g, ' ')}
                                            {alert.isComputed && (
                                                <span className="ml-2 text-[#8B5CF6]">· computed</span>
                                            )}
                                        </p>
                                        <p className="text-sm text-text-secondary mt-0.5 leading-snug">{alert.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom row: Recent pipeline runs */}
            <div className="rounded-xl border border-white/10 bg-[#050505] p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-display font-medium text-white">Recent Pipeline Runs</h2>
                    <Link href="/admin/pipeline" className="text-xs text-[#8B5CF6] hover:text-white transition-colors">
                        Manage pipeline →
                    </Link>
                </div>

                {recentRuns.length === 0 ? (
                    <div className="flex items-center gap-3 py-4 text-text-secondary">
                        <Zap className="w-5 h-5 text-text-tertiary" />
                        <div>
                            <p className="text-sm">No pipeline runs recorded yet.</p>
                            <Link href="/admin/pipeline" className="text-xs text-[#8B5CF6] hover:underline mt-0.5 block">
                                Trigger the first run →
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 text-[11px] font-mono text-text-tertiary uppercase tracking-widest">
                                    <th className="px-3 py-2">Week</th>
                                    <th className="px-3 py-2">Status</th>
                                    <th className="px-3 py-2 text-right">Teams Processed</th>
                                    <th className="px-3 py-2 text-right">Teams Failed</th>
                                    <th className="px-3 py-2 text-right">Started</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {recentRuns.map((run, i) => (
                                    <tr key={run.runId ?? i} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-3 py-2.5 font-mono text-xs text-text-secondary">
                                            {run.weekStart ?? '—'}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <RunStatusBadge status={run.status} />
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-mono text-xs text-engagement">
                                            {run.teamsProcessed}
                                        </td>
                                        <td className={cn(
                                            'px-3 py-2.5 text-right font-mono text-xs',
                                            run.teamsFailed > 0 ? 'text-strain' : 'text-text-tertiary',
                                        )}>
                                            {run.teamsFailed}
                                        </td>
                                        <td className="px-3 py-2.5 text-right text-xs text-text-tertiary">
                                            {run.startedAt ?? '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Quick-action nav tiles */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { href: '/admin/users',    label: 'Manage Users',    icon: Users,         color: 'text-blue-400',   bg: 'bg-blue-400/10' },
                    { href: '/admin/teams',    label: 'Manage Teams',    icon: Activity,      color: 'text-purple-400', bg: 'bg-purple-400/10' },
                    { href: '/admin/roster',   label: 'Import Roster',   icon: Users,         color: 'text-emerald-400',bg: 'bg-emerald-400/10' },
                    { href: '/admin/pipeline', label: 'Run Pipeline',    icon: Zap,           color: 'text-amber-400',  bg: 'bg-amber-400/10' },
                ].map(card => {
                    const Icon = card.icon;
                    return (
                        <Link
                            key={card.href}
                            href={card.href}
                            className="rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all p-5 flex items-center gap-3 group"
                        >
                            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform', card.bg)}>
                                <Icon className={cn('w-4 h-4', card.color)} />
                            </div>
                            <span className="text-sm font-medium text-text-secondary group-hover:text-white transition-colors">
                                {card.label}
                            </span>
                        </Link>
                    );
                })}
            </div>

        </div>
    );
}
