/**
 * Deterministic Dev Fixtures
 * 
 * Stable UUIDs for development testing.
 * Same IDs every run = reproducible tests.
 * 
 * IMPORTANT: These UUIDs must be valid v4/variant format:
 * - Position 13 (3rd group, 1st char): must be 1-5 (version)
 * - Position 17 (4th group, 1st char): must be 8, 9, a, or b (variant)
 * 
 * Format: xxxxxxxx-xxxx-Vxxx-Yxxx-xxxxxxxxxxxx
 *         where V=4 (version 4) and Y=8/9/a/b (variant)
 */

// Organization (valid v4 UUID)
export const DEV_ORG_ID = '11111111-1111-4111-8111-111111111111';
export const DEV_ORG_NAME = 'Dev Organization';

// Teams (valid v4 UUIDs)
export const DEV_TEAMS = [
    { id: '22222222-2222-4222-8222-222222222201', name: 'Engineering' },
    { id: '22222222-2222-4222-8222-222222222202', name: 'Sales' },
] as const;

export const DEV_TEAM_ID = DEV_TEAMS[0].id; // Default team

// Users (10 per team, 20 total) - valid v4 UUIDs
export const DEV_USERS: { id: string; name: string; teamId: string }[] = [];

// Generate stable user IDs with valid v4 format
for (let t = 0; t < DEV_TEAMS.length; t++) {
    for (let u = 0; u < 10; u++) {
        const userNum = t * 10 + u + 1;
        // Format: 33333333-3333-4333-8333-0000000NNNNN
        DEV_USERS.push({
            id: `33333333-3333-4333-8333-0000000${userNum.toString().padStart(5, '0')}`,
            name: `User ${userNum}`,
            teamId: DEV_TEAMS[t].id,
        });
    }
}

// Get users for a specific team
export function getUsersForTeam(teamId: string): typeof DEV_USERS {
    return DEV_USERS.filter(u => u.teamId === teamId);
}

// Get first user ID (for quick tests)
export const DEV_USER_ID = DEV_USERS[0].id;

// Stable hash function for deterministic answer generation
export function stableHash(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

// Generate deterministic rating (1-7 scale)
export function deterministicRating(userId: string, weekIndex: number, interactionId: string): number {
    const hash = stableHash(`${userId}-${weekIndex}-${interactionId}-rating`);
    return (hash % 7) + 1; // 1-7
}

// Generate deterministic choice index
export function deterministicChoice(userId: string, weekIndex: number, interactionId: string, numChoices: number): number {
    const hash = stableHash(`${userId}-${weekIndex}-${interactionId}-choice`);
    return hash % numChoices;
}

// Generate deterministic text response
const TEXT_TEMPLATES = [
    'Things are going well this week.',
    'There have been some challenges, but we are managing.',
    'Communication with the team has improved.',
    'Workload is manageable, though deadlines are tight.',
    'I appreciate the support from leadership.',
    'Some uncertainty about project priorities.',
    'Collaboration has been productive.',
    'Looking forward to the upcoming sprint.',
    'Resources seem adequate for current goals.',
    'Team morale is steady.',
];

export function deterministicText(userId: string, weekIndex: number, interactionId: string): string {
    const hash = stableHash(`${userId}-${weekIndex}-${interactionId}-text`);
    return TEXT_TEMPLATES[hash % TEXT_TEMPLATES.length];
}

// Export all stable IDs as a summary object
export const DEV_IDS = {
    orgId: DEV_ORG_ID,
    teamId: DEV_TEAM_ID,
    userId: DEV_USER_ID,
    teams: DEV_TEAMS,
    users: DEV_USERS,
};
