'use client';

import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Info, HelpCircle } from 'lucide-react';
import { INDEX_DEFINITIONS, getQualitativeState, getQualitativeAdjective } from '@/lib/dashboard/indexSemantics';
import { TrendChart, type TrendDataPoint } from './TrendChart';
import { DriverPanel, type Driver } from './DriverList';
import { safeToFixed, safeNumber } from '@/lib/utils/safeNumber';

// ==========================================
// Types
// ==========================================

export interface ParameterBreakdown {
    id: string;
    label: string;
    value: number;
    contribution: number;  // Weight/contribution to parent index
    description?: string;  // Tooltip explanation of the factor
}

export interface IndexDeepDiveProps {
    indexId: string;
    currentValue: number;
    trendData: TrendDataPoint[];
    parameters?: ParameterBreakdown[];
    positiveDrivers?: Driver[];
    negativeDrivers?: Driver[];
    defaultExpanded?: boolean;
    id?: string;  // DOM id for scroll targeting
}

// ==========================================
// Factor Tooltip
// ==========================================

const FACTOR_DESCRIPTIONS: Record<string, string> = {
    emotional_load: 'The degree of emotional demand and affective labor required in daily work activities.',
    workload: 'Perceived volume and intensity of task demands relative to available time and resources.',
    cognitive_dissonance: 'Psychological tension arising from conflicts between stated values and actual practices.',
    autonomy_friction: 'Barriers to self-directed decision-making and independent action.',
    meaning: 'Subjective sense of purpose and significance derived from work activities.',
    autonomy: 'Degree of control over how, when, and where work is performed.',
    control: 'Perceived ability to influence outcomes and manage work-related demands.',
    adaptive_capacity: 'Organizational flexibility to respond to changing conditions and learn from experience.',
    trust_leadership: 'Confidence in leadership competence, integrity, and benevolence.',
    trust_peers: 'Reliability and supportiveness within peer relationships.',
    psychological_safety: 'Belief that one can speak up without risk of punishment or humiliation.',
    voice: 'Perceived opportunity to express opinions and influence decisions.',
    recognition: 'Acknowledgment and appreciation of contributions and achievements.',
    growth_opportunity: 'Access to development, learning, and career advancement.',
};

