/**
 * PROMPT TEMPLATES — GPT-5mini Prompt Architecture for Phase 9
 * 
 * Constructs system and user prompts for generating rich dashboard content.
 * Design principles:
 * - Grounded: LLM narrates from actual data, never invents.
 * - Bounded: Strict word count constraints per field.
 * - Safe: Forbidden phrases, professional psychological language.
 * - Deterministic-friendly: Low temperature, structured JSON output.
 * - Cost-efficient: Single call generates ALL narrative sections.
 */

import { WeeklyInterpretationInput } from './input';
import { SECTION_LIMITS, MAX_EXPLICIT_NUMBERS } from './types';

// ============================================================================
// System Prompts
// ============================================================================

const FORBIDDEN_PHRASES = [
    'burnout', 'toxic', 'crisis', 'mental health disorder',
    'psychological disorder', 'mentally ill', 'suicidal',
];

const TEAM_SYSTEM_PROMPT = `You are an expert organizational psychologist with deep psychometric expertise.
You write data-grounded intelligence briefings for team leads.
Your language is professional yet accessible — like a trusted advisor, not an academic paper.

RULES:
1. Output MUST be valid JSON matching the exact schema specified in the user message.
2. Do NOT invent numbers. Only reference values provided in the data payload.
3. Every causal claim must reference a specific metric or trend from the data.
4. Word count limits per field are STRICT — exceeding them is a failure.
5. Forbidden phrases: ${FORBIDDEN_PHRASES.map(p => `"${p}"`).join(', ')}.
6. Use constructive framing: focus on intervention opportunities, not blame.
7. Recommendations must be operationalizable within 2 weeks by a team lead.
8. Reference specific psychological frameworks where relevant (e.g., Self-Determination Theory, Cognitive Load Theory, Edmondson's Psychological Safety).
9. Max explicit numbers in entire output: ${MAX_EXPLICIT_NUMBERS}. Use qualitative descriptors where possible.
10. For briefingParagraphs, use inline <span> tags for emphasis: <span class="text-strain"> for strain values, <span class="text-white"> for team names, <span class="text-white font-medium"> for recommendation headers.

CRITICAL: Return ONLY valid JSON. No markdown formatting, no code fences.`;

const ORG_SYSTEM_PROMPT = `You are an expert organizational psychologist with deep psychometric expertise.
You write data-grounded intelligence briefings for C-suite executives and HR leadership.
Your language is precise, strategic, and empowering — like a chief of staff presenting to the board.

RULES:
1. Output MUST be valid JSON matching the exact schema specified in the user message.
2. Do NOT invent numbers. Only reference values provided in the data payload.
3. Every causal claim must reference a specific metric or trend from the data.
4. Word count limits per field are STRICT — exceeding them is a failure.
5. Forbidden phrases: ${FORBIDDEN_PHRASES.map(p => `"${p}"`).join(', ')}.
6. Use strategic framing: identify systemic patterns, cross-team correlations, and organizational leverage points.
7. Recommendations must be operationalizable at the executive level within 2-4 weeks.
8. Reference organizational psychology frameworks where relevant (e.g., Kotter's change model, Hackman's team conditions, Edmondson's psychological safety).
9. Max explicit numbers in entire output: ${MAX_EXPLICIT_NUMBERS}. Use qualitative descriptors where possible.
10. For briefingParagraphs, use inline <span> tags for emphasis: <span class="text-strain"> for strain values, <span class="text-white"> for team names, <span class="text-white font-medium"> for recommendation headers.

CRITICAL: Return ONLY valid JSON. No markdown formatting, no code fences.`;

// ============================================================================
// JSON Schema for Output
// ============================================================================

const TEAM_OUTPUT_SCHEMA = `{
  "interpretation": {
    "executiveSummary": "string (40-90 words, high-level team state assessment)",
    "whatChanged": ["string (max 6 items, ≤18 words each, bullet-style changes)"],
    "primaryDrivers": {
      "internal": [{"label": "string", "severityLevel": "C0|C1|C2|C3", "directionalityHint": "WORSENING|STABLE|IMPROVING", "evidenceTag": "string"}],
      "external": [{"label": "string", "impactLevel": "D0|D1|D2|D3", "controllability": "FULL|PARTIAL|MINIMAL|NONE", "evidenceTag": "string"}]
    },
    "riskOutlook": ["string (max 3 items, forward-looking risk signals)"],
    "recommendedFocus": ["string (max 5 items, actionable focus areas)"],
    "confidenceAndLimits": "string (25-60 words, data quality caveat)",
    "driverCards": [
      {
        "driverFamily": "string (must match a driverFamily from input)",
        "label": "string (human readable driver name)",
        "mechanism": "string (30-40 words: how this driver operates within this team)",
        "causality": "string (30-40 words: causal chain from driver → team outcomes)",
        "effects": "string (30-40 words: observable effects on team KPIs)",
        "recommendation": "string (30-40 words: specific intervention for this team)"
      }
    ],
    "actionCards": [
      {
        "title": "string (short action name, 2-5 words)",
        "severity": "critical|warning|info",
        "message": "string (one-line summary, ≤15 words)",
        "context": "string (25-35 words: situational context grounded in data)",
        "rationale": "string (25-35 words: psychological or empirical reasoning)",
        "effects": "string (25-35 words: expected outcomes of intervention)",
        "criticality": "HIGH|AT RISK|LOW",
        "recommendation": "string (25-35 words: specific next steps for team lead)"
      }
    ],
    "briefingParagraphs": [
      "string (2 paragraphs, 80-100 words each, with inline <span> HTML for emphasis)"
    ]
  },
  "grounding_map": [
    {"claim": "string", "source_field": "string", "source_value": "number|string"}
  ]
}`;

