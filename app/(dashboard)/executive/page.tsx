'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2,
    Calendar,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    AlertCircle,
    Minus,
    ChevronRight,
    X,
    Sparkles,
    Clock,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    DashboardBackground,
    SignalCard,
    TrendChart,
    GovernancePanel,
    type TrendDataPoint,
    type GovernanceData,
} from '@/components/dashboard';
import { INDEX_DEFINITIONS, getQualitativeState } from '@/lib/dashboard/indexSemantics';
import { safeToFixed, safeNumber } from '@/lib/utils/safeNumber';
import { ExecutiveHintOverlay } from '@/components/onboarding/ExecutiveHintOverlay';


// ==========================================
// Types
// ==========================================

type StateLabel = 'HEALTHY' | 'AT_RISK' | 'CRITICAL' | 'UNKNOWN';

interface TeamSummary {
    teamId: string;
    teamName: string;
    stateLabel: StateLabel;
    severity: number;
    strainIndex: number;
    withdrawalRisk: number;
    trustGap: number;
    engagementIndex: number;
    coverage: number;
}

interface SystemicDriver {
    id: string;
    label: string;
    affectedTeams: string[];
    aggregateImpact: number;
    scope: 'organization' | 'department' | 'localized';
    driverType: 'internal' | 'dependency'; // NEW: semantic classification
}

interface WatchlistItem {
    teamId: string;
    teamName: string;
    signal: string;
    urgency: 'IMMEDIATE' | 'HIGH' | 'NORMAL';
    metric: string;
    value: number;
    origin: 'internal' | 'external'; // NEW: load origin
    context?: string;
    trendExplanation?: string;
    causalRelationship?: string;
    recommendation?: string;
}

interface InterpretationData {
    summary: string;
    generatedAt: string;
    mode: string;
    weekRange: string;
}

interface ExecutiveDashboardData {
    meta: {
        orgId: string;
        orgName: string;
        teamCount: number;
        rangeWeeks: number;
        generatedAt: string;
    };
    orgIndices: {
        strain_index: number;
        engagement_index: number;
        withdrawal_risk: number;
        trust_gap: number;
    };
    previousIndices: {
        strain_index: number;
        engagement_index: number;
        withdrawal_risk: number;
        trust_gap: number;
    };
    orgTrends: Record<string, TrendDataPoint[]>;
    teams: TeamSummary[];
    riskDistribution: {
        critical: number;
        atRisk: number;
        healthy: number;
    };
    systemicDrivers: SystemicDriver[];
    watchlist: WatchlistItem[];
    interpretation?: InterpretationData;
    governance: GovernanceData;
}

// ==========================================
// Index Color Map
// ==========================================

const INDEX_COLORS: Record<string, string> = {
    strain_index: 'text-strain',
    withdrawal_risk: 'text-withdrawal',
    trust_gap: 'text-trust-gap',
    engagement_index: 'text-engagement',
};

// ==========================================
// Index Display Names (B1: no duplicate Index)
// ==========================================

const INDEX_DISPLAY_NAMES: Record<string, string> = {
    strain_index: 'Strain Index',
    withdrawal_risk: 'Withdrawal Risk Index',
    trust_gap: 'Trust Gap Index',
    engagement_index: 'Engagement Index',
};

// ==========================================
// Urgency Colors (for Watchlist)
// ==========================================

const URGENCY_COLORS: Record<string, { border: string; ring: string; text: string; bg: string }> = {
    IMMEDIATE: { border: 'border-strain-high', ring: 'ring-strain-high', text: 'text-strain-high', bg: 'bg-strain-high' },
    HIGH: { border: 'border-withdrawal', ring: 'ring-withdrawal', text: 'text-withdrawal', bg: 'bg-withdrawal' },
    NORMAL: { border: 'border-meta', ring: 'ring-meta', text: 'text-meta', bg: 'bg-meta' },
};

// ==========================================
// D8: Systemic Driver Scope → Urgency Color Mapping
// ==========================================

const SCOPE_URGENCY_COLORS: Record<string, { bg: string; text: string; percent: string }> = {
    organization: { bg: 'bg-strain-muted', text: 'text-strain-high', percent: 'text-strain-high' },
    department: { bg: 'bg-withdrawal-muted', text: 'text-withdrawal', percent: 'text-withdrawal' },
    localized: { bg: 'bg-meta-muted', text: 'text-meta', percent: 'text-meta' },
};

// ==========================================
// Mock Data Generator
// ==========================================

