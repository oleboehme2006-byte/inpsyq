'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    RefreshCw,
    Building2,
    ArrowLeft,
    AlertTriangle,
    AlertCircle,
    CheckCircle,
    Sparkles,
    Clock,
    X,
    ExternalLink,
    Info,
    Link2,
} from 'lucide-react';
import Link from 'next/link';
import {
    DashboardBackground,
    SignalCard,
    TrendChart,
    GovernancePanel,
    type TrendDataPoint,
    type GovernanceData,
} from '@/components/dashboard';
import { getQualitativeState } from '@/lib/dashboard/indexSemantics';
import { safeToFixed } from '@/lib/utils/safeNumber';

// ==========================================
// Types
// ==========================================

interface InternalDriver {
    id: string;
    familyId: string;
    name: string;
    mechanism: string;
    contribution: number;
    affectedIndexId: string;
}

interface ExternalDependency {
    id: string;
    teamName: string;
    direction: 'receives_from' | 'blocks' | 'mutual';
    impactStrength: number;
    impactLabel: 'LOW' | 'MODERATE' | 'HIGH';
    description: string;
}

interface Action {
    id: string;
    title: string;
    affectedIndexId: string;
    addressesDriverFamilyIds: string[];
    rationale: string;
    displayPriority: ActionPriority;
    actionType: ActionType;
    isPartialMitigation: boolean;
    context: string;
    mechanism: string;
    modelEffect: string;
    limitation?: string;
    requiresCoordination?: string;
    implementationSteps?: string[];
    preconditions?: string[];
    measurements?: string[];
    risks?: string[];
}

// ==========================================
// Action Priority & Type (Part 1)
// ==========================================
type ActionPriority = 'NONE' | 'LOW' | 'NORMAL' | 'HIGH' | 'IMMEDIATE';
type ActionType = 'DIRECT_MITIGATION' | 'COORDINATION' | 'INSTRUMENTATION';

interface CoordinationNotice {
    id: string;
    title: string;
    targetTeam: string;
    reason: string;
}

// Unified selection type for Details panel
type DetailsSelection =
    | { type: 'action'; item: Action }
    | { type: 'driver'; item: InternalDriver }
    | { type: 'dependency'; item: ExternalDependency }
    | null;


interface TeamCockpitData {
    meta: {
        teamId: string;
        teamName: string;
        orgId: string;
        orgName: string;
        rangeWeeks: number;
        generatedAt: string;
        primaryLoadSource: 'internal' | 'external' | 'mixed';
        externalImpactScore: number;
        internalImpactScore: number;
    };
    indices: Record<string, number>;
    previousIndices: Record<string, number>;
    trends: Record<string, TrendDataPoint[]>;
    internalDrivers: Record<string, InternalDriver[]>;
    externalDependencies: ExternalDependency[];
    actions: Record<string, Action[]>;
    coordinationNotices: CoordinationNotice[];
    weeklyInsight: {
        internalDynamics: string;
        externalPressure: string;
        shortTermRisk: string;
        guidance: { should: string[]; shouldNot: string[] };
    };
    governance: GovernanceData;
}

// ==========================================
// Constants - Executive Parity Colors
// ==========================================

const INDEX_COLORS: Record<string, string> = {
    strain_index: 'text-strain',
    withdrawal_risk: 'text-withdrawal',
    trust_gap: 'text-trust-gap',
    engagement_index: 'text-engagement',
};

const INDEX_BORDER_COLORS: Record<string, string> = {
    strain_index: 'border-strain',
    withdrawal_risk: 'border-withdrawal',
    trust_gap: 'border-trust-gap',
    engagement_index: 'border-engagement',
};

const INDEX_RING_COLORS: Record<string, string> = {
    strain_index: 'ring-strain',
    withdrawal_risk: 'ring-withdrawal',
    trust_gap: 'ring-trust-gap',
    engagement_index: 'ring-engagement',
};

const INDEX_DISPLAY_NAMES: Record<string, string> = {
    strain_index: 'Strain Index',
    withdrawal_risk: 'Withdrawal Risk Index',
    trust_gap: 'Trust Gap Index',
    engagement_index: 'Engagement Index',
};

const PRIORITY_COLORS: Record<string, { border: string; ring: string; text: string; bg: string }> = {
    IMMEDIATE: { border: 'border-strain-high', ring: 'ring-strain-high', text: 'text-strain-high', bg: 'bg-strain-high' },
    HIGH: { border: 'border-withdrawal', ring: 'ring-withdrawal', text: 'text-withdrawal', bg: 'bg-withdrawal' },
    NORMAL: { border: 'border-meta', ring: 'ring-meta', text: 'text-meta', bg: 'bg-meta' },
    COORDINATION_ONLY: { border: 'border-text-tertiary', ring: 'ring-text-tertiary', text: 'text-text-tertiary', bg: 'bg-text-tertiary' },
};

// Family pill colors (Executive parity)
const FAMILY_COLORS: Record<string, { bg: string; text: string }> = {
    workload: { bg: 'bg-strain-muted', text: 'text-strain-high' },
    process: { bg: 'bg-withdrawal-muted', text: 'text-withdrawal' },
    context: { bg: 'bg-meta-muted', text: 'text-meta' },
    cognitive: { bg: 'bg-meta-muted', text: 'text-meta' },
    social: { bg: 'bg-trust-gap-muted', text: 'text-trust-gap' },
    communication: { bg: 'bg-trust-gap-muted', text: 'text-trust-gap' },
    recognition: { bg: 'bg-engagement-muted', text: 'text-engagement' },
    growth: { bg: 'bg-engagement-muted', text: 'text-engagement' },
    purpose: { bg: 'bg-engagement-muted', text: 'text-engagement' },
    transparency: { bg: 'bg-trust-gap-muted', text: 'text-trust-gap' },
};

// Impact label colors
const IMPACT_LABEL_COLORS: Record<string, string> = {
    HIGH: 'text-strain-high',
    MODERATE: 'text-withdrawal',
    LOW: 'text-text-secondary',
};

// Impact pill styles with ring emphasis (A3)
const IMPACT_PILL_STYLES: Record<string, string> = {
    HIGH: 'ring-strain-high text-strain-high bg-strain-muted/30',
    MODERATE: 'ring-withdrawal text-withdrawal bg-withdrawal-muted/30',
    LOW: 'ring-text-tertiary text-text-secondary bg-bg-hover',
};

// ==========================================
// SEVERITY HELPERS (ONE DIMENSION → ONE VISUAL LAYER)
// Borders and outlines encode SEVERITY and NOTHING ELSE.
// ==========================================

// Contribution Severity (Internal Drivers) - C0 to C4
const getContributionSeverity = (contribution: number): { level: string; border: string; ring: string; text: string } => {
    if (contribution >= 0.80) return { level: 'C4', border: 'border-strain-high', ring: 'ring-strain-high', text: 'text-strain-high' };
    if (contribution >= 0.60) return { level: 'C3', border: 'border-strain', ring: 'ring-strain', text: 'text-strain' };
    if (contribution >= 0.40) return { level: 'C2', border: 'border-withdrawal', ring: 'ring-withdrawal', text: 'text-withdrawal' };
    if (contribution >= 0.20) return { level: 'C1', border: 'border-meta', ring: 'ring-meta', text: 'text-meta' };
    return { level: 'C0', border: 'border-border', ring: 'ring-border', text: 'text-text-tertiary' };
};

// Impact Severity (External Dependencies) - I0 to I4
const getImpactSeverity = (impact: string): { level: string; border: string; ring: string; text: string } => {
    if (impact === 'CRITICAL') return { level: 'I4', border: 'border-strain-high', ring: 'ring-strain-high', text: 'text-strain-high' };
    if (impact === 'HIGH') return { level: 'I3', border: 'border-strain', ring: 'ring-strain', text: 'text-strain' };
    if (impact === 'MODERATE') return { level: 'I2', border: 'border-withdrawal', ring: 'ring-withdrawal', text: 'text-withdrawal' };
    if (impact === 'LOW') return { level: 'I1', border: 'border-meta', ring: 'ring-meta', text: 'text-meta' };
    return { level: 'I0', border: 'border-border', ring: 'ring-border', text: 'text-text-tertiary' };
};

// Priority Severity (Actions) - P0 to P4
const getPrioritySeverity = (priority: string): { level: string; border: string; ring: string; text: string } => {
    if (priority === 'IMMEDIATE') return { level: 'P4', border: 'border-strain-high', ring: 'ring-strain-high', text: 'text-strain-high' };
    if (priority === 'HIGH') return { level: 'P3', border: 'border-strain', ring: 'ring-strain', text: 'text-strain' };
    if (priority === 'NORMAL') return { level: 'P2', border: 'border-withdrawal', ring: 'ring-withdrawal', text: 'text-withdrawal' };
    if (priority === 'LOW') return { level: 'P1', border: 'border-meta', ring: 'ring-meta', text: 'text-meta' };
    return { level: 'P0', border: 'border-border', ring: 'ring-border', text: 'text-text-tertiary' };
};

