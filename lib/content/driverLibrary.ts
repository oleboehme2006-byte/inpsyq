import { DriverFamilyId } from '@/lib/semantics/driverRegistry';

export interface DriverContent {
    label: string;
    mechanism: string;
    causality: string;
    effects: string;
    recommendation: string;
}

export const DRIVER_CONTENT: Record<DriverFamilyId, DriverContent> = {
    cognitive_load: {
        label: 'Cognitive Load',
        mechanism: 'Excessive information processing demands are depleting executive function resources, making complex decision-making increasingly difficult.',
        causality: 'High task complexity + Context switching → Focus fragmentation → Decision fatigue → Reduced error detection capacity.',
        effects: 'Directly increases strain and error rates. If sustained, typically leads to "shutdown" behaviors where team members avoid complex tasks or delay decisions.',
        recommendation: 'Audit meeting load and interrupt patterns. Implement "deep work" blocks to restore focus capacity.'
    },
    emotional_load: {
        label: 'Emotional Load',
        mechanism: 'The cumulative burden of regulating emotions and managing interpersonal stress is leading to exhaustion.',
        causality: 'Interpersonal friction + Suppression of authentic reaction → Regulatory depletion → Emotional exhaustion → Burnout risk.',
        effects: 'Primary driver of withdrawal. Team members may appear "professional" but are internally disengaging to protect themselves from further stress.',
        recommendation: 'Create safe spaces for emotional processing (e.g., retrospectives). Review role expectations for hidden emotional labor requirements.'
    },
    role_conflict: {
        label: 'Role Conflict',
        mechanism: 'Incompatible expectations or unclear boundaries are creating persistent cognitive dissonance.',
        causality: 'Competing demands + Unclear priorities → Parsing effort → Anxiety/Frustration → Paralysis or inefficiencies.',
        effects: 'Erodes trust in leadership and reduces engagement. Team members feel "set up to fail" regardless of effort.',
        recommendation: 'Clarify RACI matrices and explicitly de-conflict priorities. Leadership must present a unified front on trade-offs.'
    },
    autonomy_friction: {
        label: 'Autonomy Friction',
        mechanism: 'Barriers to self-directed action are undermining intrinsic motivation and creating a sense of helplessness.',
        causality: 'Micro-management / Bureaucracy → Thwarted agency → Frustration → "Quiet Quitting" / Passive compliance.',
        effects: 'Rapidly degrades engagement. Team shifts from proactive problem-solving to passive order-taking.',
        recommendation: 'Audit approval workflows. Establish clear "freedom within a framework" zones where the team has full decision authority.'
    },
    social_safety: {
        label: 'Social Safety',
        mechanism: 'Perceived risk in speaking up or taking interpersonal risks is stifling communication and innovation.',
        causality: 'Fear of judgment/reprisal → Self-censorship → Information hiding → Pseudo-harmony → Fragility.',
        effects: 'Critical for trust. Low safety effectively blocks learning and error reporting, creating a "good news only" culture.',
        recommendation: 'Leaders must model vulnerability and fallibility. explicitly reward "bad news" reporting and dissent.'
    },
    alignment_clarity: {
        label: 'Alignment Clarity',
        mechanism: 'Ambiguity about goals or how individual work contributes to the bigger picture is reducing meaning.',
        causality: 'Vague goals / Shifting strategy → Disorientation → Loss of meaning → Transactional engagement.',
        effects: 'Reduces "Meaning" component of engagement. Work becomes a chore rather than a contribution.',
        recommendation: 'Connect every sprint goal explicitly to strategic objectives. Use "Commander\'s Intent" to give direction without over-specifying.'
    }
};
