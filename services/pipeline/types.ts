/**
 * PIPELINE TYPES — Input/Output Types for Pipeline Runner
 */

import { WeeklyTeamIndexSeries, TeamTemporalState, DataQualityWeekly } from '@/lib/aggregation/types';
import { AttributionResult } from '@/lib/attribution/types';

// ============================================================================
// Core Types
// ============================================================================

export interface WeeklyProductRow {
    orgId: string;
    teamId: string;
    weekStart: Date;
    computeVersion: string;
    inputHash: string;
    teamState: TeamTemporalState;
    indices: Record<string, number>;
    quality: DataQualityWeekly;
    series: SeriesSnapshot;
    attribution: AttributionResult[];
    updatedAt: Date;
}

export interface SeriesSnapshot {
    weeks: number;
    points: SeriesPointSnapshot[];
}

export interface SeriesPointSnapshot {
    weekStart: string;
    strain: number;
    withdrawalRisk: number;
    trustGap: number;
    engagement: number;
}

// ============================================================================
// Input Types for Hashing
// ============================================================================

export interface CanonicalInputData {
    orgId: string;
    teamId: string;
    weekStartISO: string;
    userMeasurements: UserMeasurementSnapshot[];
}

export interface UserMeasurementSnapshot {
    userId: string;
    parameterMeans: Record<string, number>;
    parameterVariance: Record<string, number>;
    sessionCount: number;
}

// ============================================================================
// Result Types
// ============================================================================

export interface RunWeeklyRollupResult {
    upserted: boolean;
    inputHash: string;
    skipped: boolean;
    reason?: string;
}

export interface BackfillResult {
    weeksProcessed: number;
    upserted: number;
    skipped: number;
}

export interface RebuildOrgResult {
    teamsProcessed: number;
    totalWeeks: number;
    totalUpserted: number;
}
