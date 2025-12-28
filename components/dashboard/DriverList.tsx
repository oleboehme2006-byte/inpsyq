'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Minus, Target, Zap, Shield, Users } from 'lucide-react';
import { PARAMETER_DEFINITIONS } from '@/lib/dashboard/indexSemantics';
import { safeToFixed, safeNumber } from '@/lib/utils/safeNumber';

// ==========================================
// Types
// ==========================================

export interface Driver {
    id: string;
    label: string;
    impact: number;        // 0-1 contribution magnitude
    direction: 'positive' | 'negative';
    scope: 'ORGANIZATION' | 'TEAM' | 'LEADERSHIP' | 'INDIVIDUAL' | 'SYSTEMIC';
    causalLabel?: 'strong_causal' | 'likely_causal' | 'correlational' | 'unknown';
    isActionable?: boolean;
    explanation?: string;
}

export interface DriverListProps {
    drivers: Driver[];
    type: 'positive' | 'negative';
    maxItems?: number;
    showImpactBars?: boolean;
    compact?: boolean;
}

// ==========================================
// Scope Icons
// ==========================================

const ScopeIcon: React.FC<{ scope: Driver['scope'] }> = ({ scope }) => {
    const iconClass = "w-3.5 h-3.5 text-text-tertiary";

    switch (scope) {
        case 'ORGANIZATION':
            return <Target className={iconClass} />;
        case 'LEADERSHIP':
            return <Shield className={iconClass} />;
        case 'TEAM':
            return <Users className={iconClass} />;
        case 'SYSTEMIC':
            return <Zap className={iconClass} />;
        default:
            return null;
    }
};

// ==========================================
// Impact Bar
// ==========================================

const ImpactBar: React.FC<{
    impact: number;
    direction: 'positive' | 'negative'
}> = ({ impact, direction }) => {
    const safeImpact = safeNumber(impact);
    const percentage = Math.min(100, safeImpact * 100);

    return (
        <div className="impact-bar w-24">
            <motion.div
                className={direction === 'positive' ? 'impact-bar-positive' : 'impact-bar-negative'}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{ height: '100%' }}
            />
        </div>
    );
};

// ==========================================
// Causal Badge
// ==========================================

const CausalBadge: React.FC<{ label: Driver['causalLabel'] }> = ({ label }) => {
    if (!label || label === 'unknown') return null;

    const styles: Record<string, string> = {
        strong_causal: 'bg-engagement-muted text-engagement',
        likely_causal: 'bg-meta-muted text-meta',
        correlational: 'bg-bg-hover text-text-tertiary',
    };

    const labels: Record<string, string> = {
        strong_causal: 'Causal',
        likely_causal: 'Likely',
        correlational: 'Correlated',
    };

    return (
        <span className={`text-xs px-1.5 py-0.5 rounded ${styles[label]}`}>
            {labels[label]}
        </span>
    );
};

// ==========================================
// Driver Item
// ==========================================

const DriverItem: React.FC<{
    driver: Driver;
    showImpactBars: boolean;
    compact: boolean;
    index: number;
}> = ({ driver, showImpactBars, compact, index }) => {
    const paramDef = PARAMETER_DEFINITIONS[driver.id];

    return (
        <motion.div
            className="driver-item"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
        >
            <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Direction Icon */}
                <div className={`flex-shrink-0 ${driver.direction === 'positive' ? 'text-engagement' : 'text-strain'
                    }`}>
                    {driver.direction === 'positive'
                        ? <ArrowUp className="w-4 h-4" />
                        : <ArrowDown className="w-4 h-4" />
                    }
                </div>

                {/* Label & Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-text-primary text-sm font-medium truncate">
                            {driver.label}
                        </span>
                        {!compact && <CausalBadge label={driver.causalLabel} />}
                    </div>

                    {!compact && driver.explanation && (
                        <p className="text-xs text-text-tertiary truncate mt-0.5">
                            {driver.explanation}
                        </p>
                    )}
                </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3 flex-shrink-0">
                {showImpactBars && (
                    <ImpactBar impact={driver.impact} direction={driver.direction} />
                )}

                <span className={`text-sm font-mono ${driver.direction === 'positive' ? 'text-engagement' : 'text-strain'
                    }`}>
                    {driver.direction === 'positive' ? '+' : '-'}{safeToFixed(driver.impact * 100, 0)}%
                </span>

                {!compact && (
                    <div className="flex items-center gap-1.5">
                        <ScopeIcon scope={driver.scope} />
                        {driver.isActionable && (
                            <span className="text-xs text-meta">Actionable</span>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// ==========================================
// Main Component
// ==========================================

function DriverListComponent({
    drivers,
    type,
    maxItems = 5,
    showImpactBars = true,
    compact = false,
}: DriverListProps) {
    const sortedDrivers = [...drivers]
        .filter(d => d.direction === type)
        .sort((a, b) => b.impact - a.impact)
        .slice(0, maxItems);

    if (sortedDrivers.length === 0) {
        return (
            <div className="text-text-tertiary text-sm py-4 text-center">
                No {type === 'positive' ? 'positive' : 'negative'} drivers identified
            </div>
        );
    }

    return (
        <div className="driver-list">
            {sortedDrivers.map((driver, index) => (
                <DriverItem
                    key={driver.id}
                    driver={driver}
                    showImpactBars={showImpactBars}
                    compact={compact}
                    index={index}
                />
            ))}
        </div>
    );
}

export const DriverList = memo(DriverListComponent);

// ==========================================
// Dual Driver Display
// ==========================================

export interface DriverPanelProps {
    positiveDrivers: Driver[];
    negativeDrivers: Driver[];
    maxItems?: number;
}

export const DriverPanel: React.FC<DriverPanelProps> = ({
    positiveDrivers,
    negativeDrivers,
    maxItems = 3,
}) => {
    return (
        <div className="grid md:grid-cols-2 gap-6">
            {/* Positive Drivers */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <ArrowUp className="w-4 h-4 text-engagement" />
                    <h4 className="text-sm font-medium text-text-secondary">
                        Positive Drivers
                    </h4>
                </div>
                <DriverList
                    drivers={positiveDrivers}
                    type="positive"
                    maxItems={maxItems}
                    compact
                />
            </div>

            {/* Negative Drivers */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <ArrowDown className="w-4 h-4 text-strain" />
                    <h4 className="text-sm font-medium text-text-secondary">
                        Risk Factors
                    </h4>
                </div>
                <DriverList
                    drivers={negativeDrivers}
                    type="negative"
                    maxItems={maxItems}
                    compact
                />
            </div>
        </div>
    );
};
