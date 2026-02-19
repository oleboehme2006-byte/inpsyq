/**
 * RISK PREDICTOR — Deterministic Predictive Risk Outlook
 * 
 * Predicts team-level risks based on trend velocity and threshold analysis.
 * Purely deterministic — no LLM involved.
 * Output feeds into watchlist items and risk outlook sections.
 */

// ============================================================================
// Types
// ============================================================================

export interface SeriesPoint {
    strain: number;
    withdrawal: number;
    trust: number;
    engagement: number;
}

export interface RiskPrediction {
    /** Team identifier */
    teamName: string;
    /** Type of risk identified */
    riskType: 'attrition' | 'engagement_collapse' | 'trust_erosion';
    /** Estimated probability (0-1) */
    probability: number;
    /** Human-readable time horizon */
    timeHorizon: string;
    /** What data point triggered this prediction */
    triggerCondition: string;
    /** Severity classification */
    severity: 'critical' | 'warning' | 'info';
    /** Trend value string for display (e.g., '+12%') */
    trendValue: string;
}

// ============================================================================
// Thresholds
// ============================================================================

const THRESHOLDS = {
    /** Strain level that triggers attrition risk */
    STRAIN_ATTRITION: 0.70,
    /** Consecutive weeks of rising strain to trigger */
    STRAIN_WEEKS_RISING: 3,
    /** Engagement level that triggers collapse risk */
    ENGAGEMENT_COLLAPSE: 0.50,
    /** Trust gap increase rate per week to trigger erosion */
    TRUST_EROSION_RATE: 0.03,
    /** Minimum series length for trend analysis */
    MIN_SERIES_LENGTH: 3,
} as const;

// ============================================================================
// Core Prediction
// ============================================================================

/**
 * Predict risks for a team based on historical series data.
 * 
 * Risk types:
 * - attrition: Sustained high strain (>70%) for 3+ weeks
 * - engagement_collapse: Engagement drops below 50%
 * - trust_erosion: Trust gap widening while strain is stable/rising
 */
export function predictTeamRisks(
    teamName: string,
    series: SeriesPoint[]
): RiskPrediction[] {
    if (series.length < THRESHOLDS.MIN_SERIES_LENGTH) return [];

    const risks: RiskPrediction[] = [];

    // 1. Attrition Risk — sustained high strain
    const attritionRisk = checkAttritionRisk(teamName, series);
    if (attritionRisk) risks.push(attritionRisk);

    // 2. Engagement Collapse — engagement below threshold
    const collapseRisk = checkEngagementCollapse(teamName, series);
    if (collapseRisk) risks.push(collapseRisk);

    // 3. Trust Erosion — widening trust gap
    const trustRisk = checkTrustErosion(teamName, series);
    if (trustRisk) risks.push(trustRisk);

    return risks;
}

function checkAttritionRisk(
    teamName: string,
    series: SeriesPoint[]
): RiskPrediction | null {
    // Count consecutive weeks where strain increased or stayed above threshold
    const recent = series.slice(-5); // Last 5 data points
    let consecutiveHigh = 0;
    let totalRising = 0;

    for (let i = 1; i < recent.length; i++) {
        if (recent[i].strain >= THRESHOLDS.STRAIN_ATTRITION) {
            consecutiveHigh++;
        }
        if (recent[i].strain > recent[i - 1].strain) {
            totalRising++;
        }
    }

    if (consecutiveHigh < THRESHOLDS.STRAIN_WEEKS_RISING) return null;

    // Calculate velocity
    const first = recent[0].strain;
    const last = recent[recent.length - 1].strain;
    const delta = last - first;
    const deltaPercent = Math.round(delta * 100);
    const sign = deltaPercent >= 0 ? '+' : '';

    // Probability scales with duration and velocity
    const baseProbability = 0.5;
    const durationBonus = Math.min((consecutiveHigh - 2) * 0.1, 0.2);
    const velocityBonus = Math.min(Math.abs(delta) * 0.5, 0.2);
    const probability = Math.min(baseProbability + durationBonus + velocityBonus, 0.95);

    const severity: RiskPrediction['severity'] = probability >= 0.7 ? 'critical' :
        probability >= 0.5 ? 'warning' : 'info';

    return {
        teamName,
        riskType: 'attrition',
        probability,
        timeHorizon: '14 days',
        triggerCondition: `Strain at ${Math.round(last * 100)}% for ${consecutiveHigh} consecutive weeks`,
        severity,
        trendValue: `${sign}${deltaPercent}%`,
    };
}

function checkEngagementCollapse(
    teamName: string,
    series: SeriesPoint[]
): RiskPrediction | null {
    const latest = series[series.length - 1];
    const prior = series[series.length - 2];

    if (latest.engagement >= THRESHOLDS.ENGAGEMENT_COLLAPSE) return null;

    const delta = latest.engagement - prior.engagement;
    const deltaPercent = Math.round(delta * 100);
    const sign = deltaPercent >= 0 ? '+' : '';

    // Check if declining
    const recentTrend = series.slice(-3);
    const isDecreasing = recentTrend.every((p, i) =>
        i === 0 || p.engagement <= recentTrend[i - 1].engagement
    );

    const probability = isDecreasing ? 0.65 : 0.4;
    const severity: RiskPrediction['severity'] = latest.engagement < 0.4 ? 'critical' : 'warning';

    return {
        teamName,
        riskType: 'engagement_collapse',
        probability,
        timeHorizon: isDecreasing ? '7 days' : '21 days',
        triggerCondition: `Engagement at ${Math.round(latest.engagement * 100)}% (below ${Math.round(THRESHOLDS.ENGAGEMENT_COLLAPSE * 100)}% threshold)`,
        severity,
        trendValue: `${sign}${deltaPercent}%`,
    };
}

function checkTrustErosion(
    teamName: string,
    series: SeriesPoint[]
): RiskPrediction | null {
    if (series.length < 4) return null;

    const recent = series.slice(-4);

    // Check if trust gap is widening (trust values increasing = gap widening)
    let trustIncreasing = 0;
    for (let i = 1; i < recent.length; i++) {
        if (recent[i].trust > recent[i - 1].trust + THRESHOLDS.TRUST_EROSION_RATE) {
            trustIncreasing++;
        }
    }

    // Trust erosion: gap widening while strain is not improving
    const strainStableOrRising = recent[recent.length - 1].strain >= recent[0].strain;

    if (trustIncreasing < 2 || !strainStableOrRising) return null;

    const first = recent[0].trust;
    const last = recent[recent.length - 1].trust;
    const delta = last - first;
    const deltaPercent = Math.round(delta * 100);
    const sign = deltaPercent >= 0 ? '+' : '';

    const probability = Math.min(0.3 + trustIncreasing * 0.15, 0.7);
    const severity: RiskPrediction['severity'] = probability >= 0.5 ? 'warning' : 'info';

    return {
        teamName,
        riskType: 'trust_erosion',
        probability,
        timeHorizon: '21 days',
        triggerCondition: `Trust gap widening for ${trustIncreasing} consecutive weeks while strain persists`,
        severity,
        trendValue: `${sign}${deltaPercent}%`,
    };
}