// Legacy aliases for backward compatibility (used in detail panels)
const contributionToAccent = (contribution: number) => getContributionSeverity(contribution);
const impactToAccent = (impact: string) => getImpactSeverity(impact);
const priorityToAccent = (priority: string) => getPrioritySeverity(priority);

// Confidence derivation (deterministic from existing fields)
const deriveConfidence = (contribution: number, coverage: number = 0.7): 'High' | 'Medium' | 'Low' => {
    const score = contribution * 0.6 + coverage * 0.4;
    if (score >= 0.55) return 'High';
    if (score >= 0.35) return 'Medium';
    return 'Low';
};


// ==========================================
// Demo Teams
// ==========================================

const DEMO_TEAMS: Record<string, {
    name: string;
    strainBase: number;
    engagementBase: number;
    externalImpact: number;
    internalImpact: number;
}> = {
    engineering: { name: 'Engineering', strainBase: 0.52, engagementBase: 0.65, externalImpact: 0.15, internalImpact: 0.72 },
    product: { name: 'Product', strainBase: 0.68, engagementBase: 0.45, externalImpact: 0.78, internalImpact: 0.18 },
    sales: { name: 'Sales', strainBase: 0.28, engagementBase: 0.78, externalImpact: 0.10, internalImpact: 0.65 },
    support: { name: 'Support', strainBase: 0.45, engagementBase: 0.58, externalImpact: 0.42, internalImpact: 0.48 },
    operations: { name: 'Operations', strainBase: 0.32, engagementBase: 0.72, externalImpact: 0.08, internalImpact: 0.58 },
    hr: { name: 'HR', strainBase: 0.25, engagementBase: 0.82, externalImpact: 0.05, internalImpact: 0.45 },
    eng: { name: 'Engineering', strainBase: 0.52, engagementBase: 0.65, externalImpact: 0.15, internalImpact: 0.72 },
    ops: { name: 'Operations', strainBase: 0.32, engagementBase: 0.72, externalImpact: 0.08, internalImpact: 0.58 },
};

// ==========================================
// Mock Data Generator
// ==========================================

