'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, CheckCircle, Clock, Database, Activity, Zap } from 'lucide-react';
import { safeToFixed, safeNumber } from '@/lib/utils/safeNumber';

// ==========================================
// Types
// ==========================================

export interface GovernanceData {
    coverage: number;           // 0-1 participation rate
    dataQuality?: number;       // 0-1 overall quality
    temporalStability?: number; // 0-1 consistency over time
    signalConfidence?: number;  // 0-1 reliability of signals
    sessionsCount: number;
    lastMeasuredAt: string;
    confidenceLevel: 'high' | 'medium' | 'low';
    // Legacy field - kept for compatibility but not rendered
    missingness?: number;
}

export interface GovernancePanelProps {
    data: GovernanceData;
    compact?: boolean;
}

// ==========================================
// Confidence Indicator
// ==========================================

const ConfidenceIndicator: React.FC<{ level: GovernanceData['confidenceLevel'] }> = ({ level }) => {
    const config = {
        high: { label: 'High Confidence', color: 'text-engagement', bg: 'bg-engagement-muted', icon: CheckCircle },
        medium: { label: 'Medium Confidence', color: 'text-withdrawal', bg: 'bg-withdrawal-muted', icon: Activity },
        low: { label: 'Low Confidence', color: 'text-strain', bg: 'bg-strain-muted', icon: Activity },
    }[level];

    const Icon = config.icon;

    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.bg}`}>
            <Icon className={`w-4 h-4 ${config.color}`} />
            <span className={`text-sm font-medium ${config.color}`}>
                {config.label}
            </span>
        </div>
    );
};

// ==========================================
// Metric Bar
// ==========================================

const MetricBar: React.FC<{
    label: string;
    value: number;
    icon: React.ElementType;
    tooltip?: string;
    color?: 'default' | 'purple';
}> = ({ label, value, icon: Icon, tooltip, color = 'default' }) => {
    const safeValue = safeNumber(value);
    const percentage = safeValue * 100;

    // Determine color based on value (higher is better for these metrics)
    const getColor = () => {
        if (color === 'purple') return 'bg-meta';
        if (safeValue >= 0.8) return 'bg-engagement';
        if (safeValue >= 0.5) return 'bg-meta';
        return 'bg-strain';
    };

    return (
        <div className="space-y-2" title={tooltip}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-text-tertiary" />
                    <span className="text-sm text-text-secondary">{label}</span>
                </div>
                <span className="text-sm font-mono text-text-primary">
                    {safeToFixed(percentage, 0)}%
                </span>
            </div>
            <div className="confidence-bar">
                <motion.div
                    className={`confidence-bar-fill ${getColor()}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />
            </div>
        </div>
    );
};

// ==========================================
// Main Component
// ==========================================

function GovernancePanelComponent({ data, compact = false }: GovernancePanelProps) {
    const formattedDate = new Date(data.lastMeasuredAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    if (compact) {
        return (
            <div className="flex items-center gap-4 p-4 bg-bg-surface border border-border rounded-lg">
                <ConfidenceIndicator level={data.confidenceLevel} />
                <div className="flex items-center gap-2 text-sm text-text-tertiary">
                    <Users className="w-4 h-4" />
                    <span>{safeToFixed(data.coverage * 100, 0)}% coverage</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-tertiary">
                    <Database className="w-4 h-4" />
                    <span>{data.sessionsCount} sessions</span>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className="bg-bg-surface border border-border rounded-xl p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-meta" />
                    <h3 className="text-lg font-medium text-text-primary">Data Governance</h3>
                </div>
                <ConfidenceIndicator level={data.confidenceLevel} />
            </div>

            {/* Metrics Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
                <MetricBar
                    label="Coverage"
                    value={data.coverage}
                    icon={Users}
                    tooltip="Percentage of team members who have completed assessments"
                />
                {data.dataQuality !== undefined && (
                    <MetricBar
                        label="Data Quality"
                        value={data.dataQuality}
                        icon={CheckCircle}
                        tooltip="Overall quality score based on response validity and completeness"
                    />
                )}
                {data.temporalStability !== undefined && (
                    <MetricBar
                        label="Temporal Stability"
                        value={data.temporalStability}
                        icon={Activity}
                        tooltip="Consistency of measurement patterns over time"
                    />
                )}
                {data.signalConfidence !== undefined && (
                    <MetricBar
                        label="Signal Confidence"
                        value={data.signalConfidence}
                        icon={Zap}
                        tooltip="Statistical reliability of detected signals and trends"
                        color="purple"
                    />
                )}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between pt-4 border-t border-border/30 text-sm text-text-tertiary">
                <div className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    <span>{data.sessionsCount} total sessions</span>
                </div>
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Last updated: {formattedDate}</span>
                </div>
            </div>
        </motion.div>
    );
}

export const GovernancePanel = memo(GovernancePanelComponent);