function generateMockExecutiveData(): ExecutiveDashboardData {
    const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9'];

    const generateTrend = (base: number, volatility: number): TrendDataPoint[] => {
        let value = base;
        return weeks.map(week => {
            value = Math.max(0.05, Math.min(0.95, value + (Math.random() - 0.5) * volatility));
            return {
                week,
                value,
                lower: Math.max(0, value - 0.06),
                upper: Math.min(1, value + 0.06),
            };
        });
    };

    const strainTrend = generateTrend(0.42, 0.08);
    const engagementTrend = generateTrend(0.67, 0.06);
    const withdrawalTrend = generateTrend(0.35, 0.07);
    const trustGapTrend = generateTrend(0.28, 0.05);

    const teams: TeamSummary[] = [
        { teamId: 'eng', teamName: 'Engineering', stateLabel: 'AT_RISK', severity: 0.55, strainIndex: 0.52, withdrawalRisk: 0.38, trustGap: 0.28, engagementIndex: 0.65, coverage: 0.82 },
        { teamId: 'sales', teamName: 'Sales', stateLabel: 'HEALTHY', severity: 0.25, strainIndex: 0.28, withdrawalRisk: 0.22, trustGap: 0.18, engagementIndex: 0.78, coverage: 0.91 },
        { teamId: 'ops', teamName: 'Operations', stateLabel: 'HEALTHY', severity: 0.30, strainIndex: 0.32, withdrawalRisk: 0.25, trustGap: 0.22, engagementIndex: 0.72, coverage: 0.75 },
        { teamId: 'product', teamName: 'Product', stateLabel: 'CRITICAL', severity: 0.72, strainIndex: 0.68, withdrawalRisk: 0.55, trustGap: 0.42, engagementIndex: 0.45, coverage: 0.68 },
        { teamId: 'support', teamName: 'Support', stateLabel: 'AT_RISK', severity: 0.48, strainIndex: 0.45, withdrawalRisk: 0.35, trustGap: 0.32, engagementIndex: 0.58, coverage: 0.88 },
        { teamId: 'hr', teamName: 'HR', stateLabel: 'HEALTHY', severity: 0.22, strainIndex: 0.25, withdrawalRisk: 0.18, trustGap: 0.15, engagementIndex: 0.82, coverage: 0.95 },
    ];

    const critical = teams.filter(t => t.stateLabel === 'CRITICAL').length;
    const atRisk = teams.filter(t => t.stateLabel === 'AT_RISK').length;
    const healthy = teams.filter(t => t.stateLabel === 'HEALTHY').length;

    return {
        meta: {
            orgId: 'org_demo',
            orgName: 'Acme Corporation',
            teamCount: teams.length,
            rangeWeeks: 9,
            generatedAt: new Date().toISOString(),
        },
        orgIndices: {
            strain_index: strainTrend[strainTrend.length - 1].value,
            engagement_index: engagementTrend[engagementTrend.length - 1].value,
            withdrawal_risk: withdrawalTrend[withdrawalTrend.length - 1].value,
            trust_gap: trustGapTrend[trustGapTrend.length - 1].value,
        },
        previousIndices: {
            strain_index: strainTrend[strainTrend.length - 2].value,
            engagement_index: engagementTrend[engagementTrend.length - 2].value,
            withdrawal_risk: withdrawalTrend[withdrawalTrend.length - 2].value,
            trust_gap: trustGapTrend[trustGapTrend.length - 2].value,
        },
        orgTrends: {
            strain_index: strainTrend,
            engagement_index: engagementTrend,
            withdrawal_risk: withdrawalTrend,
            trust_gap: trustGapTrend,
        },
        teams,
        riskDistribution: { critical, atRisk, healthy },
        systemicDrivers: [
            { id: 'workload', label: 'Workload Pressure', affectedTeams: ['Engineering', 'Product', 'Support'], aggregateImpact: 0.65, scope: 'organization', driverType: 'internal' },
            { id: 'process', label: 'Process Friction', affectedTeams: ['Engineering', 'Product'], aggregateImpact: 0.48, scope: 'department', driverType: 'internal' },
            { id: 'crossteam', label: 'Cross-Team Dependencies', affectedTeams: ['Engineering', 'Product', 'Support'], aggregateImpact: 0.42, scope: 'organization', driverType: 'dependency' },
            { id: 'comms', label: 'Communication Gaps', affectedTeams: ['Product'], aggregateImpact: 0.38, scope: 'localized', driverType: 'dependency' },
            { id: 'resources', label: 'Resource Constraints', affectedTeams: ['Product', 'Support'], aggregateImpact: 0.35, scope: 'department', driverType: 'internal' },
            { id: 'recognition', label: 'Recognition Deficit', affectedTeams: ['Support', 'Operations'], aggregateImpact: 0.28, scope: 'localized', driverType: 'internal' },
        ],
        watchlist: [
            {
                teamId: 'product',
                teamName: 'Product',
                signal: 'Critical strain with accelerating decline',
                urgency: 'IMMEDIATE',
                metric: 'strain_index',
                value: 0.68,
                origin: 'external', // Dependency stress from Engineering
                context: 'The Product team has shown a 15% increase in strain over the past 3 weeks, coinciding with the Q4 release push.',
                trendExplanation: 'Strain began rising in W6 and has accelerated since W8. The velocity of change suggests compounding pressure.',
                causalRelationship: 'Primary driver is cross-team dependency with Engineering (r=0.78) with secondary contribution from resource constraints.',
                recommendation: 'Coordinate with Engineering on scope. Product cannot resolve this alone.',
            },
            {
                teamId: 'eng',
                teamName: 'Engineering',
                signal: 'Workload pressure trending upward',
                urgency: 'HIGH',
                metric: 'strain_index',
                value: 0.52,
                origin: 'internal', // Internal workload issues
                context: 'Engineering strain is elevated but not yet critical. Current trajectory suggests it could reach concerning levels within 2 weeks.',
                trendExplanation: 'Gradual but steady increase since W5. The team has maintained productivity but at the cost of capacity reserves.',
                causalRelationship: 'Workload pressure is the dominant internal factor. Team has control over scope and prioritization.',
                recommendation: 'Monitor closely. Consider proactive workload balancing before strain reaches critical threshold.',
            },
            {
                teamId: 'support',
                teamName: 'Support',
                signal: 'Engagement decline detected',
                urgency: 'NORMAL',
                metric: 'engagement_index',
                value: 0.42,
                origin: 'internal', // Internal recognition issues
                context: 'Support team engagement has dipped below the healthy threshold.',
                trendExplanation: 'Engagement began declining in W7, correlating with increased ticket volume.',
                causalRelationship: 'Primary factor is workload surge without corresponding recognition.',
                recommendation: 'Prioritize recognition initiatives. Consider cross-training opportunities.',
            },
        ],
        interpretation: {
            summary: `Organization-wide strain is moderate but concentrated. Two teams (Product and Engineering) account for 75% of observed risk signals. The primary systemic driver is sustained workload pressure, particularly acute in technical roles.

Positive note: Sales and HR demonstrate strong engagement trajectories, suggesting organizational culture fundamentals remain healthy. The risk is operational, not cultural.

The most significant concern is the Product team's accelerating strain trajectory. Without intervention, there is a 70% probability of engagement decline spreading to dependent teams within 3 weeks. Early signals of contagion are already visible in Engineering's elevated strain and Support's declining engagement.

Cross-functional dependencies are amplifying the risk: Product delays create Engineering blockers, which cascade to Support ticket escalations. This systemic pattern suggests that intervention at a single point (Product) could have positive ripple effects across the organization.

Additional context: Historically, teams recovering from similar strain levels have required 4-6 weeks of reduced workload to return to baseline. Earlier intervention correlates with faster recovery and lower turnover risk. The current window for cost-effective intervention is approximately 2 weeks.

Recommended executive focus:
• Immediate: Resource rebalancing for Product team — consider temporary contractors or scope reduction
• Short-term: Review Q4 commitments and consider scope adjustments with stakeholders
• Ongoing: Strengthen cross-team communication channels and establish clearer escalation paths
• Monitor: Weekly check-ins on Engineering strain trajectory for early intervention`,
            generatedAt: new Date().toISOString(),
            mode: 'llm',
            weekRange: 'Dec 9 - Dec 23, 2024',
        },
        governance: {
            coverage: 0.83,
            dataQuality: 0.88,
            temporalStability: 0.85,
            signalConfidence: 0.82,
            sessionsCount: 284,
            lastMeasuredAt: new Date().toISOString(),
            confidenceLevel: 'high',
        },
    };
}