function generateTeamData(teamId: string): TeamCockpitData {
    const team = DEMO_TEAMS[teamId] || { name: 'Unknown', strainBase: 0.4, engagementBase: 0.6, externalImpact: 0.3, internalImpact: 0.5 };
    const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9'];

    const seed = teamId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const seededRandom = (min: number, max: number, offset: number) => {
        const x = Math.sin(seed + offset) * 10000;
        return min + (x - Math.floor(x)) * (max - min);
    };

    const generateTrend = (base: number, volatility: number, offset: number): TrendDataPoint[] => {
        let value = base;
        return weeks.map((week, i) => {
            value = Math.max(0.05, Math.min(0.95, value + (seededRandom(-0.5, 0.5, offset + i) * volatility)));
            return { week, value, lower: Math.max(0, value - 0.06), upper: Math.min(1, value + 0.06) };
        });
    };

    const strainTrend = generateTrend(team.strainBase, 0.08, 1);
    const withdrawalTrend = generateTrend(team.strainBase * 0.7, 0.07, 2);
    const trustTrend = generateTrend(team.strainBase * 0.6, 0.05, 3);
    const engagementTrend = generateTrend(team.engagementBase, 0.06, 4);

    const loadSource: 'internal' | 'external' | 'mixed' =
        team.externalImpact > team.internalImpact * 1.5 ? 'external' :
            team.externalImpact > team.internalImpact * 0.8 ? 'mixed' : 'internal';

    const hasInternalDrivers = team.internalImpact > 0.1;

    const internalDrivers: Record<string, InternalDriver[]> = hasInternalDrivers ? {
        strain_index: [
            { id: 'd1', familyId: 'workload', name: 'Workload Volume', mechanism: 'Sustained high task density reduces recovery capacity and increases cognitive fatigue', contribution: 0.68, affectedIndexId: 'strain_index' },
            { id: 'd2', familyId: 'process', name: 'Process Friction', mechanism: 'Inefficient workflows create unnecessary work and reduce throughput', contribution: 0.45, affectedIndexId: 'strain_index' },
            { id: 'd3', familyId: 'context', name: 'Context Switching', mechanism: 'Frequent task changes fragment attention and increase error rates', contribution: 0.38, affectedIndexId: 'strain_index' },
        ],
        withdrawal_risk: [
            { id: 'd1', familyId: 'recognition', name: 'Recognition Gap', mechanism: 'Insufficient acknowledgment erodes intrinsic motivation signals', contribution: 0.52, affectedIndexId: 'withdrawal_risk' },
            { id: 'd2', familyId: 'growth', name: 'Growth Stagnation', mechanism: 'Limited advancement visibility triggers disengagement patterns', contribution: 0.45, affectedIndexId: 'withdrawal_risk' },
        ],
        trust_gap: [
            { id: 'd1', familyId: 'transparency', name: 'Information Asymmetry', mechanism: 'Decision rationale not shared creates uncertainty and speculation', contribution: 0.55, affectedIndexId: 'trust_gap' },
        ],
        engagement_index: [
            { id: 'd1', familyId: 'purpose', name: 'Purpose Connection', mechanism: 'Clear link between daily work and meaningful outcomes sustains motivation', contribution: 0.62, affectedIndexId: 'engagement_index' },
        ],
    } : {
        strain_index: [],
        withdrawal_risk: [],
        trust_gap: [],
        engagement_index: [],
    };

    const externalDependencies: ExternalDependency[] =
        team.externalImpact > 0.2 ? [
            {
                id: 'dep1',
                teamName: 'Engineering',
                direction: 'receives_from',
                impactStrength: team.externalImpact * 0.8,
                impactLabel: team.externalImpact > 0.6 ? 'HIGH' : 'MODERATE',
                description: 'Delivery timelines directly constrain capacity planning and create downstream pressure'
            },
        ] : [];

    if (team.externalImpact > 0.3) {
        externalDependencies.push({
            id: 'dep2',
            teamName: 'Sales',
            direction: 'mutual',
            impactStrength: team.externalImpact * 0.3,
            impactLabel: 'MODERATE',
            description: 'Feature requests create scope pressure that compounds existing workload'
        });
    }

    const externalExceedsInternal = team.externalImpact > team.internalImpact;

    // ==========================================
    // ACTION GATING: Need States (N0-N3)
    // Actions MUST NOT always exist.
    // ==========================================

    // Inputs for Need State calculation
    const currentStrainValue = strainTrend[strainTrend.length - 1].value;
    const strainState = getQualitativeState('strain_index', currentStrainValue);
    const previousValue = strainTrend.length >= 3 ? strainTrend[strainTrend.length - 3].value : currentStrainValue;
    const trendSlope = currentStrainValue - previousValue;
    const topInternalDriver = internalDrivers.strain_index[0];
    const topDriverContribution = topInternalDriver?.contribution ?? 0;
    const hasHighDependency = externalDependencies.some(d => d.impactLabel === 'HIGH');

    // Compute Need State
    type NeedState = 'N0' | 'N1' | 'N2' | 'N3';
    const computeNeedState = (): NeedState => {
        // N3: Act - critical situation requiring immediate intervention
        if (strainState === 'critical' || (trendSlope > 0.08 && topDriverContribution >= 0.6)) {
            return 'N3';
        }
        // N2: Plan - clear issue but not critical
        if (strainState === 'concerning' || topDriverContribution >= 0.4 || hasHighDependency) {
            return 'N2';
        }
        // N1: Monitor - slight deterioration or uncertainty
        if (trendSlope > 0.03 || topDriverContribution >= 0.2) {
            return 'N1';
        }
        // N0: No action needed - stable or improving
        return 'N0';
    };
    const needState = computeNeedState();

    // Legacy compat
    const isUnhealthy = strainState === 'critical' || strainState === 'concerning';
    const isTrendingBad = trendSlope > 0.05;
    const hasDominantDriver = topDriverContribution >= 0.45;
    const hasActions = needState !== 'N0';

    // Compute action priority
    const computeActionPriority = (driver: InternalDriver | undefined): ActionPriority => {
        if (!hasActions) return 'NONE';
        if (!driver) return 'NONE';

        // Cannot exceed LOW if healthy state AND low driver contribution AND no high deps
        if (!isUnhealthy && driver.contribution < 0.45 && !hasHighDependency) {
            return 'LOW';
        }

        // IMMEDIATE only if: risk state high/critical AND leverage exists
        if ((strainState === 'critical' || (isTrendingBad && isUnhealthy)) && driver.contribution >= 0.5) {
            return 'IMMEDIATE';
        }

        // HIGH if at-risk or trend negative with decent leverage
        if ((isUnhealthy || isTrendingBad) && driver.contribution >= 0.35) {
            return 'HIGH';
        }

        // NORMAL for moderate situations
        if (driver.contribution >= 0.35) {
            return 'NORMAL';
        }

        return 'LOW';
    };

    const generateActions = (indexId: string, drivers: InternalDriver[]): Action[] => {
        if (!hasActions || drivers.length === 0) return [];

        const topDriver = drivers[0];
        const priority = computeActionPriority(topDriver);

        // If priority is NONE, don't generate
        if (priority === 'NONE') return [];

        // Determine action type based on load source
        const actionType: ActionType = externalExceedsInternal ? 'COORDINATION' : 'DIRECT_MITIGATION';

        return [{
            id: `act_${indexId}_1`,
            title: `Address ${topDriver.name}`,
            affectedIndexId: indexId,
            addressesDriverFamilyIds: [topDriver.familyId],
            rationale: actionType === 'COORDINATION'
                ? 'Coordination required due to external dependency dominance'
                : 'Direct intervention targets primary internal driver',
            displayPriority: priority,
            actionType,
            isPartialMitigation: externalExceedsInternal,
            context: `Current ${INDEX_DISPLAY_NAMES[indexId]} state: ${strainState}. Primary factor: ${topDriver.familyId}.`,
            mechanism: topDriver.mechanism,
            modelEffect: actionType === 'COORDINATION'
                ? 'Reduce dependency friction; buffer capacity'
                : `Reduce ${INDEX_DISPLAY_NAMES[indexId]} through targeted intervention`,
            limitation: externalExceedsInternal
                ? 'External load dominates. Full resolution requires cross-team coordination.'
                : undefined,
            implementationSteps: actionType === 'COORDINATION'
                ? ['Identify key stakeholders', 'Schedule alignment meeting', 'Define SLAs/handoffs', 'Establish escalation path', 'Monitor and adjust']
                : ['Assess current capacity', 'Identify quick wins', 'Implement process changes', 'Measure impact after 1 week', 'Iterate based on feedback'],
            preconditions: ['Team capacity available', 'Stakeholder buy-in', 'Clear success metrics'],
            measurements: ['Weekly index trend', 'Team feedback', 'Process cycle time', 'Backlog velocity'],
            risks: actionType === 'COORDINATION'
                ? ['Dependency team unavailable', 'Scope creep from negotiations', 'Timeline uncertainty']
                : ['Short-term productivity dip', 'Change resistance', 'Incomplete implementation'],
        }];
    };


    const actions: Record<string, Action[]> = {
        strain_index: generateActions('strain_index', internalDrivers.strain_index),
        withdrawal_risk: generateActions('withdrawal_risk', internalDrivers.withdrawal_risk),
        trust_gap: generateActions('trust_gap', internalDrivers.trust_gap),
        engagement_index: generateActions('engagement_index', internalDrivers.engagement_index),
    };

    const coordinationNotices: CoordinationNotice[] = loadSource === 'external' || loadSource === 'mixed' ? [
        {
            id: 'coord1',
            title: 'Cross-Team Dependency Resolution',
            targetTeam: 'Engineering',
            reason: `${safeToFixed(team.externalImpact * 100, 0)}% of load originates from external dependencies`
        }
    ] : [];

    const topDriver = internalDrivers.strain_index[0];
    const topDep = externalDependencies[0];

    const weeklyInsight = {
        internalDynamics: hasInternalDrivers
            ? `Primary internal driver: ${topDriver?.name || 'N/A'} (${safeToFixed((topDriver?.contribution || 0) * 100, 0)}% contribution). Internal factors account for ${safeToFixed(team.internalImpact * 100, 0)}% of current load.`
            : `No significant internal drivers. Load is externally originated.`,
        externalPressure: team.externalImpact > 0.2
            ? `Key dependency: ${topDep?.teamName || 'N/A'} (${topDep?.impactLabel || 'N/A'} impact). External factors contribute ${safeToFixed(team.externalImpact * 100, 0)}% to current pressure.`
            : `External dependencies minimal (${safeToFixed(team.externalImpact * 100, 0)}%). Team operates autonomously.`,
        shortTermRisk: getQualitativeState('strain_index', strainTrend[strainTrend.length - 1].value) === 'critical'
            ? `Elevated propagation risk. Projected strain: ${safeToFixed(team.strainBase * 1.15 * 100, 0)}% in 2 weeks without intervention.`
            : `Stable trajectory. Continue monitoring.`,
        guidance: loadSource === 'external' ? {
            should: ['Coordinate with dependent teams on scope', 'Protect team from additional commitments'],
            shouldNot: ['Add internal initiatives', 'Push productivity without addressing dependencies'],
        } : {
            should: ['Reduce workload volume', 'Streamline processes'],
            shouldNot: ['Add scope without capacity', 'Defer recognition'],
        },
    };

    return {
        meta: {
            teamId, teamName: team.name, orgId: 'org_demo', orgName: 'Acme Corporation',
            rangeWeeks: 9, generatedAt: new Date().toISOString(),
            primaryLoadSource: loadSource,
            externalImpactScore: team.externalImpact,
            internalImpactScore: team.internalImpact,
        },
        indices: { strain_index: strainTrend[strainTrend.length - 1].value, withdrawal_risk: withdrawalTrend[withdrawalTrend.length - 1].value, trust_gap: trustTrend[trustTrend.length - 1].value, engagement_index: engagementTrend[engagementTrend.length - 1].value },
        previousIndices: { strain_index: strainTrend[strainTrend.length - 2].value, withdrawal_risk: withdrawalTrend[withdrawalTrend.length - 2].value, trust_gap: trustTrend[trustTrend.length - 2].value, engagement_index: engagementTrend[engagementTrend.length - 2].value },
        trends: { strain_index: strainTrend, withdrawal_risk: withdrawalTrend, trust_gap: trustTrend, engagement_index: engagementTrend },
        internalDrivers, externalDependencies, actions, coordinationNotices, weeklyInsight,
        governance: { coverage: 0.78 + seededRandom(0, 0.15, 10), dataQuality: 0.82 + seededRandom(0, 0.12, 11), temporalStability: 0.80 + seededRandom(0, 0.15, 12), signalConfidence: 0.75 + seededRandom(0, 0.18, 13), sessionsCount: Math.floor(40 + seededRandom(0, 60, 14)), lastMeasuredAt: new Date().toISOString(), confidenceLevel: 'high' },
    };
}

// ##########################################
// Sub-Components
// ##########################################

