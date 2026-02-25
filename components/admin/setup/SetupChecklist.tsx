/**
 * SetupChecklist — Renders the 5-step org onboarding status.
 *
 * Pure presentational: receives SetupStatusSummary from overviewData.ts
 * and renders step rows with status indicators and detail text.
 *
 * Used in:
 *   - /admin overview (compact)
 *   - /admin/setup (full-page, future)
 */

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SetupStatusSummary, SetupStep, StepStatus } from '@/lib/admin/overviewData';

interface SetupChecklistProps {
    data: SetupStatusSummary;
    compact?: boolean;
}

const STATUS_CONFIG: Record<StepStatus, {
    icon: React.ElementType;
    iconClass: string;
    chipClass: string;
    chipLabel: string;
}> = {
    OK: {
        icon: CheckCircle2,
        iconClass: 'text-engagement',
        chipClass: 'bg-engagement/10 text-engagement',
        chipLabel: 'OK',
    },
    AT_RISK: {
        icon: AlertTriangle,
        iconClass: 'text-withdrawal',
        chipClass: 'bg-withdrawal/10 text-withdrawal',
        chipLabel: 'AT RISK',
    },
    CRITICAL: {
        icon: XCircle,
        iconClass: 'text-strain',
        chipClass: 'bg-strain/10 text-strain',
        chipLabel: 'CRITICAL',
    },
};

function StepRow({ step, compact }: { step: SetupStep; compact: boolean }) {
    const cfg = STATUS_CONFIG[step.status];
    const Icon = cfg.icon;

    return (
        <div className={cn(
            'flex items-start gap-3',
            compact ? 'py-2' : 'py-3',
        )}>
            <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', cfg.iconClass)} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">{step.label}</span>
                    <span className={cn(
                        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider',
                        cfg.chipClass,
                    )}>
                        {cfg.chipLabel}
                    </span>
                </div>
                {!compact && (
                    <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{step.detail}</p>
                )}
            </div>
        </div>
    );
}

export function SetupChecklist({ data, compact = false }: SetupChecklistProps) {
    const allOk = data.overallStatus === 'OK';

    return (
        <div className="rounded-xl border border-white/10 bg-[#050505] p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-display font-medium text-white">Setup Status</h2>
                <span className={cn(
                    'inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono font-semibold uppercase tracking-wider',
                    STATUS_CONFIG[data.overallStatus].chipClass,
                )}>
                    {allOk
                        ? <CheckCircle2 className="w-3.5 h-3.5" />
                        : data.overallStatus === 'CRITICAL'
                            ? <XCircle className="w-3.5 h-3.5" />
                            : <AlertTriangle className="w-3.5 h-3.5" />
                    }
                    {data.overallStatus === 'OK' ? 'All Systems Ready' : data.overallStatus}
                </span>
            </div>

            <div className={cn('divide-y divide-white/5', compact && 'space-y-0')}>
                {data.steps.map(step => (
                    <StepRow key={step.key} step={step} compact={compact} />
                ))}
            </div>
        </div>
    );
}
