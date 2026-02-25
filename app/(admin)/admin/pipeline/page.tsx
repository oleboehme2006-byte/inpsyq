/**
 * /admin/pipeline — Pipeline Management
 *
 * Hybrid page:
 *   - Server shell: fetches run history from DB
 *   - Client island: TriggerPanel for manual runs
 */

import React from 'react';
import { resolveAuthContext } from '@/lib/auth/context';
import { getLatestRuns } from '@/lib/admin/overviewData';
import { TriggerPanel } from '@/components/admin/pipeline/TriggerPanel';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

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

export default async function PipelinePage() {
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

    const runs = await getLatestRuns(orgId, 20);

    return (
        <div className="p-8 max-w-[1200px] mx-auto space-y-8">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-display font-semibold text-white">Pipeline</h1>
                <p className="text-text-secondary mt-1 text-sm">
                    Trigger weekly data processing and monitor run history.
                </p>
            </div>

            {/* Trigger Panel (client island) */}
            <TriggerPanel />

            {/* Run History (server-rendered) */}
            <div className="rounded-xl border border-white/10 bg-[#050505] p-6">
                <h2 className="text-base font-display font-medium text-white mb-4">Run History</h2>

                {runs.length === 0 ? (
                    <p className="text-sm text-text-secondary py-4">
                        No pipeline runs recorded yet. Use the trigger above to run the first pass.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 text-[11px] font-mono text-text-tertiary uppercase tracking-widest">
                                    <th className="px-3 py-2">Run ID</th>
                                    <th className="px-3 py-2">Week</th>
                                    <th className="px-3 py-2">Status</th>
                                    <th className="px-3 py-2 text-right">Succeeded</th>
                                    <th className="px-3 py-2 text-right">Failed</th>
                                    <th className="px-3 py-2 text-right">Duration</th>
                                    <th className="px-3 py-2 text-right">Started</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {runs.map((run, i) => (
                                    <tr key={run.runId ?? i} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-3 py-2.5 font-mono text-[11px] text-text-tertiary truncate max-w-[120px]">
                                            {run.runId ? run.runId.slice(0, 8) + '…' : '—'}
                                        </td>
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
                                        <td className="px-3 py-2.5 text-right font-mono text-xs text-text-tertiary">
                                            {run.durationMs != null
                                                ? `${(run.durationMs / 1000).toFixed(1)}s`
                                                : '—'}
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

                {runs.some(r => r.errorMessage) && (
                    <div className="mt-4 space-y-2">
                        <p className="text-xs font-mono text-text-tertiary uppercase tracking-wider">Error Details</p>
                        {runs.filter(r => r.errorMessage).map((r, i) => (
                            <div key={i} className="rounded-lg bg-strain/5 border border-strain/20 px-3 py-2">
                                <span className="text-xs font-mono text-text-tertiary">{r.weekStart}: </span>
                                <span className="text-xs text-strain">{r.errorMessage}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}