// Internal Drivers Panel - CLICKABLE with hover (Executive parity)
const InternalDriversPanel: React.FC<{
    drivers: InternalDriver[];
    loadSource: string;
    selectedDriver: InternalDriver | null;
    onSelectDriver: (d: InternalDriver | null) => void;
    selectedIndex: string;
}> = ({ drivers, loadSource, selectedDriver, onSelectDriver, selectedIndex }) => {

    if (drivers.length === 0) {
        return (
            <div className="p-4 bg-bg-elevated rounded-lg border border-border/50">
                <div className="flex items-center gap-2 text-text-secondary">
                    <Info className="w-4 h-4" />
                    <span className="text-sm">No internal drivers identified. Load originates from external dependencies.</span>
                </div>
            </div>
        );
    }

    const sortedDrivers = [...drivers].sort((a, b) => b.contribution - a.contribution);
    const getFamilyColor = (familyId: string) => FAMILY_COLORS[familyId] || { bg: 'bg-bg-hover', text: 'text-text-secondary' };

    return (
        <div className="space-y-2">
            {sortedDrivers.slice(0, 3).map((driver, index) => {
                const isSelected = selectedDriver?.id === driver.id;
                const familyColor = getFamilyColor(driver.familyId);
                // SEVERITY-BASED: borders derived from contribution, NOT index
                const severity = getContributionSeverity(driver.contribution);

                return (
                    <motion.button
                        key={driver.id}
                        className={`w-full text-left p-3 bg-bg-elevated rounded-lg border transition-all ${isSelected
                            ? `ring-2 ${severity.ring} ${severity.border} bg-bg-hover`
                            : `${severity.border} hover:bg-bg-hover`
                            } ${!isSelected && selectedDriver ? 'opacity-60' : ''}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        onClick={() => onSelectDriver(isSelected ? null : driver)}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1 pr-3">
                                <span className="font-medium text-sm text-text-primary">{driver.name}</span>
                                <p className="text-xs text-text-secondary line-clamp-1 mt-0.5">{driver.mechanism}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className={`text-xs px-2 py-0.5 rounded ${familyColor.bg} ${familyColor.text}`}>
                                    {driver.familyId}
                                </span>
                                {/* Contribution % uses severity color, family tag stays neutral */}
                                <span className={`text-xs font-mono ${severity.text}`}>{safeToFixed(driver.contribution * 100, 0)}%</span>
                            </div>
                        </div>
                    </motion.button>
                );
            })}
            <p className="text-xs text-text-tertiary mt-2 italic">Click for details</p>
        </div>
    );
};

// External Dependencies Panel - CLICKABLE with hover (Executive parity)
const ExternalDependenciesPanel: React.FC<{
    dependencies: ExternalDependency[];
    selectedDependency: ExternalDependency | null;
    onSelectDependency: (d: ExternalDependency | null) => void;
    selectedIndex: string;
}> = ({ dependencies, selectedDependency, onSelectDependency, selectedIndex }) => {

    if (dependencies.length === 0) {
        return (
            <div className="p-4 bg-bg-elevated rounded-lg border border-border/50">
                <div className="flex items-center gap-2 text-text-secondary">
                    <CheckCircle className="w-4 h-4 text-engagement" />
                    <span className="text-sm">No significant external dependencies. Team operates autonomously.</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {dependencies.map((dep, index) => {
                const isSelected = selectedDependency?.id === dep.id;
                // SEVERITY-BASED: borders derived from impact, NOT index
                const severity = getImpactSeverity(dep.impactLabel);

                return (
                    <motion.button
                        key={dep.id}
                        className={`w-full text-left p-3 bg-bg-elevated rounded-lg border transition-all ${isSelected
                            ? `ring-2 ${severity.ring} ${severity.border} bg-bg-hover`
                            : `${severity.border} hover:bg-bg-hover`
                            } ${!isSelected && selectedDependency ? 'opacity-60' : ''}`}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        onClick={() => onSelectDependency(isSelected ? null : dep)}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1 pr-3">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <ExternalLink className="w-3 h-3 text-text-tertiary" />
                                    <span className="font-medium text-sm text-text-primary">{dep.teamName}</span>
                                </div>
                                <p className="text-xs text-text-secondary line-clamp-1">{dep.description}</p>
                            </div>
                            {/* Impact badge ALWAYS enclosed with background + outline */}
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ring-1 ${IMPACT_PILL_STYLES[dep.impactLabel] || 'ring-text-secondary text-text-secondary'}`}>
                                {dep.impactLabel}
                            </span>
                        </div>
                    </motion.button>
                );
            })}
            <p className="text-xs text-text-tertiary mt-2 italic">Click for details</p>
        </div>
    );
};

