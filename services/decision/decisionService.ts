
import { query } from '../../db/client';
import { DecisionSnapshot } from './types';
import { evaluateState, StateInput } from './stateEvaluator';
import { evaluateTrend, HistoryPoint } from './trendEvaluator';
import { attributeDrivers } from './driverAttribution';
import { recommendActions } from './actionEngine';

export class DecisionService {

    async analyzeTeam(orgId: string, teamId: string, weekStart: string | Date): Promise<DecisionSnapshot> {
        // 1. Fetch Aggregates (Current + History)
        const res = await query(`
            SELECT week_start, parameter_means, indices 
            FROM org_aggregates_weekly 
            WHERE org_id = $1 AND team_id = $2
            ORDER BY week_start ASC
        `, [orgId, teamId]);

        const rows = res.rows;
        if (rows.length === 0) throw new Error("No data found for team.");

        // Find Target Week
        const targetDate = new Date(weekStart).toISOString().slice(0, 10);
        const currentFrame = rows.find(r => new Date(r.week_start).toISOString().slice(0, 10) === targetDate) || rows[rows.length - 1];

        // 2. Compute History Points for Trend
        const historyPoints: HistoryPoint[] = rows.map(r => {
            // Reconstruct StateInput to get Health Score per week
            // Note: indices are optional in older data maybe?
            // We need Mapping from Indexes/Params to StateInput
            const input: StateInput = {
                Strain: r.indices?.strain,
                Withdrawal: r.indices?.withdrawal,
                // We don't verify WRP/OUC/TFP here as they are in Profile table, 
                // but we can estimate health from Params if profiles missing, 
                // OR fetch profiles joined. 
                // For robustness, let's use the Params -> Scores logic or just indices.
                // StateEvaluator works best with Profiles.
                // Let's rely on Indices for Trend History as they are always in aggregates?
                // Actually StateEvaluator takes WRP/OUC/TFP.
                // We should join profiles? 
                // Allow pure params-based approximation if profile missing?
            };
            // Simplification: We use Strain as negative proxy for Health if WRP missing.
            // Health = 1 - Strain.
            return {
                date: new Date(r.week_start),
                healthScore: (r.indices?.strain !== undefined) ? (1 - r.indices.strain) : 0.5
            };
        });

        // 3. Evaluate CURRENT State (Detailed)
        // We need explicit WRP/OUC/TFP for the Snapshot state.
        // Let's fetch the Profile for this week.
        const profileRes = await query(`
            SELECT profile_type, activation_score 
            FROM org_profiles_weekly
            WHERE org_id=$1 AND team_id=$2 AND week_start=$3
        `, [orgId, teamId, currentFrame.week_start]);

        const stateInput: StateInput = {
            Strain: currentFrame.indices?.strain,
            Withdrawal: currentFrame.indices?.withdrawal,
            // Add Profile Scores
            WRP: profileRes.rows.find(p => p.profile_type === 'WRP')?.activation_score,
            OUC: profileRes.rows.find(p => p.profile_type === 'OUC')?.activation_score,
            TFP: profileRes.rows.find(p => p.profile_type === 'TFP')?.activation_score,
        };

        const state = evaluateState(stateInput);
        const trend = evaluateTrend(historyPoints);

        // 4. Attribution
        const drivers = attributeDrivers(currentFrame.parameter_means || {});

        // 5. Actions
        const recommendation = recommendActions(state.label, trend.direction, drivers.top_risks);

        return {
            meta: {
                org_id: orgId,
                team_id: teamId,
                week_start: new Date(currentFrame.week_start).toISOString(),
                coverage_weeks: rows.length
            },
            state,
            trend,
            drivers,
            recommendation
        };
    }
}

export const decisionService = new DecisionService();
