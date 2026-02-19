/**
 * CROSS-TEAM ANALYSIS — Systemic Driver Identification
 * 
 * Identifies drivers that affect multiple teams simultaneously.
 * This is purely deterministic logic — no LLM involved.
 * Output feeds into the org-level interpretation as context.
 */

import { DriverFamilyId, isValidDriverFamilyId } from '@/lib/semantics/driverRegistry';
import { DRIVER_CONTENT } from '@/lib/content/driverLibrary';

// ============================================================================
// Types
// ============================================================================

export interface TeamAttribution {
    teamId: string;
    teamName: string;
    internalDrivers: {
        driverFamily: string;
        score: number;
        severityLevel: string;
    }[];
}

export interface SystemicDriverCandidate {
    /** The driver family ID */
    driverFamily: DriverFamilyId;
    /** Human-readable label */
    label: string;
    /** Team names affected by this driver */
    affectedTeams: string[];
    /** Mean contribution score across affected teams (0-1) */
    averageScore: number;
    /** Scope classification based on team coverage */
    scope: 'Organization' | 'Department' | 'Localized';
    /** Trend direction based on average severity */
    trend: 'up' | 'down' | 'stable';
    /** Average severity level */
    averageSeverity: string;
}

// ============================================================================
// Core Analysis
// ============================================================================

/**
 * Identify systemic drivers by analyzing attribution data across all teams.
 * 
 * Logic:
 * 1. Collect all InternalDriverAttribution arrays across teams.
 * 2. Group by driverFamily.
 * 3. Scope: ≥50% of teams → 'Organization'; 2+ teams → 'Department'; 1 → 'Localized'.
 * 4. Rank by averageScore × teamCount.
 * 5. Return top 3.
 */
export function identifySystemicDrivers(
    teamAttributions: TeamAttribution[]
): SystemicDriverCandidate[] {
    if (teamAttributions.length === 0) return [];

    const totalTeams = teamAttributions.length;

    // Group drivers by family across teams
    const driverMap = new Map<string, {
        scores: number[];
        severities: string[];
        teamNames: string[];
    }>();

    for (const team of teamAttributions) {
        for (const driver of team.internalDrivers) {
            const existing = driverMap.get(driver.driverFamily);
            if (existing) {
                existing.scores.push(driver.score);
                existing.severities.push(driver.severityLevel);
                existing.teamNames.push(team.teamName);
            } else {
                driverMap.set(driver.driverFamily, {
                    scores: [driver.score],
                    severities: [driver.severityLevel],
                    teamNames: [team.teamName],
                });
            }
        }
    }

    // Convert to candidates
    const candidates: SystemicDriverCandidate[] = [];

    for (const [familyId, data] of driverMap.entries()) {
        if (!isValidDriverFamilyId(familyId)) continue;

        const content = DRIVER_CONTENT[familyId];
        if (!content) continue;

        const teamCount = data.teamNames.length;
        const averageScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;

        // Determine scope
        let scope: SystemicDriverCandidate['scope'] = 'Localized';
        if (teamCount >= totalTeams * 0.5) {
            scope = 'Organization';
        } else if (teamCount >= 2) {
            scope = 'Department';
        }

        // Determine trend from severity distribution
        const severityValues: number[] = data.severities.map(s => {
            if (s === 'C3') return 3;
            if (s === 'C2') return 2;
            if (s === 'C1') return 1;
            return 0;
        });
        const avgSeverity = severityValues.reduce((a: number, b: number) => a + b, 0) / severityValues.length;
        const trend: SystemicDriverCandidate['trend'] = avgSeverity >= 2.5 ? 'up' : avgSeverity >= 1.5 ? 'stable' : 'down';

        candidates.push({
            driverFamily: familyId as DriverFamilyId,
            label: content.label,
            affectedTeams: [...new Set(data.teamNames)], // Deduplicate
            averageScore,
            scope,
            trend,
            averageSeverity: avgSeverity >= 2.5 ? 'C3' : avgSeverity >= 1.5 ? 'C2' : avgSeverity >= 0.5 ? 'C1' : 'C0',
        });
    }

    // Rank by impact: score × teamCount (systemic impact)
    candidates.sort((a, b) => {
        const impactA = a.averageScore * a.affectedTeams.length;
        const impactB = b.averageScore * b.affectedTeams.length;
        return impactB - impactA;
    });

    return candidates.slice(0, 3);
}

/**
 * Build a human-readable context string from systemic drivers
 * for injecting into the org-level LLM prompt.
 */
export function buildSystemicDriverContext(
    drivers: SystemicDriverCandidate[]
): string {
    if (drivers.length === 0) {
        return 'No systemic drivers identified across teams.';
    }

    const lines = drivers.map((d, i) => {
        const teamsStr = d.affectedTeams.join(', ');
        return `${i + 1}. ${d.label} (${d.scope}, affects: ${teamsStr}, avg score: ${Math.round(d.averageScore * 100)}%, severity: ${d.averageSeverity}, trend: ${d.trend})`;
    });

    return `Identified ${drivers.length} systemic driver(s) affecting multiple teams:\n${lines.join('\n')}`;
}