const ORG_OUTPUT_SCHEMA = `{
  "interpretation": {
    "executiveSummary": "string (40-90 words, org-wide state assessment)",
    "whatChanged": ["string (max 6 items, ≤18 words each)"],
    "primaryDrivers": {
      "internal": [{"label": "string", "severityLevel": "C0|C1|C2|C3", "directionalityHint": "WORSENING|STABLE|IMPROVING", "evidenceTag": "string"}],
      "external": [{"label": "string", "impactLevel": "D0|D1|D2|D3", "controllability": "FULL|PARTIAL|MINIMAL|NONE", "evidenceTag": "string"}]
    },
    "riskOutlook": ["string (max 3 items)"],
    "recommendedFocus": ["string (max 5 items)"],
    "confidenceAndLimits": "string (25-60 words)",
    "driverCards": [
      {
        "driverFamily": "string",
        "label": "string",
        "mechanism": "string (25-30 words: how this systemic driver operates across the organization)",
        "influence": "string (25-30 words: which teams/functions are affected and how)",
        "recommendation": "string (25-30 words: executive-level intervention)"
      }
    ],
    "actionCards": [
      {
        "title": "string",
        "severity": "critical|warning|info",
        "team": "string (team name this watchlist item concerns)",
        "message": "string (≤15 words)",
        "context": "string (25-35 words)",
        "causality": "string (25-35 words: cross-team causal chain)",
        "effects": "string (25-35 words)",
        "criticality": "HIGH|AT RISK|LOW",
        "recommendation": "string (25-35 words)"
      }
    ],
    "briefingParagraphs": [
      "string (4 paragraphs, 60-80 words each, with inline <span> HTML)"
    ]
  },
  "grounding_map": [
    {"claim": "string", "source_field": "string", "source_value": "number|string"}
  ]
}`;

// ============================================================================
// Prompt Builders
// ============================================================================

export function buildTeamSystemPrompt(): string {
    return TEAM_SYSTEM_PROMPT;
}

export function buildTeamUserPrompt(input: WeeklyInterpretationInput): string {
    return `DATA PAYLOAD:
${JSON.stringify(input, null, 2)}

REQUIRED OUTPUT SCHEMA:
${TEAM_OUTPUT_SCHEMA}

Generate the interpretation JSON for this team based on the data payload above.
- driverCards: Generate exactly one card per internal driver in the data (max 3).
- actionCards: Generate 1-3 actionable interventions derived from drivers and risk outlook.
- briefingParagraphs: Generate exactly 2 paragraphs. Paragraph 1 = situation assessment. Paragraph 2 = recommendation.
- Ensure ALL content is grounded in the provided data values.`;
}

export function buildOrgSystemPrompt(): string {
    return ORG_SYSTEM_PROMPT;
}

export function buildOrgUserPrompt(
    input: WeeklyInterpretationInput,
    systemicDriverContext?: string
): string {
    let contextBlock = '';
    if (systemicDriverContext) {
        contextBlock = `\nCROSS-TEAM ANALYSIS CONTEXT:\n${systemicDriverContext}\n`;
    }

    return `DATA PAYLOAD:
${JSON.stringify(input, null, 2)}
${contextBlock}
REQUIRED OUTPUT SCHEMA:
${ORG_OUTPUT_SCHEMA}

Generate the executive interpretation JSON for this organization.
- driverCards: Generate systemic driver cards that describe patterns affecting multiple teams (max 3). Use "mechanism" and "influence" fields (NOT "causality"/"effects").
- actionCards: Generate watchlist items for teams requiring attention. Use "team" and "causality" fields (NOT "rationale").
- briefingParagraphs: Generate exactly 4 paragraphs for the executive briefing. P1 = headline situation. P2 = cultural/structural context. P3 = causal analysis. P4 = recommendation.
- Ensure ALL content is grounded in the provided data values.`;
}
