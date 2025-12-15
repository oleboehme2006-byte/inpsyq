
import { DecisionTrend, TrendDirection } from './types';

export interface HistoryPoint {
    date: Date;
    healthScore: number; // Computed by StateEvaluator for that week
}

export function evaluateTrend(history: HistoryPoint[]): DecisionTrend {
    // Need at least 2 points
    if (history.length < 2) {
        return {
            direction: 'STABLE',
            velocity: 0,
            consistency: 0,
            explanation: 'Insufficient history to determine trend.'
        };
    }

    // Sort by date ascending
    const sorted = [...history].sort((a, b) => a.date.getTime() - b.date.getTime());

    // Simple Linear Regression (Slope)
    // x = index, y = score
    const n = sorted.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += sorted[i].healthScore;
        sumXY += i * sorted[i].healthScore;
        sumXX += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    // Determine Direction
    const THRESHOLD = 0.02; // Slope significance
    let direction: TrendDirection = 'STABLE';

    if (slope > THRESHOLD) direction = 'IMPROVING';
    else if (slope < -THRESHOLD) direction = 'DETERIORATING';

    // Velocity is the slope
    const velocity = parseFloat(slope.toFixed(3));

    return {
        direction,
        velocity,
        consistency: 0.8, // Placeholder for R-squared
        explanation: `Trend is ${direction.toLowerCase()} over the last ${n} weeks (Velocity: ${velocity}).`
    };
}
