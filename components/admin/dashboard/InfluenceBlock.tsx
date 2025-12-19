'use client';

import React from 'react';
import { DriverAttribution } from '@/lib/dashboard/types';
import { InfluenceScope } from '@/services/decision/types';
import { safeToFixed } from '@/lib/utils/safeNumber';

interface InfluenceBlockProps {
    drivers: DriverAttribution[];
}

const SCOPE_INFO: Record<InfluenceScope, { label: string; description: string; color: string }> = {
    LEADERSHIP: {
        label: 'Leadership',
        description: 'Directly controllable by team leads',
        color: 'border-green-600 bg-green-900/20'
    },
    TEAM: {
        label: 'Team',
        description: 'Team-level interventions possible',
        color: 'border-blue-600 bg-blue-900/20'
    },
    ORGANIZATION: {
        label: 'Organization',
        description: 'Requires org-level coordination',
        color: 'border-purple-600 bg-purple-900/20'
    },
    SYSTEMIC: {
        label: 'Systemic',
        description: 'Structural factors beyond direct control',
        color: 'border-slate-600 bg-slate-800/40'
    },
    INDIVIDUAL: {
        label: 'Individual',
        description: 'Personal factors, support-based approach',
        color: 'border-amber-600 bg-amber-900/20'
    },
};

export default function InfluenceBlock({ drivers }: InfluenceBlockProps) {
    // Group drivers by scope
    const grouped: Record<string, DriverAttribution[]> = {};
    drivers.forEach(d => {
        const scope = d.scope || 'SYSTEMIC';
        if (!grouped[scope]) grouped[scope] = [];
        grouped[scope].push(d);
    });

    const actionableDrivers = drivers.filter(d => d.is_actionable);
    const nonActionableDrivers = drivers.filter(d => !d.is_actionable);

    if (drivers.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500 italic">
                No driver influence data available
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Actionable Summary */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-800/50">
                <div className="w-10 h-10 rounded-lg bg-green-900/30 border border-green-700/50 flex items-center justify-center">
                    <span className="text-green-400 text-lg">✓</span>
                </div>
                <div>
                    <div className="text-sm font-medium text-slate-200">
                        {actionableDrivers.length} of {drivers.length} drivers actionable
                    </div>
                    <div className="text-xs text-slate-500">
                        {actionableDrivers.length > 0
                            ? 'Focus on these for direct impact'
                            : 'Limited direct control available'}
                    </div>
                </div>
            </div>

            {/* Grouped Drivers */}
            <div className="space-y-3">
                {(['LEADERSHIP', 'TEAM', 'ORGANIZATION', 'SYSTEMIC', 'INDIVIDUAL'] as InfluenceScope[]).map(scope => {
                    const scopeDrivers = grouped[scope];
                    if (!scopeDrivers || scopeDrivers.length === 0) return null;

                    const info = SCOPE_INFO[scope];
                    const scopeActionable = scopeDrivers.filter(d => d.is_actionable);

                    return (
                        <div
                            key={scope}
                            className={`rounded-lg border-l-4 ${info.color} p-3`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-300">{info.label}</span>
                                <span className="text-xs text-slate-500">
                                    {scopeActionable.length}/{scopeDrivers.length} actionable
                                </span>
                            </div>
                            <div className="space-y-1">
                                {scopeDrivers.slice(0, 3).map(d => (
                                    <div key={d.construct} className="flex items-center gap-2 text-sm">
                                        <span className={d.is_actionable ? 'text-slate-300' : 'text-slate-500'}>
                                            {d.label}
                                        </span>
                                        <span className="text-xs text-slate-600">
                                            {safeToFixed(d.impact * 100, 0)}%
                                        </span>
                                        {d.is_actionable && (
                                            <span className="text-green-400 text-xs">✓</span>
                                        )}
                                    </div>
                                ))}
                                {scopeDrivers.length > 3 && (
                                    <div className="text-xs text-slate-600">
                                        +{scopeDrivers.length - 3} more
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Non-actionable note */}
            {nonActionableDrivers.length > actionableDrivers.length && (
                <p className="text-xs text-slate-500 italic pt-2">
                    Note: Most identified drivers are systemic. Consider escalation for structural interventions.
                </p>
            )}
        </div>
    );
}
