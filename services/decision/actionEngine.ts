
import { AnalysedDriver, RecommendAction, StateLabel, TrendDirection } from './types';
import { ACTION_TEMPLATES } from './constants';

export function recommendActions(
    stateLabel: StateLabel,
    trend: TrendDirection,
    topDrivers: AnalysedDriver[]
): { primary: RecommendAction, secondary: RecommendAction[] } {

    // Default: Maintain Course
    if (stateLabel === 'HEALTHY' && trend !== 'DETERIORATING') {
        const t = ACTION_TEMPLATES['MAINTAIN_COURSE'];
        return {
            primary: { ...t, type: 'MAINTAIN_COURSE', urgency: 'NORMAL', rationale: 'Metrics are healthy.', target_role: 'TEAM_LEAD' },
            secondary: []
        };
    }

    // Heuristic Rule Engine
    // 1. Find the single highest impact ACTIONABLE driver
    const actionable = topDrivers.find(d => d.is_actionable);

    let primaryId = 'INTERVENTION_ALIGNMENT'; // Fallback
    let urgency = (stateLabel === 'CRITICAL') ? 'IMMEDIATE' : 'HIGH';

    if (actionable) {
        if (actionable.parameter.includes('safety')) primaryId = 'INTERVENTION_SAFETY';
        else if (actionable.parameter.includes('autonomy') || actionable.parameter.includes('control')) primaryId = 'INTERVENTION_AUTONOMY';
        else if (actionable.parameter.includes('trust')) primaryId = 'INTERVENTION_TRUST';
        else if (actionable.parameter.includes('ambiguity') || actionable.parameter.includes('dissonance')) primaryId = 'INTERVENTION_ALIGNMENT';
    } else {
        // If highest impact is NOT actionable (e.g. Load), trigger Load Intervention
        const structural = topDrivers[0];
        if (structural && (structural.parameter.includes('load'))) primaryId = 'INTERVENTION_LOAD';
    }

    const template = ACTION_TEMPLATES[primaryId] || ACTION_TEMPLATES['INTERVENTION_ALIGNMENT'];

    const primary: RecommendAction = {
        type: primaryId,
        title: template.title,
        description: template.description,
        rationale: `Primary negative driver is ${actionable ? actionable.label : 'structural load'}, compounded by ${trend.toLowerCase()} trend.`,
        urgency: urgency as any,
        target_role: 'TEAM_LEAD'
    };

    return {
        primary,
        secondary: []
    };
}
