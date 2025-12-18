
import { EpistemicState, Trend } from './context';

// Threshold Constants
const SIGMA_HIGH_THRESHOLD = 0.35;
const SIGMA_CONFIRM_THRESHOLD = 0.25;
const SIGMA_STABLE_THRESHOLD = 0.15;

const VOLATILITY_HIGH_THRESHOLD = 0.25;
const VOLATILITY_STABLE_THRESHOLD = 0.15;

/**
 * Deterministically calculates the epistemic state of a construct for a user.
 * 
 * Rules:
 * - count = 0 -> ignorant
 * - sigma > 0.35 -> exploratory
 * - sigma <= 0.35 AND volatility > 0.25 -> exploratory
 * - sigma <= 0.25 AND volatility <= 0.25 -> confirmatory
 * - sigma <= 0.15 AND volatility <= 0.15 AND trend stable -> stable
 */
export function calculateEpistemicState(
    sigma: number | null,
    volatility: number,
    trend: Trend,
    count: number
): EpistemicState {
    // 1. Ignorant
    if (count === 0 || sigma === null) {
        return "ignorant";
    }

    // 2. Exploratory (High Uncertainty)
    if (sigma > SIGMA_HIGH_THRESHOLD) {
        return "exploratory";
    }

    // 3. Exploratory (High Volatility despite moderate uncertainty)
    if (sigma <= SIGMA_HIGH_THRESHOLD && volatility > VOLATILITY_HIGH_THRESHOLD) {
        return "exploratory";
    }

    // 4. Confirmatory / Stable Logic
    if (sigma <= SIGMA_CONFIRM_THRESHOLD && volatility <= VOLATILITY_HIGH_THRESHOLD) {
        // Check for Stable (Stricter subset of Confirmatory conditions)
        if (
            sigma <= SIGMA_STABLE_THRESHOLD &&
            volatility <= VOLATILITY_STABLE_THRESHOLD &&
            trend === 'stable'
        ) {
            return "stable";
        }
        return "confirmatory";
    }

    // Fallback for Gap (0.25 < sigma <= 0.35 AND volatility <= 0.25)
    // This region is "Moderate Uncertainty, Low Volatility".
    // It is not uncertain enough to be high-priority exploration, but not certain enough to confirm.
    // We default to exploratory to be safe/thorough.
    return "exploratory";
}