// Actions Panel - Executive parity styling with gating support
const ActionsPanel: React.FC<{
    actions: Action[];
    coordinationNotices: CoordinationNotice[];
    selectedAction: Action | null;
    onSelectAction: (a: Action | null) => void;
    internalDrivers: InternalDriver[];
}> = ({ actions, coordinationNotices, selectedAction, onSelectAction, internalDrivers }) => {

    // Case 1: No internal drivers - external load only
    if (internalDrivers.length === 0) {
        return (
            <div className="space-y-2">
                <div className="p-4 bg-bg-elevated rounded-lg border border-withdrawal/30">
                    <div className="flex items-center gap-2 text-withdrawal mb-2">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">No Internal Actions Available</span>
                    </div>
                    <p className="text-xs text-text-secondary">Load is externally originated. Internal actions would not address root cause.</p>
                </div>
                {coordinationNotices.map((notice) => (
                    <div key={notice.id} className="p-3 bg-bg-elevated rounded-lg border-l-4 border-text-tertiary">
                        <div className="flex items-center gap-2 mb-1">
                            <Link2 className="w-3 h-3 text-text-tertiary" />
                            <span className="font-medium text-sm text-text-primary">{notice.title}</span>
                        </div>
                        <p className="text-xs text-text-secondary">Coordinate with {notice.targetTeam}: {notice.reason}</p>
                    </div>
                ))}
            </div>
        );
    }

    // Case 2: Drivers exist but actions gated (N0: healthy state)
    if (actions.length === 0) {
        return (
            <div className="p-4 bg-bg-elevated rounded-lg border border-border/50">
                <div className="flex items-center gap-2 text-engagement mb-3">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">No Actions Recommended This Week</span>
                </div>
                <p className="text-xs text-text-secondary mb-3">
                    Current state is stable with no dominant negative drivers. No intervention required at this time.
                </p>
                <div className="border-t border-border/30 pt-3">
                    <h4 className="text-xs font-mono text-text-tertiary uppercase mb-2">Continue Monitoring</h4>
                    <ul className="space-y-1">
                        <li className="text-xs text-text-secondary flex items-start gap-2">
                            <span className="text-meta">•</span>Weekly index trend direction
                        </li>
                        <li className="text-xs text-text-secondary flex items-start gap-2">
                            <span className="text-meta">•</span>Team feedback sentiment shifts
                        </li>
                        <li className="text-xs text-text-secondary flex items-start gap-2">
                            <span className="text-meta">•</span>Process cycle time variations
                        </li>
                    </ul>
                </div>
            </div>
        );
    }


    const getPriorityConfig = (priority: string, isPartial: boolean) => {
        const colors = PRIORITY_COLORS[priority] || PRIORITY_COLORS.NORMAL;
        const icon = priority === 'IMMEDIATE' ? <AlertTriangle className="w-3 h-3" /> :
            priority === 'HIGH' ? <AlertCircle className="w-3 h-3" /> :
                <CheckCircle className="w-3 h-3" />;
        return { ...colors, icon, label: isPartial ? `${priority} (Partial)` : priority };
    };

    return (
        <div className="space-y-2">
            {actions.slice(0, 3).map((action, index) => {
                const config = getPriorityConfig(action.displayPriority, action.isPartialMitigation);
                const isSelected = selectedAction?.id === action.id;
                const triggeredBy = internalDrivers.find(d => action.addressesDriverFamilyIds.includes(d.familyId));

                return (
                    <motion.button
                        key={action.id}
                        className={`w-full text-left p-3 bg-bg-elevated rounded-lg border-l-4 ${config.border} transition-all ${isSelected ? `ring-2 ${config.ring} bg-bg-hover` : 'hover:bg-bg-hover'
                            } ${!isSelected && selectedAction ? 'opacity-60' : ''}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        onClick={() => onSelectAction(isSelected ? null : action)}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm text-text-primary">{action.title}</span>
                            <div className={`flex items-center gap-1 ${config.text}`}>
                                {config.icon}
                                <span className="text-xs">{config.label}</span>
                            </div>
                        </div>
                        {triggeredBy && (
                            <p className="text-xs text-meta mb-1">Targets: {triggeredBy.familyId}</p>
                        )}
                        {action.isPartialMitigation && (
                            <div className="flex items-center gap-1 text-xs text-withdrawal">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Partial mitigation only</span>
                            </div>
                        )}
                    </motion.button>
                );
            })}
            <p className="text-xs text-text-tertiary mt-2 italic">Click for details</p>
        </div>
    );
};

// Unified Details Panel - supports action, driver, and dependency
// A6: Border colors driven by item severity, not index
// A2: Richer Action details
// A3: Richer Dependency details
const UnifiedDetailsPanel: React.FC<{
    selection: DetailsSelection;
    drivers: InternalDriver[];
    selectedIndex: string;
    teamData: TeamCockpitData;
    onClose: () => void;
}> = ({ selection, drivers, selectedIndex, teamData, onClose }) => {
    if (!selection) return null;

    const indexName = INDEX_DISPLAY_NAMES[selectedIndex];

    // ACTION DETAILS - 7 MANDATORY SECTIONS
    // 1. Goal, 2. Why this action, 3. Execution plan
    // 4. Dependencies/coordination, 5. Expected signals, 6. Risks/trade-offs, 7. Confidence + time-to-signal
    if (selection.type === 'action') {
        const action = selection.item;
        const accent = priorityToAccent(action.displayPriority);
        const severity = getPrioritySeverity(action.displayPriority);
        const triggeredDrivers = drivers.filter(d => action.addressesDriverFamilyIds.includes(d.familyId));
        const topDriver = triggeredDrivers[0];
        const confidence = topDriver ? deriveConfidence(topDriver.contribution, teamData.governance.coverage) : 'Medium';
        const expectedReduction = topDriver ? safeToFixed(topDriver.contribution * 0.3 * 100, 0) : '10';

        // Derive goal from action type
        const goal = action.actionType === 'COORDINATION'
            ? `Reduce external dependency friction with ${triggeredDrivers.map(d => d.familyId).join(', ')} factors through cross-team alignment.`
            : `Directly address ${triggeredDrivers.map(d => d.familyId).join(', ')} factors to reduce ${indexName}.`;

        // Why this action
        const whyThisAction = topDriver
            ? `${topDriver.name} is contributing ${safeToFixed(topDriver.contribution * 100, 0)}% to current ${indexName}. This action targets the root cause with highest leverage.`
            : `Targeting identified drivers to improve team state.`;

        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`bg-bg-elevated rounded-lg p-5 border ${accent.border}`}
            >
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <span className="text-xs text-text-tertiary uppercase font-mono">Action</span>
                        <h3 className="font-medium text-text-primary">{action.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${accent.text} bg-bg-hover`}>{severity.level} • {action.displayPriority}</span>
                        <button onClick={onClose} className="p-1 text-text-tertiary hover:text-text-secondary"><X className="w-4 h-4" /></button>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* 1. Goal */}
                    <div>
                        <h4 className="text-xs font-mono text-text-tertiary uppercase mb-1">Goal</h4>
                        <p className="text-sm text-text-secondary">{goal}</p>
                    </div>

                    {/* 2. Why this action */}
                    <div>
                        <h4 className="text-xs font-mono text-text-tertiary uppercase mb-1">Why This Action</h4>
                        <p className="text-sm text-text-secondary">{whyThisAction}</p>
                    </div>

                    {/* 3. Execution plan */}
                    <div>
                        <h4 className="text-xs font-mono text-text-tertiary uppercase mb-1">Execution Plan</h4>
                        <ol className="space-y-1">
                            {(action.implementationSteps || ['Assess situation', 'Identify quick wins', 'Execute changes', 'Measure impact']).map((step, i) => (
                                <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                                    <span className="text-meta font-mono">{i + 1}.</span>{step}
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* 4. Dependencies / coordination */}
                    <div>
                        <h4 className="text-xs font-mono text-text-tertiary uppercase mb-1">Dependencies / Coordination</h4>
                        {action.requiresCoordination || action.actionType === 'COORDINATION' ? (
                            <p className="text-sm text-text-secondary">
                                {action.requiresCoordination || `Requires coordination with dependent teams. External load contributes ${safeToFixed(teamData.meta.externalImpactScore * 100, 0)}% to current pressure.`}
                            </p>
                        ) : (
                            <p className="text-sm text-text-secondary text-text-tertiary italic">None — can be executed independently by the team.</p>
                        )}
                    </div>

                    {/* 5. Expected signals (what should move) */}
                    <div>
                        <h4 className="text-xs font-mono text-text-tertiary uppercase mb-1">Expected Signals</h4>
                        <ul className="space-y-1">
                            <li className="text-xs text-text-secondary flex items-start gap-2"><span className="text-engagement">•</span>~{expectedReduction}% reduction in {indexName} (1-2 weeks)</li>
                            <li className="text-xs text-text-secondary flex items-start gap-2"><span className="text-engagement">•</span>Improved team sentiment on {topDriver?.familyId || 'targeted'} factors</li>
                            {(action.measurements || []).slice(0, 2).map((m, i) => (
                                <li key={i} className="text-xs text-text-secondary flex items-start gap-2"><span className="text-meta">•</span>{m}</li>
                            ))}
                        </ul>
                    </div>

                    {/* 6. Risks / trade-offs */}
                    <div className="p-3 rounded-lg border border-withdrawal/50 bg-withdrawal-muted/10">
                        <h4 className="text-xs font-mono uppercase mb-1 text-withdrawal">Risks & Trade-offs</h4>
                        <ul className="space-y-1">
                            {(action.risks || ['Short-term productivity adjustment', 'Change management overhead']).slice(0, 3).map((risk, i) => (
                                <li key={i} className="text-xs text-text-primary flex items-start gap-2"><span className="text-withdrawal">•</span>{risk}</li>
                            ))}
                            {action.limitation && (
                                <li className="text-xs text-text-primary flex items-start gap-2"><span className="text-withdrawal">•</span>{action.limitation}</li>
                            )}
                        </ul>
                    </div>

                    {/* 7. Confidence + time-to-signal */}
                    <div className="flex items-center justify-between p-2 bg-bg-hover rounded text-xs">
                        <span className="text-text-tertiary">Confidence</span>
                        <span className={confidence === 'High' ? 'text-engagement' : confidence === 'Medium' ? 'text-withdrawal' : 'text-text-secondary'}>
                            {confidence} — Time to signal: 1-2 weeks
                        </span>
                    </div>
                </div>
            </motion.div>
        );
    }

    // DRIVER DETAILS - 7 MANDATORY SECTIONS
    // 1. What it is, 2. Why it matters now, 3. Evidence this period
    // 4. Mechanism, 5. Leading indicators, 6. If we do nothing, 7. Confidence
    if (selection.type === 'driver') {
        const driver = selection.item;
        const accent = contributionToAccent(driver.contribution);
        const familyColor = FAMILY_COLORS[driver.familyId] || { bg: 'bg-bg-hover', text: 'text-text-secondary' };
        const confidence = deriveConfidence(driver.contribution, teamData.governance.coverage);
        const severity = getContributionSeverity(driver.contribution);

        // Derive contextual content
        const whatItIs = {
            workload: 'A sustained imbalance between task volume and available capacity.',
            process: 'Inefficiencies in workflows that create unnecessary friction and delays.',
            context: 'Frequent shifts in priorities or environment that fragment focus.',
            cognitive: 'Excessive mental demand from complexity or information overload.',
            social: 'Dynamics in team relationships affecting collaboration quality.',
            communication: 'Gaps or friction in information flow across the team.',
            recognition: 'Insufficient acknowledgment of contributions and achievements.',
            growth: 'Limited visibility or access to professional development opportunities.',
            purpose: 'Connection between daily work and meaningful organizational goals.',
            transparency: 'Clarity around decisions, rationale, and organizational direction.',
        }[driver.familyId] || 'A factor affecting team dynamics and performance.';

        const whyNow = driver.contribution >= 0.5
            ? `This is currently the dominant driver, contributing ${safeToFixed(driver.contribution * 100, 0)}% to the observed signal. Addressing it has the highest leverage for improvement.`
            : driver.contribution >= 0.35
                ? `Contributing ${safeToFixed(driver.contribution * 100, 0)}% to the current signal. While not dominant, it amplifies primary drivers and merits attention.`
                : `A secondary factor at ${safeToFixed(driver.contribution * 100, 0)}% contribution. Address after primary drivers for compounding effect.`;

        const evidenceBullets = [
            `W7–W9: Contribution stable at ${safeToFixed(driver.contribution * 100, 0)}%`,
            `W8: ${driver.familyId} signals detected in team feedback`,
            `W9: Mechanism observed in process telemetry`,
        ];

        const inactionConsequence = driver.contribution >= 0.5
            ? 'Continued degradation expected. Index likely to worsen by 10-15% over 2-3 weeks.'
            : 'Slow compounding effect. May amplify other drivers over time.';

        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`bg-bg-elevated rounded-lg p-5 border ${accent.border}`}
            >
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <span className="text-xs text-text-tertiary uppercase font-mono">Internal Driver</span>
                        <h3 className="font-medium text-text-primary">{driver.name}</h3>
                    </div>
                    <button onClick={onClose} className="p-1 text-text-tertiary hover:text-text-secondary"><X className="w-4 h-4" /></button>
                </div>

                {/* Contribution header (shown once) */}
                <div className="flex items-center justify-between p-2 bg-bg-hover rounded-lg mb-4">
                    <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${familyColor.bg} ${familyColor.text}`}>{driver.familyId}</span>
                        <span className="text-xs text-text-tertiary">{severity.level}</span>
                    </div>
                    <span className={`text-sm font-mono ${accent.text}`}>{safeToFixed(driver.contribution * 100, 0)}%</span>
                </div>

                <div className="space-y-4">
                    {/* 1. What it is */}
                    <div>
                        <h4 className="text-xs font-mono text-text-tertiary uppercase mb-1">What It Is</h4>
                        <p className="text-sm text-text-secondary">{whatItIs}</p>
                    </div>

                    {/* 2. Why it matters now */}
                    <div>
                        <h4 className="text-xs font-mono text-text-tertiary uppercase mb-1">Why It Matters Now</h4>
                        <p className="text-sm text-text-secondary">{whyNow}</p>
                    </div>

                    {/* 3. Evidence this period */}
                    <div>
                        <h4 className="text-xs font-mono text-text-tertiary uppercase mb-1">Evidence This Period</h4>
                        <ul className="space-y-1">
                            {evidenceBullets.map((bullet, i) => (
                                <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                                    <span className="text-meta">•</span>{bullet}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* 4. Mechanism */}
                    <div>
                        <h4 className="text-xs font-mono text-text-tertiary uppercase mb-1">Mechanism</h4>
                        <p className="text-sm text-text-secondary">{driver.mechanism}</p>
                    </div>

                    {/* 5. Leading indicators to watch */}
                    <div>
                        <h4 className="text-xs font-mono text-text-tertiary uppercase mb-1">Leading Indicators</h4>
                        <ul className="space-y-1">
                            <li className="text-xs text-text-secondary flex items-start gap-2"><span className="text-meta">•</span>Week-over-week contribution trend</li>
                            <li className="text-xs text-text-secondary flex items-start gap-2"><span className="text-meta">•</span>Team sentiment on {driver.familyId} topics</li>
                            <li className="text-xs text-text-secondary flex items-start gap-2"><span className="text-meta">•</span>Index trajectory (3-week window)</li>
                        </ul>
                    </div>

                    {/* 6. If we do nothing */}
                    <div className="p-3 rounded-lg border border-withdrawal/50 bg-withdrawal-muted/10">
                        <h4 className="text-xs font-mono uppercase mb-1 text-withdrawal">If We Do Nothing</h4>
                        <p className="text-sm text-text-primary">{inactionConsequence}</p>
                    </div>

                    {/* 7. Confidence */}
                    <div className="flex items-center justify-between p-2 bg-bg-hover rounded text-xs">
                        <span className="text-text-tertiary">Confidence</span>
                        <span className={confidence === 'High' ? 'text-engagement' : confidence === 'Medium' ? 'text-withdrawal' : 'text-text-secondary'}>
                            {confidence} — Based on {teamData.meta.rangeWeeks} weeks data, {safeToFixed(teamData.governance.coverage * 100, 0)}% coverage
                        </span>
                    </div>
                </div>
            </motion.div>
        );
    }

    // DEPENDENCY DETAILS (A3: Pathway/Failure Mode/Early Signals/Coordination Levers/What We Control)
    if (selection.type === 'dependency') {
        const dep = selection.item;
        const accent = impactToAccent(dep.impactLabel);
        const isHighImpact = dep.impactLabel === 'HIGH';
        const strainRising = teamData.indices.strain_index > (teamData.previousIndices.strain_index || 0);

        // Derive failure mode based on dependency
        const failureModeMap: Record<string, string> = {
            'Engineering': 'Delayed deliverables create cascading schedule pressure, forcing scope trade-offs and increased overtime.',
            'Sales': 'Unvetted commitments introduce scope creep and timeline compression without corresponding capacity.',
            'Operations': 'Operational bottlenecks constrain throughput and create process friction.',
            'Support': 'Escalation volume fluctuations disrupt planned work and drain cognitive capacity.',
        };
        const failureMode = failureModeMap[dep.teamName] || `${dep.teamName} constraints propagate workload and timeline pressure to this team.`;

        // Derive early signals based on existing data
        const earlySignals: string[] = [];
        if (strainRising && isHighImpact) earlySignals.push('Delivery slippage risk elevated');
        if (dep.impactStrength > 0.5) earlySignals.push('Dependency concentration above threshold');
        if (teamData.meta.primaryLoadSource === 'external') earlySignals.push('External load dominant—internal actions have limited effect');
        if (earlySignals.length === 0) earlySignals.push('No immediate warning signals');

        // Coordination levers based on dependency team
        const leverMap: Record<string, string[]> = {
            'Engineering': ['Clarify delivery timelines', 'Establish SLA for handoffs', 'Escalation path for blockers'],
            'Sales': ['Scope freeze agreement', 'Commitment vetting process', 'Pipeline visibility sharing'],
            'Operations': ['Capacity alignment sync', 'Process bottleneck review', 'Resource reallocation request'],
            'Support': ['Escalation volume forecast', 'Triage priority alignment', 'Buffer capacity negotiation'],
        };
        const levers = leverMap[dep.teamName] || ['Timeline alignment', 'Scope clarity', 'Escalation path'];

        // What we can control (varies by impact)
        const whatWeControl = isHighImpact
            ? 'We cannot directly reduce this dependency. Focus on reducing sensitivity and securing coordination commitments.'
            : 'Moderate dependency. We can buffer through internal capacity management while maintaining coordination.';

        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`bg-bg-elevated rounded-lg p-5 border ${accent.border}`}
            >
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <span className="text-xs text-text-tertiary uppercase font-mono">External Dependency</span>
                        <h3 className="font-medium text-text-primary">{dep.teamName}</h3>
                    </div>
                    <button onClick={onClose} className="p-1 text-text-tertiary hover:text-text-secondary"><X className="w-4 h-4" /></button>
                </div>
                <div className="space-y-3">
                    {/* Impact */}
                    <div className="flex items-center justify-between p-3 bg-bg-hover rounded-lg">
                        <span className="text-sm text-text-secondary">Impact</span>
                        <span className={`text-sm font-semibold px-2 py-0.5 rounded ring-1 ${IMPACT_PILL_STYLES[dep.impactLabel]}`}>{dep.impactLabel}</span>
                    </div>
                    {/* Pathway */}
                    <div>
                        <h4 className="text-xs font-mono text-text-tertiary uppercase mb-1">Pathway</h4>
                        <p className="text-sm text-text-secondary">{dep.description}</p>
                    </div>
                    {/* Failure Mode */}
                    <div>
                        <h4 className="text-xs font-mono text-text-tertiary uppercase mb-1">Failure Mode</h4>
                        <p className="text-sm text-text-secondary">{failureMode}</p>
                    </div>
                    {/* Early Signals */}
                    <div>
                        <h4 className="text-xs font-mono text-text-tertiary uppercase mb-1">Early Signals</h4>
                        <ul className="text-sm text-text-secondary space-y-1">
                            {earlySignals.map((signal, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className={strainRising ? 'text-withdrawal' : 'text-engagement'}>•</span> {signal}
                                </li>
                            ))}
                        </ul>
                    </div>
                    {/* Coordination Levers */}
                    <div>
                        <h4 className="text-xs font-mono text-text-tertiary uppercase mb-1">Coordination Levers</h4>
                        <ul className="text-sm text-text-secondary space-y-1">
                            {levers.map((lever, i) => (
                                <li key={i} className="flex items-start gap-2"><span className="text-meta">•</span> {lever}</li>
                            ))}
                        </ul>
                    </div>
                    {/* What We Control */}
                    <div className="p-3 rounded-lg border border-text-tertiary/50 bg-bg-hover/50">
                        <h4 className="text-xs font-mono uppercase mb-1 text-text-tertiary">What We Control</h4>
                        <p className="text-sm text-text-primary">{whatWeControl}</p>
                    </div>
                </div>
            </motion.div>
        );
    }

    return null;
};

// Weekly Summary - 7 FIXED SECTIONS (Minimal Color Design)
// 1. State Snapshot, 2. Top Internal Dynamics, 3. External Dependencies
// 4. Recommended Focus, 5. What to Avoid, 6. Measurement Plan, 7. Confidence
const WeeklySummaryPanel: React.FC<{ insight: TeamCockpitData['weeklyInsight']; meta: TeamCockpitData['meta'] }> = ({ insight, meta }) => {
    const loadSource = meta.primaryLoadSource;
    const isExternalDominant = meta.externalImpactScore > meta.internalImpactScore;

    // 1. State Snapshot
    const stateDescription = loadSource === 'external'
        ? `External dependencies are the primary source of current pressure (${safeToFixed(meta.externalImpactScore * 100, 0)}% contribution). Internal interventions will have limited effect without coordination.`
        : loadSource === 'internal'
            ? `Internal factors are driving current pressure (${safeToFixed(meta.internalImpactScore * 100, 0)}% contribution). Direct team-level actions have high leverage.`
            : `Mixed load from internal (${safeToFixed(meta.internalImpactScore * 100, 0)}%) and external (${safeToFixed(meta.externalImpactScore * 100, 0)}%) sources. Address internal factors while coordinating on dependencies.`;

    // 6. Measurement Plan
    const measurementSignals = [
        'Weekly index trend (3-week window)',
        'Team sentiment on primary driver topics',
        loadSource === 'external' ? 'Dependency delivery velocity' : 'Process cycle time',
    ];

    // 7. Confidence
    const confidenceLevel = meta.rangeWeeks >= 8 ? 'High' : meta.rangeWeeks >= 4 ? 'Medium' : 'Low';
    const coverageNote = `${meta.rangeWeeks} weeks data`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-border bg-bg-elevated p-6"
        >
            {/* Header - Minimal styling */}
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-border/50">
                <div className="flex items-center gap-2 text-text-secondary">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">Weekly Synthesis</span>
                </div>
                <span className="text-xs text-text-tertiary">Week of {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>

            <div className="space-y-5">
                {/* 1. State Snapshot (2-3 sentences) */}
                <div>
                    <h4 className="text-xs font-mono text-text-tertiary uppercase mb-2">State Snapshot</h4>
                    <p className="text-sm text-text-primary leading-relaxed">{stateDescription}</p>
                </div>

                {/* 2. Top Internal Dynamics (max 2 drivers cited) */}
                <div>
                    <h4 className="text-xs font-mono text-text-tertiary uppercase mb-2">Top Internal Dynamics</h4>
                    <p className="text-sm text-text-secondary">{insight.internalDynamics}</p>
                </div>

                {/* 3. External Dependencies (max 2 cited) */}
                <div>
                    <h4 className="text-xs font-mono text-text-tertiary uppercase mb-2">External Dependencies</h4>
                    <p className="text-sm text-text-secondary">{insight.externalPressure}</p>
                </div>

                {/* 4. Recommended Focus (max 3 actionable items) - Subtle border, no bg color */}
                <div className="p-3 rounded-lg border border-border/70">
                    <h4 className="text-xs font-mono text-text-tertiary uppercase mb-2">Recommended Focus</h4>
                    <ul className="space-y-1.5">
                        {insight.guidance.should.slice(0, 3).map((item, i) => (
                            <li key={i} className="text-xs text-text-primary flex items-start gap-2">
                                <span className="text-meta">→</span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 5. What to Avoid (max 2 anti-patterns) - Subtle border, no bg color */}
                <div className="p-3 rounded-lg border border-border/70">
                    <h4 className="text-xs font-mono text-text-tertiary uppercase mb-2">What to Avoid</h4>
                    <ul className="space-y-1.5">
                        {insight.guidance.shouldNot.slice(0, 2).map((item, i) => (
                            <li key={i} className="text-xs text-text-primary flex items-start gap-2">
                                <span className="text-text-tertiary">×</span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 6. Measurement Plan (3 metrics/signals) */}
                <div>
                    <h4 className="text-xs font-mono text-text-tertiary uppercase mb-2">Measurement Plan</h4>
                    <ul className="space-y-1">
                        {measurementSignals.map((signal, i) => (
                            <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                                <span className="text-meta">•</span>{signal}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 7. Confidence & Data Coverage (1 line footer) */}
                <div className="flex items-center justify-between pt-3 border-t border-border/30 text-xs">
                    <span className="text-text-tertiary">Confidence & Coverage</span>
                    <span className={confidenceLevel === 'High' ? 'text-text-primary' : confidenceLevel === 'Medium' ? 'text-text-secondary' : 'text-text-tertiary'}>
                        {confidenceLevel} — {coverageNote}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};


// ##########################################
// Main Component
// ##########################################

export interface TeamCockpitProps {
    teamId: string;
}

export function TeamCockpit({ teamId }: TeamCockpitProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<TeamCockpitData | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<string>('strain_index');
    const [detailsSelection, setDetailsSelection] = useState<DetailsSelection>(null);
    const [dataSource, setDataSource] = useState<'api' | 'mock' | 'error'>('api');
    const [errorMessage, setErrorMessage] = useState<string>('');

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            setErrorMessage('');

            // Try real API first
            try {
                const { fetchTeamData, shouldUseMocks, getOrgId } = await import('@/lib/dashboard/teamAdapter');
                const orgId = getOrgId();

                // Only use mocks if explicitly enabled
                if (!shouldUseMocks() && orgId) {
                    const result = await fetchTeamData(teamId);
                    if (result.data) {
                        // Map API data to component props
                        const apiData = result.data;
                        const mappedData: TeamCockpitData = {
                            meta: {
                                teamId: apiData.meta.teamId,
                                teamName: apiData.meta.teamName || 'Team',
                                orgId: apiData.meta.orgId,
                                orgName: apiData.meta.orgName || 'Organization',
                                rangeWeeks: apiData.meta.rangeWeeks || 9,
                                generatedAt: apiData.meta.generatedAt,
                                primaryLoadSource: apiData.meta.primaryLoadSource || 'internal',
                                internalImpactScore: apiData.meta.internalImpactScore || 0.5,
                                externalImpactScore: apiData.meta.externalImpactScore || 0.3,
                            },
                            indices: apiData.indices as any,
                            previousIndices: apiData.previousIndices as any,
                            trends: apiData.trends as any,
                            internalDrivers: apiData.internalDrivers as any || {},
                            externalDependencies: apiData.externalDependencies as any || [],
                            actions: apiData.actions as any || {},
                            coordinationNotices: apiData.coordinationNotices as any || [],
                            weeklyInsight: apiData.weeklyInsight as any || { internalDynamics: '', externalPressure: '', shortTermRisk: '', guidance: { should: [], shouldNot: [] } },
                            governance: apiData.governance as any,
                        };
                        setData(mappedData);
                        setDataSource('api');
                        setIsLoading(false);
                        return;
                    }
                    // API failed
                    if (result.error) {
                        console.warn('[Team] API failed:', result.error);
                        setErrorMessage(result.error);
                    }
                }

                // Mock fallback - ONLY if DEV flag explicitly enabled
                if (shouldUseMocks()) {
                    console.log('[Team] Using mock data (DEV flag enabled)');
                    setData(generateTeamData(teamId));
                    setDataSource('mock');
                    setIsLoading(false);
                    return;
                }

                // No mock allowed, show error
                setDataSource('error');
                setErrorMessage('Unable to load team data. Run pipeline:dev:rebuild first.');
                setIsLoading(false);

            } catch (e: any) {
                console.warn('[Team] Failed to load data:', e.message);

                // Check if mocks are explicitly enabled
                const devMocks = process.env.NEXT_PUBLIC_DASHBOARD_DEV_MOCKS === 'true';
                if (devMocks && process.env.NODE_ENV === 'development') {
                    setData(generateTeamData(teamId));
                    setDataSource('mock');
                } else {
                    setDataSource('error');
                    setErrorMessage(e.message || 'Failed to load data');
                }
                setIsLoading(false);
            }
        };
        loadData();
    }, [teamId]);
    useEffect(() => { setDetailsSelection(null); }, [selectedIndex]);

    const handleRefresh = async () => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const { fetchTeamData, shouldUseMocks, getOrgId } = await import('@/lib/dashboard/teamAdapter');
            const orgId = getOrgId();

            if (!shouldUseMocks() && orgId) {
                const result = await fetchTeamData(teamId);
                if (result.data) {
                    const apiData = result.data;
                    const mappedData: TeamCockpitData = {
                        meta: apiData.meta as any,
                        indices: apiData.indices as any,
                        previousIndices: apiData.previousIndices as any,
                        trends: apiData.trends as any,
                        internalDrivers: apiData.internalDrivers as any || {},
                        externalDependencies: apiData.externalDependencies as any || [],
                        actions: apiData.actions as any || {},
                        coordinationNotices: apiData.coordinationNotices as any || [],
                        weeklyInsight: apiData.weeklyInsight as any || { internalDynamics: '', externalPressure: '', shortTermRisk: '', guidance: { should: [], shouldNot: [] } },
                        governance: apiData.governance as any,
                    };
                    setData(mappedData);
                    setDataSource('api');
                    setIsLoading(false);
                    return;
                }
            }

            if (shouldUseMocks()) {
                setData(generateTeamData(teamId));
                setDataSource('mock');
            } else {
                setDataSource('error');
                setErrorMessage('Unable to refresh data');
            }
        } catch (e: any) {
            const devMocks = process.env.NEXT_PUBLIC_DASHBOARD_DEV_MOCKS === 'true';
            if (devMocks && process.env.NODE_ENV === 'development') {
                setData(generateTeamData(teamId));
                setDataSource('mock');
            } else {
                setDataSource('error');
                setErrorMessage(e.message);
            }
        }
        setIsLoading(false);
    };

    // Selection handlers
    const handleSelectDriver = (driver: InternalDriver | null) => {
        setDetailsSelection(driver ? { type: 'driver', item: driver } : null);
    };
    const handleSelectDependency = (dep: ExternalDependency | null) => {
        setDetailsSelection(dep ? { type: 'dependency', item: dep } : null);
    };
    const handleSelectAction = (action: Action | null) => {
        setDetailsSelection(action ? { type: 'action', item: action } : null);
    };
    const handleCloseDetails = () => setDetailsSelection(null);

    const teamExists = DEMO_TEAMS[teamId];

    if (!teamExists) {
        return (
            <DashboardBackground>
                <div className="dashboard-container flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <h1 className="text-2xl font-display font-semibold text-text-primary mb-2">Team Not Found</h1>
                        <p className="text-text-secondary mb-6">The team "{teamId}" does not exist.</p>
                        <Link href="/executive" className="inline-flex items-center gap-2 text-meta hover:text-meta/80 transition-colors"><ArrowLeft className="w-4 h-4" /><span>Back to Executive Dashboard</span></Link>
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
                        <p className="text-text-secondary mb-4">{errorMessage || 'Unable to load team dashboard data.'}</p>
                        <p className="text-text-tertiary text-sm mb-6">Run <code className="bg-bg-hover px-1 rounded">npm run pipeline:dev:rebuild</code> to generate weekly products.</p>
                        <div className="flex gap-4 justify-center">
                            <button onClick={handleRefresh} className="px-4 py-2 bg-meta text-white rounded-lg hover:bg-meta/80 transition-colors">Retry</button>
                            <Link href="/executive" className="px-4 py-2 border border-border rounded-lg text-text-secondary hover:bg-bg-hover transition-colors">Back to Executive</Link>
                        </div>
                    </div>
                </div>
            </DashboardBackground>
        );
    }

    if (isLoading || !data) {
        return (
            <DashboardBackground>
                <div className="dashboard-container flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <motion.div className="w-12 h-12 border-2 border-meta border-t-transparent rounded-full mx-auto mb-4" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                        <p className="text-text-secondary">Loading team cockpit...</p>
                    </div>
                </div>
            </DashboardBackground>
        );
    }

    const currentDrivers = data.internalDrivers[selectedIndex] || [];
    const currentActions = data.actions[selectedIndex] || [];

    const loadSourceLabel = { internal: 'Internal', external: 'External', mixed: 'Mixed' }[data.meta.primaryLoadSource];
    const loadSourceColor = { internal: 'text-engagement', external: 'text-withdrawal', mixed: 'text-meta' }[data.meta.primaryLoadSource];

    // Get currently selected items
    const selectedDriver = detailsSelection?.type === 'driver' ? detailsSelection.item : null;
    const selectedDependency = detailsSelection?.type === 'dependency' ? detailsSelection.item : null;
    const selectedAction = detailsSelection?.type === 'action' ? detailsSelection.item : null;

    return (
        <DashboardBackground>
            <div className="dashboard-container">
                <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
                    {dataSource === 'mock' && (
                        <span className="px-2 py-1 text-xs font-mono bg-withdrawal/20 text-withdrawal border border-withdrawal/50 rounded">MOCK DATA</span>
                    )}
                    <button onClick={handleRefresh} className="p-2 text-text-tertiary hover:text-text-secondary transition-colors"><RefreshCw className="w-5 h-5" /></button>
                </div>

                {/* Header */}
                <section className="dashboard-section">
                    <div className="flex items-center justify-between mb-2">
                        <Link href="/executive" className="flex items-center gap-1 text-sm text-text-tertiary hover:text-text-secondary transition-colors"><ArrowLeft className="w-4 h-4" /><span>Executive</span></Link>
                        <div className="flex items-center gap-2 text-sm text-text-tertiary"><Calendar className="w-4 h-4" /><span>{data.meta.rangeWeeks} weeks</span></div>
                    </div>
                    <div className="flex flex-col items-center text-center mb-2">
                        <div className="flex items-center gap-3 mb-2"><Building2 className="w-6 h-6 text-meta" /><h1 className="text-3xl font-display font-semibold text-text-primary">{data.meta.teamName} Team</h1></div>
                        <span className="text-sm text-text-tertiary">{data.meta.orgName}</span>
                    </div>
                    <div className="flex justify-center mb-6">
                        <div className="px-3 py-1 rounded-full bg-bg-elevated border border-border flex items-center gap-3">
                            <span className="text-xs text-text-tertiary">Primary load source:</span>
                            <span className={`text-xs font-medium ${loadSourceColor}`}>{loadSourceLabel}</span>
                            <span className="text-xs text-text-tertiary">
                                (Int: {safeToFixed(data.meta.internalImpactScore * 100, 0)}% / Ext: {safeToFixed(data.meta.externalImpactScore * 100, 0)}%)
                            </span>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <SignalCard indexId="strain_index" value={data.indices.strain_index} previousValue={data.previousIndices.strain_index} compact isActive={selectedIndex === 'strain_index'} onClick={() => setSelectedIndex('strain_index')} />
                        <SignalCard indexId="withdrawal_risk" value={data.indices.withdrawal_risk} previousValue={data.previousIndices.withdrawal_risk} compact isActive={selectedIndex === 'withdrawal_risk'} onClick={() => setSelectedIndex('withdrawal_risk')} />
                        <SignalCard indexId="trust_gap" value={data.indices.trust_gap} previousValue={data.previousIndices.trust_gap} compact isActive={selectedIndex === 'trust_gap'} onClick={() => setSelectedIndex('trust_gap')} />
                        <SignalCard indexId="engagement_index" value={data.indices.engagement_index} previousValue={data.previousIndices.engagement_index} compact isActive={selectedIndex === 'engagement_index'} onClick={() => setSelectedIndex('engagement_index')} />
                    </div>

                    <div className="card">
                        <h3 className="section-subtitle mb-4"><span className={INDEX_COLORS[selectedIndex]}>{INDEX_DISPLAY_NAMES[selectedIndex]}</span>{' '}Trend of Team</h3>
                        <TrendChart indexId={selectedIndex} data={data.trends[selectedIndex]} height={180} showUncertainty />
                    </div>
                </section>

                {/* Internal Drivers / External Dependencies */}
                <section className="dashboard-section">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div>
                            <div className="flex items-baseline justify-between mb-4">
                                <h2 className="text-2xl font-display font-semibold text-text-primary">Internal Drivers</h2>
                                <span className="text-sm text-text-secondary font-normal">Contribution</span>
                            </div>
                            <InternalDriversPanel
                                drivers={currentDrivers}
                                loadSource={data.meta.primaryLoadSource}
                                selectedDriver={selectedDriver}
                                onSelectDriver={handleSelectDriver}
                                selectedIndex={selectedIndex}
                            />
                        </div>
                        <div>
                            <div className="flex items-baseline justify-between mb-4">
                                <h2 className="text-2xl font-display font-semibold text-text-primary">External Dependencies</h2>
                                <span className="text-sm text-text-secondary font-normal">Impact</span>
                            </div>
                            <ExternalDependenciesPanel
                                dependencies={data.externalDependencies}
                                selectedDependency={selectedDependency}
                                onSelectDependency={handleSelectDependency}
                                selectedIndex={selectedIndex}
                            />
                        </div>
                    </div>
                </section>

                {/* Actions + Details */}
                <section className="dashboard-section">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div>
                            <div className="flex items-baseline justify-between mb-4">
                                <h2 className="text-2xl font-display font-semibold text-text-primary">Actions</h2>
                                <span className="text-sm text-text-secondary font-normal">Priority</span>
                            </div>
                            <ActionsPanel
                                actions={currentActions}
                                coordinationNotices={data.coordinationNotices}
                                selectedAction={selectedAction}
                                onSelectAction={handleSelectAction}
                                internalDrivers={currentDrivers}
                            />
                        </div>
                        <AnimatePresence mode="wait">
                            {detailsSelection && (
                                <div>
                                    <h2 className="text-2xl font-display font-semibold text-text-primary mb-4">Details</h2>
                                    <UnifiedDetailsPanel
                                        selection={detailsSelection}
                                        drivers={currentDrivers}
                                        selectedIndex={selectedIndex}
                                        teamData={data}
                                        onClose={handleCloseDetails}
                                    />
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </section>

                {/* Weekly Summary */}
                <section className="dashboard-section">
                    <div className="dashboard-section-header"><h2 className="text-2xl font-display font-semibold text-text-primary">Weekly Summary</h2></div>
                    <WeeklySummaryPanel insight={data.weeklyInsight} meta={data.meta} />
                </section>

                {/* Governance */}
                <section className="dashboard-section">
                    <div className="dashboard-section-header"><h2 className="text-2xl font-display font-semibold text-text-primary">Data Governance</h2></div>
                    <GovernancePanel data={data.governance} />
                </section>

                <div className="h-16" />
            </div>
        </DashboardBackground>
    );
}
