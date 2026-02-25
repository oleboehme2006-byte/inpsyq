'use client';

/**
 * TriggerPanel — Client island for manually triggering the weekly pipeline.
 *
 * Posts to POST /api/admin/system/run-weekly and displays the live result.
 * Isolated as a client component so the surrounding page stays server-rendered.
 */

import React, { useState } from 'react';
import { Zap, AlertTriangle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type RunStatus = 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'DRY_RUN';

interface RunResult {
    status: RunStatus;
    weekStart: string;
    durationMs: number;
    runId: string;
    counts: {
        teamsTotal: number;
        teamsSuccess: number;
        teamsFailed: number;
        pipelineUpserts: number;
        interpretationGenerations: number;
    };
    error?: string;
}

export function TriggerPanel() {
    const [dryRun, setDryRun]     = useState(false);
    const [weekOffset, setWeekOffset] = useState(-1);
    const [loading, setLoading]   = useState(false);
    const [result, setResult]     = useState<RunResult | null>(null);
    const [error, setError]       = useState<string | null>(null);

    const handleTrigger = async () => {
        setLoading(true);
        setResult(null);
        setError(null);

        try {
            const res = await fetch('/api/admin/system/run-weekly', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ week_offset: weekOffset, dry_run: dryRun }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                setError(data.error?.message ?? data.message ?? 'Pipeline run failed.');
            } else {
                setResult({
                    status:     data.status,
                    weekStart:  data.weekStart,
                    durationMs: data.durationMs ?? 0,
                    runId:      data.runId,
                    counts:     data.counts ?? {
                        teamsTotal: 0, teamsSuccess: 0, teamsFailed: 0,
                        pipelineUpserts: 0, interpretationGenerations: 0,
                    },
                    error: data.status === 'FAILED' ? data.message : undefined,
                });
            }
        } catch (e: any) {
            setError(e.message ?? 'Unexpected error triggering pipeline.');
        } finally {
            setLoading(false);
        }
    };

    const statusConfig: Record<RunStatus, { icon: React.ElementType; color: string; bg: string; label: string }> = {
        COMPLETED: { icon: CheckCircle2, color: 'text-engagement', bg: 'bg-engagement/10', label: 'Completed' },
        PARTIAL:   { icon: AlertTriangle,color: 'text-withdrawal', bg: 'bg-withdrawal/10', label: 'Partial'  },
        FAILED:    { icon: XCircle,      color: 'text-strain',     bg: 'bg-strain/10',     label: 'Failed'   },
        DRY_RUN:   { icon: Zap,          color: 'text-[#8B5CF6]',  bg: 'bg-[#8B5CF6]/10', label: 'Dry Run'  },
    };

    return (
        <div className="rounded-xl border border-white/10 bg-[#050505] p-6 space-y-5">
            <div>
                <h2 className="text-base font-display font-medium text-white">Manual Trigger</h2>
                <p className="text-xs text-text-secondary mt-1">
                    Runs aggregation, attribution, and interpretation for all teams in this org.
                </p>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-end gap-4">
                {/* Week Offset */}
                <div className="space-y-1">
                    <label className="text-xs font-mono text-text-tertiary uppercase tracking-wider">Week Offset</label>
                    <select
                        value={weekOffset}
                        onChange={e => setWeekOffset(Number(e.target.value))}
                        disabled={loading}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#8B5CF6] disabled:opacity-50"
                    >
                        <option value={-1}>-1 (last completed week)</option>
                        <option value={-2}>-2 (two weeks ago)</option>
                        <option value={0}>0 (current week)</option>
                    </select>
                </div>

                {/* Dry Run toggle */}
                <div className="flex items-center gap-2 pb-2">
                    <button
                        type="button"
                        onClick={() => setDryRun(!dryRun)}
                        disabled={loading}
                        className={cn(
                            'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50',
                            dryRun ? 'bg-[#8B5CF6]' : 'bg-white/10',
                        )}
                        aria-label="Toggle dry run"
                    >
                        <span className={cn(
                            'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
                            dryRun ? 'translate-x-[18px]' : 'translate-x-0.5',
                        )} />
                    </button>
                    <span className="text-sm text-text-secondary">Dry Run</span>
                    {dryRun && (
                        <span className="text-xs font-mono text-[#8B5CF6]">(simulates without writing)</span>
                    )}
                </div>

                {/* Trigger button */}
                <button
                    onClick={handleTrigger}
                    disabled={loading}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                        dryRun
                            ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] hover:bg-[#8B5CF6]/30 border border-[#8B5CF6]/30'
                            : 'bg-[#8B5CF6] text-white hover:bg-[#7C3AED]',
                        loading && 'opacity-60 cursor-not-allowed',
                    )}
                >
                    {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Running…</>
                    ) : (
                        <><Zap className="w-4 h-4" /> {dryRun ? 'Simulate Run' : 'Run Pipeline'}</>
                    )}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-start gap-2 rounded-lg bg-strain/10 border border-strain/20 p-3">
                    <XCircle className="w-4 h-4 text-strain shrink-0 mt-0.5" />
                    <p className="text-sm text-strain">{error}</p>
                </div>
            )}

            {/* Result */}
            {result && (() => {
                const cfg = statusConfig[result.status];
                const Icon = cfg.icon;
                return (
                    <div className={cn('rounded-lg border p-4 space-y-3', cfg.bg, 'border-white/10')}>
                        <div className="flex items-center gap-2">
                            <Icon className={cn('w-5 h-5', cfg.color)} />
                            <span className={cn('font-medium text-sm', cfg.color)}>{cfg.label}</span>
                            <span className="text-xs font-mono text-text-tertiary ml-auto">
                                Week {result.weekStart} · {(result.durationMs / 1000).toFixed(1)}s
                            </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            {[
                                { label: 'Teams Total',    value: result.counts.teamsTotal },
                                { label: 'Succeeded',      value: result.counts.teamsSuccess, highlight: 'text-engagement' },
                                { label: 'Failed',         value: result.counts.teamsFailed,  highlight: result.counts.teamsFailed > 0 ? 'text-strain' : undefined },
                                { label: 'Interpretations', value: result.counts.interpretationGenerations },
                            ].map(stat => (
                                <div key={stat.label} className="rounded-lg bg-white/5 px-3 py-2">
                                    <p className="text-text-tertiary font-mono">{stat.label}</p>
                                    <p className={cn('text-xl font-display font-semibold text-white mt-0.5', stat.highlight)}>
                                        {stat.value}
                                    </p>
                                </div>
                            ))}
                        </div>
                        {result.error && (
                            <p className="text-xs text-strain">{result.error}</p>
                        )}
                    </div>
                );
            })()}
        </div>
    );
}
