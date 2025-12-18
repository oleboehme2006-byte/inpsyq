
export type EpistemicState = "ignorant" | "exploratory" | "confirmatory" | "stable";
export type Trend = "up" | "down" | "stable" | "unknown";

export type MeasurementContext = {
    user_id: string;
    construct: string;

    posterior_mean: number | null;
    posterior_sigma: number | null;

    volatility: number;
    observation_count: number;

    last_observed_at: Date | null;
    trend: Trend;

    epistemic_state: EpistemicState;
};