const FactorTooltip: React.FC<{ factor: ParameterBreakdown }> = ({ factor }) => {
    const [isVisible, setIsVisible] = useState(false);
    const description = factor.description || FACTOR_DESCRIPTIONS[factor.id] || 'Psychological factor contributing to this index.';

    return (
        <div className="relative inline-block">
            <button
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                className="p-0.5 text-text-tertiary hover:text-meta transition-colors"
            >
                <HelpCircle className="w-3 h-3" />
            </button>
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute z-50 left-0 top-full mt-1 w-64 p-3 bg-bg-surface border border-border rounded-lg shadow-lg"
                    >
                        <p className="text-xs text-text-secondary leading-relaxed">{description}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ==========================================
// Contribution Tooltip
// ==========================================

const ContributionTooltip: React.FC<{ value: number }> = ({ value }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="relative inline-block">
            <span
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                className="text-xs font-mono text-meta cursor-help"
            >
                {safeToFixed(value * 100, 0)}%
            </span>
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute z-50 right-0 top-full mt-1 w-48 p-2 bg-bg-surface border border-border rounded-lg shadow-lg"
                    >
                        <p className="text-xs text-text-secondary">
                            This factor accounts for <strong>{safeToFixed(value * 100, 0)}%</strong> of the total contribution to this index.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ==========================================
// Parameter Bar
// ==========================================

const ParameterBar: React.FC<{
    param: ParameterBreakdown;
    maxContribution: number;
}> = ({ param, maxContribution }) => {
    const percentage = (param.contribution / maxContribution) * 100;

    return (
        <div className="flex items-center gap-3 py-2">
            <div className="flex items-center gap-1.5 w-36 min-w-0">
                <span className="text-sm text-text-secondary truncate">
                    {param.label}
                </span>
                <FactorTooltip factor={param} />
            </div>
            <div className="w-20 h-2 bg-bg-hover rounded-full overflow-hidden flex-shrink-0">
                <motion.div
                    className="h-full bg-gradient-to-r from-meta/60 to-meta rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percentage, 100)}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />
            </div>
            <ContributionTooltip value={param.contribution} />
        </div>
    );
};

// ==========================================
// Main Component
// ==========================================

function IndexDeepDiveComponent({
    indexId,
    currentValue,
    trendData,
    parameters = [],
    positiveDrivers = [],
    negativeDrivers = [],
    defaultExpanded = false,
    id,
}: IndexDeepDiveProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [showAllFactors, setShowAllFactors] = useState(false);

    const def = INDEX_DEFINITIONS[indexId];
    const safeValue = safeNumber(currentValue);
    const qualState = getQualitativeState(indexId, safeValue);
    const adjective = getQualitativeAdjective(indexId, safeValue);

    const maxContribution = Math.max(...parameters.map(p => p.contribution), 0.1);

    // Show first 4 factors, rest behind toggle
    const visibleFactors = showAllFactors ? parameters : parameters.slice(0, 4);
    const hasMoreFactors = parameters.length > 4;

    if (!def) {
        return null;
    }

    return (
        <motion.div
            id={id}
            className="deep-dive-section scroll-mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* Header */}
            <button
                className="w-full flex items-center justify-between py-4 group"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <h3 className="section-title mb-0">{def.label}</h3>
                    <span className={`badge ${qualState === 'critical' ? 'badge-critical' :
                        qualState === 'concerning' ? 'badge-warning' :
                            qualState === 'excellent' || qualState === 'good' ? 'badge-healthy' :
                                'badge-neutral'
                        }`}>
                        {adjective}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-2xl font-body font-semibold text-text-primary">
                        {safeToFixed(safeValue * 100, 0)}%
                    </span>
                    {isExpanded
                        ? <ChevronUp className="w-5 h-5 text-text-tertiary group-hover:text-text-secondary transition-colors" />
                        : <ChevronDown className="w-5 h-5 text-text-tertiary group-hover:text-text-secondary transition-colors" />
                    }
                </div>
            </button>

            {/* Content */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="pb-6 space-y-8">
                            {/* Description */}
                            <div className="flex items-start gap-2 p-4 bg-bg-elevated/50 rounded-lg">
                                <Info className="w-4 h-4 text-meta mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm text-text-secondary mb-1">{def.description}</p>
                                    <p className="text-xs text-text-tertiary">{def.businessMeaning}</p>
                                </div>
                            </div>

                            {/* Trend Chart */}
                            {trendData.length > 0 && (
                                <div>
                                    <h4 className="section-subtitle">Trend Over Time</h4>
                                    <TrendChart
                                        indexId={indexId}
                                        data={trendData}
                                        height={180}
                                        showUncertainty
                                        showSemanticAxis
                                    />
                                </div>
                            )}

                            {/* Parameter Breakdown */}
                            {parameters.length > 0 && (
                                <div>
                                    <h4 className="section-subtitle">Contributing Factors</h4>
                                    <div className="space-y-1">
                                        {visibleFactors.map(param => (
                                            <ParameterBar
                                                key={param.id}
                                                param={param}
                                                maxContribution={maxContribution}
                                            />
                                        ))}
                                    </div>
                                    {hasMoreFactors && (
                                        <button
                                            onClick={() => setShowAllFactors(!showAllFactors)}
                                            className="mt-2 text-xs text-meta hover:text-meta-high transition-colors"
                                        >
                                            {showAllFactors
                                                ? `Show less`
                                                : `Show ${parameters.length - 4} more factors`}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Drivers */}
                            {(positiveDrivers.length > 0 || negativeDrivers.length > 0) && (
                                <div>
                                    <h4 className="section-subtitle">Key Drivers</h4>
                                    <DriverPanel
                                        positiveDrivers={positiveDrivers}
                                        negativeDrivers={negativeDrivers}
                                        maxItems={3}
                                    />
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export const IndexDeepDive = memo(IndexDeepDiveComponent);
