'use client';

/**
 * RetentionPanel — Client island for data retention management.
 *
 * 1. Computes a dry-run plan via POST /api/admin/system/retention/plan
 * 2. Displays what would be cleaned up (row counts per category)
 * 3. Requires explicit "APPLY" confirmation before executing
 * 4. Applies via POST /api/admin/system/retention/apply
 */

import React, { useState } from 'react';
import { Trash2, Loader2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RetentionCategory {
    label: string;
    count: number;
    table: string;
}

interface RetentionPlan {
    categories: RetentionCategory[];
    totalRows: number;
    estimatedAgeWeeks: number;
}

type Phase = 'idle' | 'planning' | 'plan_ready' | 'confirming' | 'applying' | 'done' | 'error';

export function RetentionPanel() {
    const [phase, setPhase]       = useState<Phase>('idle');
    const [plan, setPlan]         = useState<RetentionPlan | null>(null);
    const [confirmText, setConfirmText] = useState('');
    const [applyResult, setApplyResult] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const computePlan = async () => {
        setPhase('planning');
        setErrorMsg(null);
        setPlan(null);
        try {
            const res = await fetch('/api/admin/system/retention/plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                setErrorMsg(data.error?.message ?? 'Failed to compute plan.');
                setPhase('error');
                return;
            }
            // Normalize plan shape from the API response
            const rawPlan = data.plan ?? {};
            const counts: Record<string, number> = rawPlan.counts ?? {};
            const categories: RetentionCategory[] = Object.entries(counts).map(([table, count]) => ({
                label: table.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                table,
                count: count as number,
            })).filter(c => c.count > 0);

            const totalRows = categories.reduce((s, c) => s + c.count, 0);
            setPlan({
                categories,
                totalRows,
                estimatedAgeWeeks: rawPlan.estimatedAgeWeeks ?? 0,
            });
            setPhase('plan_ready');
        } catch (e: any) {
            setErrorMsg(e.message ?? 'Unexpected error.');
            setPhase('error');
        }
    };

    const applyPlan = async () => {
        if (confirmText !== 'APPLY') return;
        setPhase('applying');
        setErrorMsg(null);
        try {
            const res = await fetch('/api/admin/system/retention/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirm: 'APPLY' }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                setErrorMsg(data.error?.message ?? 'Apply failed.');
                setPhase('error');
                return;
            }
            const result = data.result ?? {};
            const deleted = Object.values(result as Record<string, number>).reduce((s: number, v) => s + (v as number), 0);
            setApplyResult(`Retention applied. ${deleted} row${deleted !== 1 ? 's' : ''} removed.`);
            setPhase('done');
        } catch (e: any) {
            setErrorMsg(e.message ?? 'Unexpected error.');
            setPhase('error');
        }
    };

    return (
        <div className="rounded-xl border border-white/10 bg-[#050505] p-6 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-base font-display font-medium text-white">Data Retention</h2>
                    <p className="text-xs text-text-secondary mt-0.5">
                        Compute and optionally apply retention cleanup for old pipeline data.
                    </p>
                </div>
                {phase === 'idle' || phase === 'error' ? (
                    <button
                        onClick={computePlan}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white/70 border border-white/10 hover:bg-white/5 transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Compute Plan
                    </button>
                ) : null}
            </div>

            {/* Error */}
            {errorMsg && (
                <div className="flex items-start gap-2 rounded-lg bg-strain/10 border border-strain/20 p-3">
                    <XCircle className="w-4 h-4 text-strain shrink-0 mt-0.5" />
                    <p className="text-sm text-strain">{errorMsg}</p>
                </div>
            )}

            {/* Planning / applying spinners */}
            {phase === 'applying' && (
                <div className="flex items-center gap-2 text-text-secondary py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Applying retention cleanup…</span>
                </div>
            )}

            {phase === 'planning' && (
                <div className="flex items-center gap-2 text-text-secondary py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Computing retention plan…</span>
                </div>
            )}

            {/* Plan ready */}
            {(phase === 'plan_ready' || phase === 'confirming') && plan && (
                <div className="space-y-3">
                    {plan.totalRows === 0 ? (
                        <div className="flex items-center gap-2 text-engagement py-2">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-sm">No data eligible for cleanup. Retention is up to date.</span>
                        </div>
                    ) : (
                        <>
                            <div className="rounded-lg bg-white/[0.02] border border-white/5 divide-y divide-white/5">
                                {plan.categories.map(cat => (
                                    <div key={cat.table} className="flex items-center justify-between px-4 py-2.5">
                                        <span className="text-sm text-text-secondary">{cat.label}</span>
                                        <span className="font-mono text-xs text-withdrawal font-semibold">{cat.count.toLocaleString()} rows</span>
                                    </div>
                                ))}
                                <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.02]">
                                    <span className="text-sm font-medium text-white">Total</span>
                                    <span className="font-mono text-sm text-strain font-semibold">{plan.totalRows.toLocaleString()} rows</span>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 rounded-lg bg-withdrawal/5 border border-withdrawal/20 p-3">
                                <AlertTriangle className="w-4 h-4 text-withdrawal shrink-0 mt-0.5" />
                                <p className="text-xs text-withdrawal">
                                    This action is <strong>irreversible</strong>. Type <code className="font-mono bg-white/10 px-1 rounded">APPLY</code> below to confirm.
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={e => setConfirmText(e.target.value)}
                                    placeholder="Type APPLY to confirm"
                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-strain"
                                />
                                <button
                                    onClick={applyPlan}
                                    disabled={confirmText !== 'APPLY'}
                                    className={cn(
                                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                                        confirmText === 'APPLY'
                                            ? 'bg-strain/20 text-strain border border-strain/30 hover:bg-strain/30'
                                            : 'bg-white/5 text-text-tertiary border border-white/10 cursor-not-allowed',
                                    )}
                                >
                                    <Trash2 className="w-4 h-4" /> Apply
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Done */}
            {phase === 'done' && applyResult && (
                <div className="flex items-center gap-2 text-engagement py-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm">{applyResult}</span>
                </div>
            )}
        </div>
    );
}