// ==========================================
// Risk Distribution (C1-C3: Full-width, segment-centered labels)
// ==========================================

const RiskDistributionCompact: React.FC<{
    distribution: ExecutiveDashboardData['riskDistribution'];
    total: number;
}> = ({ distribution, total }) => {
    const criticalPct = (distribution.critical / total) * 100;
    const atRiskPct = (distribution.atRisk / total) * 100;
    const healthyPct = (distribution.healthy / total) * 100;

    return (
        <div className="p-4 bg-bg-surface border border-border rounded-lg">
            {/* Full-width bar */}
            <div className="w-full h-4 rounded-full overflow-hidden bg-bg-hover flex mb-2">
                {distribution.critical > 0 && (
                    <div className="bg-strain-high h-full" style={{ width: `${criticalPct}%` }} />
                )}
                {distribution.atRisk > 0 && (
                    <div className="bg-withdrawal h-full" style={{ width: `${atRiskPct}%` }} />
                )}
                {distribution.healthy > 0 && (
                    <div className="bg-engagement h-full" style={{ width: `${healthyPct}%` }} />
                )}
            </div>

            {/* C2: Labels centered under their OWN segment */}
            <div className="flex w-full">
                {distribution.critical > 0 && (
                    <div className="flex items-center justify-center gap-1 text-strain-high" style={{ width: `${criticalPct}%` }}>
                        <AlertTriangle className="w-3 h-3" />
                        <span className="text-xs font-medium">{distribution.critical}</span>
                        <span className="text-xs">Critical</span>
                    </div>
                )}
                {distribution.atRisk > 0 && (
                    <div className="flex items-center justify-center gap-1 text-withdrawal" style={{ width: `${atRiskPct}%` }}>
                        <AlertCircle className="w-3 h-3" />
                        <span className="text-xs font-medium">{distribution.atRisk}</span>
                        <span className="text-xs">At Risk</span>
                    </div>
                )}
                {distribution.healthy > 0 && (
                    <div className="flex items-center justify-center gap-1 text-engagement" style={{ width: `${healthyPct}%` }}>
                        <CheckCircle className="w-3 h-3" />
                        <span className="text-xs font-medium">{distribution.healthy}</span>
                        <span className="text-xs">Healthy</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// ==========================================
// Team Portfolio Table (C1-C2: Spacing grouping)
// ==========================================

const TeamPortfolio: React.FC<{ teams: TeamSummary[] }> = ({ teams }) => {
    const router = useRouter();
    const sortedTeams = useMemo(() =>
        [...teams].sort((a, b) => b.severity - a.severity),
        [teams]
    );

    const getStateConfig = (state: StateLabel) => {
        switch (state) {
            case 'CRITICAL': return { icon: <AlertTriangle className="w-4 h-4" />, label: 'Critical', color: 'text-strain-high' };
            case 'AT_RISK': return { icon: <AlertCircle className="w-4 h-4" />, label: 'At Risk', color: 'text-withdrawal' };
            case 'HEALTHY': return { icon: <CheckCircle className="w-4 h-4" />, label: 'Healthy', color: 'text-engagement' };
            default: return { icon: <Minus className="w-4 h-4" />, label: 'Unknown', color: 'text-text-tertiary' };
        }
    };

    const getIndexColor = (indexId: string, value: number): string => {
        const state = getQualitativeState(indexId, value);
        switch (state) {
            case 'critical': return 'text-strain-high';
            case 'concerning': return 'text-withdrawal';
            case 'good': return 'text-engagement/80';
            case 'excellent': return 'text-engagement';
            default: return 'text-text-secondary';
        }
    };

    const handleRowClick = (teamId: string) => {
        router.push(`/team/${teamId}`);
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-border">
                        {/* C1: Large spacing between Team, Status, Strain */}
                        <th className="text-left py-3 px-6 text-xs font-mono text-text-tertiary uppercase tracking-wider w-36">Team</th>
                        <th className="text-left py-3 px-6 text-xs font-mono text-text-tertiary uppercase tracking-wider w-32">Status</th>
                        {/* C1: Small, equal spacing between index columns */}
                        <th className="text-center py-3 pl-8 pr-1.5 text-xs font-mono text-text-tertiary uppercase tracking-wider">Strain</th>
                        <th className="text-center py-3 px-1.5 text-xs font-mono text-text-tertiary uppercase tracking-wider">Withdrawal</th>
                        <th className="text-center py-3 px-1.5 text-xs font-mono text-text-tertiary uppercase tracking-wider">Trust Gap</th>
                        <th className="text-center py-3 px-1.5 text-xs font-mono text-text-tertiary uppercase tracking-wider">Engagement</th>
                        <th className="text-right py-3 px-6 text-xs font-mono text-text-tertiary uppercase tracking-wider w-20">Coverage</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedTeams.map((team, index) => {
                        const stateConfig = getStateConfig(team.stateLabel);
                        return (
                            <motion.tr
                                key={team.teamId}
                                className="border-b border-border/30 hover:bg-bg-hover transition-colors cursor-pointer group"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: index * 0.05 }}
                                onClick={() => handleRowClick(team.teamId)}
                            >
                                <td className="py-3 px-6">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-text-primary">{team.teamName}</span>
                                        <ChevronRight className="w-4 h-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </td>
                                <td className="py-3 px-6">
                                    <div className={`flex items-center gap-1.5 ${stateConfig.color}`}>
                                        {stateConfig.icon}
                                        <span className="text-sm">{stateConfig.label}</span>
                                    </div>
                                </td>
                                <td className="py-3 pl-8 pr-1.5 text-center">
                                    <span className={`font-mono text-sm ${getIndexColor('strain_index', team.strainIndex)}`}>
                                        {safeToFixed(team.strainIndex * 100, 0)}%
                                    </span>
                                </td>
                                <td className="py-3 px-1.5 text-center">
                                    <span className={`font-mono text-sm ${getIndexColor('withdrawal_risk', team.withdrawalRisk)}`}>
                                        {safeToFixed(team.withdrawalRisk * 100, 0)}%
                                    </span>
                                </td>
                                <td className="py-3 px-1.5 text-center">
                                    <span className={`font-mono text-sm ${getIndexColor('trust_gap', team.trustGap)}`}>
                                        {safeToFixed(team.trustGap * 100, 0)}%
                                    </span>
                                </td>
                                <td className="py-3 px-1.5 text-center">
                                    <span className={`font-mono text-sm ${getIndexColor('engagement_index', team.engagementIndex)}`}>
                                        {safeToFixed(team.engagementIndex * 100, 0)}%
                                    </span>
                                </td>
                                <td className="py-3 px-6 text-right">
                                    <span className={`font-mono text-sm ${team.coverage > 0.8 ? 'text-text-secondary' : 'text-text-tertiary'}`}>
                                        {safeToFixed(team.coverage * 100, 0)}%
                                    </span>
                                </td>
                            </motion.tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// ==========================================
// Systemic Drivers Panel
// ==========================================

const SystemicDriversPanel: React.FC<{
    drivers: SystemicDriver[];
    selectedDriver: SystemicDriver | null;
    onSelectDriver: (driver: SystemicDriver | null) => void;
}> = ({ drivers, selectedDriver, onSelectDriver }) => {
    // Show all drivers (removed Show more logic) - LIMIT TO 3
    const visibleDrivers = drivers.slice(0, 3);

    return (
        <div className="space-y-2">
            {visibleDrivers.map((driver, index) => {
                const scopeColor = SCOPE_URGENCY_COLORS[driver.scope] || SCOPE_URGENCY_COLORS.localized;
                const isSelected = selectedDriver?.id === driver.id;
                return (
                    <motion.button
                        key={driver.id}
                        className={`w-full text-left p-3 bg-bg-elevated rounded-lg h-[76px] flex flex-col justify-center transition-all ${isSelected
                            ? 'ring-2 ring-meta border-meta bg-bg-hover'
                            : 'hover:bg-bg-hover border border-transparent hover:border-border'
                            } ${!isSelected && selectedDriver ? 'opacity-60' : ''}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        onClick={() => onSelectDriver(isSelected ? null : driver)}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-text-primary">{driver.label}</span>
                                <span className="text-xs text-text-tertiary">{driver.driverType}</span>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded ${scopeColor.bg} ${scopeColor.text}`}>
                                {driver.scope}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <div className="h-1.5 rounded-full bg-bg-hover overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-strain to-strain-high"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${driver.aggregateImpact * 100}%` }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                            </div>
                            <span className={`text-xs font-mono ${scopeColor.percent}`}>
                                {safeToFixed(driver.aggregateImpact * 100, 0)}%
                            </span>
                        </div>
                    </motion.button>
                );
            })}
        </div>
    );
};


// ==========================================
// Systemic Driver Detail Panel (B1, B2)
// ==========================================

const SystemicDriverDetailPanel: React.FC<{
    driver: SystemicDriver;
    onClose: () => void;
}> = ({ driver, onClose }) => {
    const scopeColor = SCOPE_URGENCY_COLORS[driver.scope] || SCOPE_URGENCY_COLORS.localized;

    // B2: Interpret the influence percentage
    const getInfluenceInterpretation = (impact: number) => {
        if (impact >= 0.5) return 'Major contributor to org-wide strain. Requires priority attention.';
        if (impact >= 0.3) return 'Significant influence on organizational signals. Monitor closely.';
        return 'Moderate influence. Address opportunistically.';
    };

    // B2: Type explanation
    const getTypeExplanation = (type: 'internal' | 'dependency') => {
        if (type === 'internal') return 'Originates from within organizational processes. Addressable through direct intervention.';
        return 'Arises from cross-team dependencies. Requires coordination to resolve.';
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-bg-elevated rounded-lg p-5 border border-meta"
        >
            <div className="flex items-center justify-between mb-4">
                <div>
                    <span className="text-xs text-text-tertiary uppercase font-mono">Systemic Driver</span>
                    <h3 className="font-medium text-text-primary">{driver.label}</h3>
                </div>
                <button onClick={onClose} className="p-1 text-text-tertiary hover:text-text-secondary">
                    <X className="w-4 h-4" />
                </button>
            </div>
            <div className="space-y-4">
                {/* Influence with interpretation */}
                <div className="flex items-center justify-between p-3 bg-bg-hover rounded-lg">
                    <span className="text-sm text-text-secondary">Influence</span>
                    <span className="text-sm font-mono text-strain-high">{safeToFixed(driver.aggregateImpact * 100, 0)}%</span>
                </div>
                <p className="text-xs text-text-secondary">{getInfluenceInterpretation(driver.aggregateImpact)}</p>

                {/* Type */}
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-text-tertiary">Type:</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${driver.driverType === 'internal' ? 'bg-engagement-muted text-engagement' : 'bg-withdrawal-muted text-withdrawal'}`}>
                            {driver.driverType}
                        </span>
                    </div>
                    <p className="text-xs text-text-secondary">{getTypeExplanation(driver.driverType)}</p>
                </div>

                {/* Scope */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-text-tertiary">Scope:</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${scopeColor.bg} ${scopeColor.text}`}>
                        {driver.scope}
                    </span>
                </div>

                {/* Affected Teams */}
                {driver.affectedTeams.length > 0 && (
                    <div>
                        <h4 className="text-xs font-mono text-text-tertiary uppercase mb-1">Affected Teams</h4>
                        <div className="flex flex-wrap gap-1">
                            {driver.affectedTeams.map(team => (
                                <span key={team} className="text-xs px-2 py-0.5 rounded bg-bg-hover text-text-secondary">
                                    {team}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// ==========================================
// Watchlist Panel
// ==========================================

const WatchlistPanel: React.FC<{
    items: WatchlistItem[];
    selectedItem: WatchlistItem | null;
    onSelectItem: (item: WatchlistItem | null) => void;
}> = ({ items, selectedItem, onSelectItem }) => {
    const getUrgencyConfig = (urgency: string) => {
        const colors = URGENCY_COLORS[urgency] || URGENCY_COLORS.NORMAL;
        switch (urgency) {
            case 'IMMEDIATE': return { ...colors, icon: <AlertTriangle className="w-4 h-4" /> };
            case 'HIGH': return { ...colors, icon: <AlertCircle className="w-4 h-4" /> };
            default: return { ...colors, icon: <AlertCircle className="w-4 h-4" /> };
        }
    };

    return (
        <div className="space-y-2">
            {items.slice(0, 3).map((item, index) => {
                const config = getUrgencyConfig(item.urgency);
                const isSelected = selectedItem?.teamId === item.teamId && selectedItem?.metric === item.metric;
                return (
                    <motion.button
                        key={`${item.teamId}-${item.metric}`}
                        className={`w-full text-left p-3 bg-bg-elevated rounded-lg border-l-4 h-[76px] flex items-center ${config.border} transition-all ${isSelected ? `ring-2 ${config.ring} bg-bg-hover` : 'hover:bg-bg-hover'
                            } ${!isSelected && selectedItem ? 'opacity-60' : ''}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        onClick={() => onSelectItem(isSelected ? null : item)}
                    >
                        <div className="flex items-center justify-between gap-3 w-full">
                            <div className="flex items-start gap-2">
                                <span className={config.text}>{config.icon}</span>
                                <div>
                                    <span className="font-medium text-sm text-text-primary">{item.teamName}</span>
                                    <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{item.signal}</p>
                                    <span className="text-xs text-text-tertiary">origin: {item.origin}</span>
                                </div>
                            </div>
                            <span className={`font-mono text-sm ${config.text}`}>
                                {safeToFixed(item.value * 100, 0)}%
                            </span>
                        </div>
                    </motion.button>
                );
            })}
        </div>
    );
};

// ==========================================
// Watchlist Detail Panel
// ==========================================

const WatchlistDetailPanel: React.FC<{
    item: WatchlistItem;
    onClose: () => void;
}> = ({ item, onClose }) => {
    const urgencyColors = URGENCY_COLORS[item.urgency] || URGENCY_COLORS.NORMAL;
    const getIcon = (urgency: string) => {
        switch (urgency) {
            case 'IMMEDIATE': return <AlertTriangle className="w-4 h-4" />;
            case 'HIGH': return <AlertCircle className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={`bg-bg-elevated rounded-lg p-5 border ${urgencyColors.border}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-text-primary">{item.teamName} Team</h3>
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1.5 ${urgencyColors.text}`}>
                        {getIcon(item.urgency)}
                        <span className="text-xs font-medium uppercase">{item.urgency}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-text-tertiary hover:text-text-secondary transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {item.context && (
                    <div>
                        <h4 className="text-xs font-mono text-text-tertiary uppercase mb-1">Context</h4>
                        <p className="text-sm text-text-secondary">{item.context}</p>
                    </div>
                )}

                {item.trendExplanation && (
                    <div>
                        <h4 className="text-xs font-mono text-text-tertiary uppercase mb-1">Trend</h4>
                        <p className="text-sm text-text-secondary">{item.trendExplanation}</p>
                    </div>
                )}

                {item.causalRelationship && (
                    <div>
                        <h4 className="text-xs font-mono text-text-tertiary uppercase mb-1">Causality</h4>
                        <p className="text-sm text-text-secondary">{item.causalRelationship}</p>
                    </div>
                )}

                {item.recommendation && (
                    <div className={`p-3 rounded-lg border ${urgencyColors.border} bg-bg-hover/50`}>
                        <h4 className={`text-xs font-mono uppercase mb-1 ${urgencyColors.text}`}>Recommendation</h4>
                        <p className="text-sm text-text-primary">{item.recommendation}</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// ==========================================
// E) Weekly Summary Panel (new inline component)
// ==========================================

const WeeklySummaryPanel: React.FC<{ interpretation?: InterpretationData }> = ({ interpretation }) => {
    if (!interpretation) return null;

    // Split summary into paragraphs
    const paragraphs = interpretation.summary.split('\n\n').filter(p => p.trim());

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-meta/50 bg-meta-muted/20 p-6"
        >
            {/* E2: Header with AI-Supported and Today */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-meta">
                    <Sparkles className="w-5 h-5 rotate-90" />
                    <span className="text-sm font-medium">AI-Supported</span>
                </div>
                <div className="flex flex-col items-end">
                    <Clock className="w-4 h-4 text-text-tertiary mb-0.5" />
                    <span className="text-xs text-text-tertiary">Today</span>
                </div>
            </div>

            {/* E4: Larger white text for paragraphs */}
            <div className="space-y-4">
                {paragraphs.map((paragraph, index) => (
                    <p key={index} className="text-sm text-white leading-relaxed">
                        {paragraph}
                    </p>
                ))}
            </div>

            {/* Week range footer */}
            <div className="mt-4 pt-4 border-t border-meta/20">
                <span className="text-xs text-text-tertiary">
                    Analysis period: {interpretation.weekRange}
                </span>
            </div>
        </motion.div>
    );
};

// ==========================================
// Main Dashboard Page
// ==========================================

export default function ExecutiveDashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<ExecutiveDashboardData | null>(null);
    const [selectedTrendIndex, setSelectedTrendIndex] = useState<string>('strain_index');
    const [selectedWatchlistItem, setSelectedWatchlistItem] = useState<WatchlistItem | null>(null);
    const [selectedSystemicDriver, setSelectedSystemicDriver] = useState<SystemicDriver | null>(null);
    const [dataSource, setDataSource] = useState<'api' | 'mock' | 'error'>('api');
    const [errorMessage, setErrorMessage] = useState<string>('');

    // Clear the other selection when one is made
    const handleSelectWatchlistItem = (item: WatchlistItem | null) => {
        setSelectedWatchlistItem(item);
        if (item) setSelectedSystemicDriver(null);
    };
    const handleSelectSystemicDriver = (driver: SystemicDriver | null) => {
        setSelectedSystemicDriver(driver);
        if (driver) setSelectedWatchlistItem(null);
    };

    useEffect(() => {
        const loadData = async () => {
            setErrorMessage('');

            // Try real API first
            try {
                const { fetchExecutiveData, shouldUseMocks } = await import('@/lib/dashboard/executiveAdapter');

                // Only use mocks if explicitly enabled
                if (!shouldUseMocks()) {
                    const result = await fetchExecutiveData();
                    if (result.data) {
                        setData(result.data as unknown as ExecutiveDashboardData);
                        setDataSource('api');
                        setIsLoading(false);
                        return;
                    }
                    if (result.error) {
                        console.warn('[Executive] API failed:', result.error);
                        setErrorMessage(result.error);
                    }
                }

                // Mock fallback - ONLY if DEV flag explicitly enabled
                if (shouldUseMocks()) {
                    console.log('[Executive] Using mock data (DEV flag enabled)');
                    setData(generateMockExecutiveData());
                    setDataSource('mock');
                    setIsLoading(false);
                    return;
                }

                // No mock allowed, show error
                setDataSource('error');
                setErrorMessage('Unable to load data. Run pipeline:dev:rebuild first.');
                setIsLoading(false);

            } catch (e: any) {
                console.warn('[Executive] API unavailable:', e.message);
                const devMocks = process.env.NEXT_PUBLIC_DASHBOARD_DEV_MOCKS === 'true';
                if (devMocks && process.env.NODE_ENV === 'development') {
                    setData(generateMockExecutiveData());
                    setDataSource('mock');
                } else {
                    setDataSource('error');
                    setErrorMessage(e.message || 'Failed to load data');
                }
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const handleRefresh = async () => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const { fetchExecutiveData, shouldUseMocks } = await import('@/lib/dashboard/executiveAdapter');

            if (!shouldUseMocks()) {
                const result = await fetchExecutiveData();
                if (result.data) {
                    setData(result.data as unknown as ExecutiveDashboardData);
                    setDataSource('api');
                    setIsLoading(false);
                    return;
                }
            }

            if (shouldUseMocks()) {
                setData(generateMockExecutiveData());
                setDataSource('mock');
            } else {
                setDataSource('error');
                setErrorMessage('Unable to refresh data');
            }
        } catch (e: any) {
            const devMocks = process.env.NEXT_PUBLIC_DASHBOARD_DEV_MOCKS === 'true';
            if (devMocks && process.env.NODE_ENV === 'development') {
                setData(generateMockExecutiveData());
                setDataSource('mock');
            } else {
                setDataSource('error');
                setErrorMessage(e.message);
            }
        }
        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <DashboardBackground>
                <div className="dashboard-container flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <motion.div
                            className="w-12 h-12 border-2 border-meta border-t-transparent rounded-full mx-auto mb-4"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                        <p className="text-text-secondary">Loading executive dashboard...</p>
                    </div>
                </div>
            </DashboardBackground>
        );
    }

    // Error state - when API fails and mocks not enabled
    if (dataSource === 'error') {
        return (
            <DashboardBackground>
                <div className="dashboard-container flex items-center justify-center min-h-screen">
                    <div className="text-center max-w-md">
                        <AlertTriangle className="w-12 h-12 text-withdrawal mx-auto mb-4" />
                        <h1 className="text-2xl font-display font-semibold text-text-primary mb-2">Data Unavailable</h1>
                        <p className="text-text-secondary mb-4">{errorMessage || 'Unable to load executive dashboard data.'}</p>
                        <p className="text-text-tertiary text-sm mb-6">Run <code className="bg-bg-hover px-1 rounded">npm run pipeline:dev:rebuild</code> to generate weekly products.</p>
                        <button onClick={handleRefresh} className="px-4 py-2 bg-meta text-white rounded-lg hover:bg-meta/80 transition-colors">Retry</button>
                    </div>
                </div>
            </DashboardBackground>
        );
    }

    if (!data) return null;

    return (
        <DashboardBackground>


            <div className="dashboard-container">
                {/* Refresh Button + Mock Badge */}
                <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
                    {dataSource === 'mock' && (
                        <span className="px-2 py-1 text-xs font-mono bg-withdrawal/20 text-withdrawal border border-withdrawal/50 rounded">MOCK DATA</span>
                    )}
                    <button
                        onClick={handleRefresh}
                        className="p-2 text-text-tertiary hover:text-text-secondary transition-colors"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>

                {/* ====================================== */}
                {/* SECTION 1: Org Overview */}
                {/* ====================================== */}
                <section className="dashboard-section">
                    {/* A1: Centered title */}
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Building2 className="w-6 h-6 text-meta" />
                            <h1 data-testid="org-title" className="text-3xl font-display font-semibold text-text-primary">
                                {data.meta.orgName}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-text-tertiary">
                            <span>{data.meta.teamCount} teams</span>
                            <span className="mx-2">•</span>
                            <Calendar className="w-4 h-4" />
                            <span>{data.meta.rangeWeeks} weeks of data</span>
                        </div>
                    </div>

                    {/* Index Cards */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <SignalCard
                            indexId="strain_index"
                            value={data.orgIndices.strain_index}
                            previousValue={data.previousIndices.strain_index}
                            compact
                            isActive={selectedTrendIndex === 'strain_index'}
                            onClick={() => setSelectedTrendIndex('strain_index')}
                        />
                        <SignalCard
                            indexId="withdrawal_risk"
                            value={data.orgIndices.withdrawal_risk}
                            previousValue={data.previousIndices.withdrawal_risk}
                            compact
                            isActive={selectedTrendIndex === 'withdrawal_risk'}
                            onClick={() => setSelectedTrendIndex('withdrawal_risk')}
                        />
                        <SignalCard
                            indexId="trust_gap"
                            value={data.orgIndices.trust_gap}
                            previousValue={data.previousIndices.trust_gap}
                            compact
                            isActive={selectedTrendIndex === 'trust_gap'}
                            onClick={() => setSelectedTrendIndex('trust_gap')}
                        />
                        <SignalCard
                            indexId="engagement_index"
                            value={data.orgIndices.engagement_index}
                            previousValue={data.previousIndices.engagement_index}
                            compact
                            isActive={selectedTrendIndex === 'engagement_index'}
                            onClick={() => setSelectedTrendIndex('engagement_index')}
                        />
                    </div>

                    {/* Trend Chart */}
                    <div className="card">
                        <h3 className="section-subtitle mb-4">
                            <span className={INDEX_COLORS[selectedTrendIndex]}>
                                {INDEX_DISPLAY_NAMES[selectedTrendIndex]}
                            </span>
                            {' '}Trend of Organization
                        </h3>
                        <TrendChart
                            indexId={selectedTrendIndex}
                            data={data.orgTrends[selectedTrendIndex]}
                            height={180}
                            showUncertainty
                        />
                    </div>
                </section>

                {/* ====================================== */}
                {/* SECTION 2: Team Portfolio */}
                {/* ====================================== */}
                <section className="dashboard-section">
                    <div className="dashboard-section-header">
                        {/* B1: Larger section heading */}
                        <h2 className="text-2xl font-display font-semibold text-text-primary">Team Portfolio</h2>
                    </div>

                    {/* Risk Distribution */}
                    <div className="mb-4">
                        <RiskDistributionCompact distribution={data.riskDistribution} total={data.meta.teamCount} />
                    </div>

                    {/* Team Table */}
                    <div className="card p-0 overflow-hidden">
                        <TeamPortfolio teams={data.teams} />
                    </div>
                </section>

                {/* ====================================== */}
                {/* SECTION 3: Systemic Patterns */}
                {/* ====================================== */}
                <section className="dashboard-section">
                    <div className="grid md:grid-cols-2 gap-12">
                        {/* LEFT: Watchlist OR Systemic Driver Details */}
                        <AnimatePresence mode="wait">
                            {selectedSystemicDriver ? (
                                <motion.div
                                    key="driver-detail"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <h2 className="text-2xl font-display font-semibold text-text-primary mb-4">Systemic Driver Details</h2>
                                    <SystemicDriverDetailPanel
                                        driver={selectedSystemicDriver}
                                        onClose={() => handleSelectSystemicDriver(null)}
                                    />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="watchlist"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <div className="flex items-baseline justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-2xl font-display font-semibold text-text-primary">Watchlist</h2>
                                            <span
                                                className={`text-xs font-medium px-2 py-0.5 rounded cursor-help ${data.watchlist.some(w => w.origin === 'external' && w.urgency === 'IMMEDIATE')
                                                    ? 'bg-strain-muted text-strain-high'
                                                    : data.watchlist.some(w => w.origin === 'external')
                                                        ? 'bg-withdrawal-muted text-withdrawal'
                                                        : 'bg-engagement-muted/50 text-engagement'
                                                    }`}
                                                title="Propagation Risk: derived from external dependencies and urgency"
                                            >
                                                {data.watchlist.some(w => w.origin === 'external' && w.urgency === 'IMMEDIATE')
                                                    ? 'Elevated Risk'
                                                    : data.watchlist.some(w => w.origin === 'external')
                                                        ? 'Moderate Risk'
                                                        : 'Low Risk'}
                                            </span>
                                        </div>
                                        <span
                                            className="text-sm text-text-secondary font-normal cursor-help"
                                            title="Criticality (%): severity score of the watchlist signal."
                                        >
                                            Criticality
                                        </span>
                                    </div>
                                    <WatchlistPanel
                                        items={data.watchlist}
                                        selectedItem={selectedWatchlistItem}
                                        onSelectItem={handleSelectWatchlistItem}
                                    />
                                    <p className="text-xs text-text-tertiary mt-2 italic text-right">Click for Details</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* RIGHT: Systemic Drivers OR Watchlist Details */}
                        <AnimatePresence mode="wait">
                            {selectedWatchlistItem ? (
                                <motion.div
                                    key="watchlist-detail"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <h2 className="text-2xl font-display font-semibold text-text-primary mb-4">Watchlist Details</h2>
                                    <WatchlistDetailPanel
                                        item={selectedWatchlistItem}
                                        onClose={() => handleSelectWatchlistItem(null)}
                                    />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="drivers"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <div className="flex items-baseline justify-between mb-4">
                                        <h2 className="text-2xl font-display font-semibold text-text-primary">Systemic Drivers</h2>
                                        <span
                                            className="text-sm text-text-secondary font-normal cursor-help"
                                            title="Influence (%): normalized driver impact on the org-level signal."
                                        >
                                            Influence
                                        </span>
                                    </div>
                                    <SystemicDriversPanel
                                        drivers={data.systemicDrivers}
                                        selectedDriver={selectedSystemicDriver}
                                        onSelectDriver={handleSelectSystemicDriver}
                                    />
                                    <div className="flex justify-between items-center mt-2">
                                        <button className="text-xs text-text-tertiary italic hover:text-text-primary transition-colors">Show more</button>
                                        <p className="text-xs text-text-tertiary italic">Click for Details</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </section>



                {/* ====================================== */}
                {/* SECTION 4: Weekly Summary (E) */}
                {/* ====================================== */}
                <section className="dashboard-section">
                    <div className="dashboard-section-header">
                        {/* B1: Larger section heading - E1: no duplicate inside */}
                        <h2 className="text-2xl font-display font-semibold text-text-primary">Weekly Summary</h2>
                    </div>
                    <WeeklySummaryPanel interpretation={data.interpretation} />
                </section>

                {/* ====================================== */}
                {/* SECTION 5: Governance */}
                {/* ====================================== */}
                <section className="dashboard-section">
                    <div className="dashboard-section-header">
                        {/* B1: Larger section heading */}
                        <h2 className="text-2xl font-display font-semibold text-text-primary">Data Governance</h2>
                    </div>
                    <GovernancePanel data={data.governance} />
                </section>

                {/* Footer Spacer */}
                <div className="h-16" />

                {/* Onboarding Hint Overlay (Phase 20) */}
                <ExecutiveHintOverlay
                    status="OK"
                    primarySource={data.systemicDrivers.some(d => d.driverType === 'dependency') ? 'EXTERNAL' : 'INTERNAL'}
                    hasWatchlistItems={data.watchlist.length > 0}
                />
            </div>
        </DashboardBackground>
    );
}
