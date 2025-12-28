/**
 * Weekly Interpretation Service
 * 
 * Generates professional economic/organizational psychology interpretations
 * of team and organizational data. Interpretations are cached weekly.
 * 
 * Tone: Professional, precise, never speculative, grounded in data.
 */

import { getOpenAIClient, LLM_CONFIG } from './client';
import { query } from '@/db/client';
import { safeToFixed } from '@/lib/utils/safeNumber';
import { INDEX_DEFINITIONS, getQualitativeState, getQualitativeAdjective } from '@/lib/dashboard/indexSemantics';

// ==========================================
// Types
// ==========================================

export interface InterpretationContext {
    entityType: 'team' | 'organization';
    entityId: string;
    entityName: string;
    weekStart: string;
    indices: Record<string, number>;
    trends: Record<string, { direction: string; velocity: number }>;
    topRisks: Array<{ label: string; impact: number; explanation: string }>;
    topStrengths: Array<{ label: string; impact: number; explanation: string }>;
    coverage: number;
    teamCount?: number;  // For org-level
}

export interface CachedInterpretation {
    summary: string;
    generatedAt: string;
    mode: 'llm' | 'template' | 'none';
    weekRange: string;
    entityId: string;
    entityType: string;
}

// ==========================================
// System Prompt
// ==========================================

const SYSTEM_PROMPT = `You are a professional organizational psychologist providing a weekly interpretation of psychological measurement data for business leaders.

VOICE AND TONE:
- Professional, calm, precise
- Never speculative or alarmist
- Never explain the math or methodology
- Never invent causes not supported by data
- Never be verbose

STRUCTURE:
- Maximum 3-5 short paragraphs OR 5-7 bullet points
- Lead with the most important insight
- Always tie observations to business relevance
- If data is uncertain, acknowledge it briefly

LANGUAGE:
- Use terms like "indicates", "suggests", "is consistent with"
- Avoid certainty claims like "proves" or "definitely"
- Reference specific metrics when relevant
- Use qualitative descriptors (elevated, stable, declining)

FORMAT:
- Write in plain prose, no markdown headers
- Paragraphs should be 2-3 sentences each
- End with a single actionable observation if warranted`;

// ==========================================
// Template Fallback
// ==========================================

function generateTemplateInterpretation(context: InterpretationContext): string {
    const { indices, trends, topRisks, topStrengths, entityName, entityType } = context;

    const strainValue = indices.strain_index ?? 0;
    const engagementValue = indices.engagement_index ?? 0;
    const strainState = getQualitativeAdjective('strain_index', strainValue);
    const engagementState = getQualitativeAdjective('engagement_index', engagementValue);

    const strainTrend = trends.strain_index?.direction || 'stable';
    const engagementTrend = trends.engagement_index?.direction || 'stable';

    let summary = '';

    if (entityType === 'team') {
        summary = `${entityName} shows ${strainState} strain levels (${safeToFixed(strainValue * 100, 0)}%) and ${engagementState} engagement (${safeToFixed(engagementValue * 100, 0)}%). `;

        if (strainTrend === 'DETERIORATING') {
            summary += `Strain has been trending upward, warranting close monitoring. `;
        } else if (strainTrend === 'IMPROVING') {
            summary += `Strain levels have been improving, suggesting positive momentum. `;
        }

        if (topRisks.length > 0) {
            summary += `\n\nPrimary risk factor: ${topRisks[0].label}. ${topRisks[0].explanation}`;
        }

        if (topStrengths.length > 0) {
            summary += `\n\nPositive driver: ${topStrengths[0].label}. ${topStrengths[0].explanation}`;
        }
    } else {
        summary = `Organization-wide metrics indicate ${strainState} strain (${safeToFixed(strainValue * 100, 0)}%) and ${engagementState} engagement (${safeToFixed(engagementValue * 100, 0)}%). `;

        if (context.teamCount) {
            summary += `Data aggregated across ${context.teamCount} teams. `;
        }
    }

    return summary;
}

// ==========================================
// LLM Generation
// ==========================================

async function generateLLMInterpretation(context: InterpretationContext): Promise<string | null> {
    const openai = getOpenAIClient();
    if (!openai) return null;

    try {
        // Build context for the LLM
        const indexDescriptions = Object.entries(context.indices)
            .map(([id, value]) => {
                const def = INDEX_DEFINITIONS[id];
                if (!def) return null;
                const state = getQualitativeAdjective(id, value);
                return `- ${def.label}: ${safeToFixed(value * 100, 0)}% (${state})`;
            })
            .filter(Boolean)
            .join('\n');

        const trendDescriptions = Object.entries(context.trends)
            .map(([id, trend]) => {
                const def = INDEX_DEFINITIONS[id];
                if (!def) return null;
                const velocityStr = Math.abs(trend.velocity) > 0.03
                    ? `${trend.velocity > 0 ? '+' : ''}${safeToFixed(trend.velocity * 100, 0)}%`
                    : 'stable';
                return `- ${def.label}: ${trend.direction} (${velocityStr})`;
            })
            .filter(Boolean)
            .join('\n');

        const riskDescriptions = context.topRisks.slice(0, 3)
            .map(r => `- ${r.label} (impact: ${safeToFixed(r.impact * 100, 0)}%): ${r.explanation}`)
            .join('\n');

        const strengthDescriptions = context.topStrengths.slice(0, 3)
            .map(s => `- ${s.label} (impact: ${safeToFixed(s.impact * 100, 0)}%): ${s.explanation}`)
            .join('\n');

        const userPrompt = `Generate a weekly interpretation for ${context.entityType === 'team' ? 'team' : 'organization'} "${context.entityName}" for the week of ${context.weekStart}.

CURRENT STATE:
${indexDescriptions}

TRENDS (past 9 weeks):
${trendDescriptions}

TOP RISK FACTORS:
${riskDescriptions || 'None identified'}

TOP POSITIVE DRIVERS:
${strengthDescriptions || 'None identified'}

DATA QUALITY:
Coverage: ${safeToFixed(context.coverage * 100, 0)}%

Provide a concise, professional interpretation.`;

        const completion = await openai.chat.completions.create({
            model: LLM_CONFIG.model,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 500,
        });

        return completion.choices[0]?.message?.content || null;
    } catch (error) {
        console.error('[WeeklyInterpretation] LLM generation failed:', error);
        return null;
    }
}

// ==========================================
// Caching
// ==========================================

async function getCachedInterpretation(
    entityType: string,
    entityId: string,
    weekStart: string
): Promise<CachedInterpretation | null> {
    try {
        const result = await query(`
      SELECT summary, generated_at, mode, week_range
      FROM interpretations
      WHERE entity_type = $1 AND entity_id = $2 AND week_start = $3
      ORDER BY generated_at DESC
      LIMIT 1
    `, [entityType, entityId, weekStart]);

        if (result.rows.length === 0) return null;

        const row = result.rows[0];
        return {
            summary: row.summary,
            generatedAt: row.generated_at,
            mode: row.mode,
            weekRange: row.week_range,
            entityId,
            entityType,
        };
    } catch (error) {
        // Table might not exist, that's okay
        console.warn('[WeeklyInterpretation] Cache lookup failed:', error);
        return null;
    }
}

async function cacheInterpretation(
    entityType: string,
    entityId: string,
    weekStart: string,
    summary: string,
    mode: 'llm' | 'template',
    weekRange: string
): Promise<void> {
    try {
        await query(`
      INSERT INTO interpretations (entity_type, entity_id, week_start, summary, mode, week_range, generated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (entity_type, entity_id, week_start) 
      DO UPDATE SET summary = $4, mode = $5, week_range = $6, generated_at = NOW()
    `, [entityType, entityId, weekStart, summary, mode, weekRange]);
    } catch (error) {
        // Cache failure is non-critical
        console.warn('[WeeklyInterpretation] Cache write failed:', error);
    }
}

// ==========================================
// Main Service
// ==========================================

export class WeeklyInterpretationService {
    /**
     * Get or generate interpretation for a team
     */
    async getTeamInterpretation(
        context: InterpretationContext
    ): Promise<CachedInterpretation> {
        const weekStart = context.weekStart;

        // Check cache first
        const cached = await getCachedInterpretation('team', context.entityId, weekStart);
        if (cached) {
            return cached;
        }

        // Try LLM generation
        let summary = await generateLLMInterpretation(context);
        let mode: 'llm' | 'template' = 'llm';

        if (!summary) {
            // Fallback to template
            summary = generateTemplateInterpretation(context);
            mode = 'template';
        }

        const weekRange = this.formatWeekRange(weekStart);

        // Cache the result
        await cacheInterpretation('team', context.entityId, weekStart, summary, mode, weekRange);

        return {
            summary,
            generatedAt: new Date().toISOString(),
            mode,
            weekRange,
            entityId: context.entityId,
            entityType: 'team',
        };
    }

    /**
     * Get or generate interpretation for an organization
     */
    async getOrgInterpretation(
        context: InterpretationContext
    ): Promise<CachedInterpretation> {
        const weekStart = context.weekStart;

        // Check cache first
        const cached = await getCachedInterpretation('organization', context.entityId, weekStart);
        if (cached) {
            return cached;
        }

        // Try LLM generation
        let summary = await generateLLMInterpretation(context);
        let mode: 'llm' | 'template' = 'llm';

        if (!summary) {
            summary = generateTemplateInterpretation(context);
            mode = 'template';
        }

        const weekRange = this.formatWeekRange(weekStart);

        await cacheInterpretation('organization', context.entityId, weekStart, summary, mode, weekRange);

        return {
            summary,
            generatedAt: new Date().toISOString(),
            mode,
            weekRange,
            entityId: context.entityId,
            entityType: 'organization',
        };
    }

    private formatWeekRange(weekStart: string): string {
        const start = new Date(weekStart);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);

        const format = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${format(start)} - ${format(end)}, ${start.getFullYear()}`;
    }
}

export const weeklyInterpretationService = new WeeklyInterpretationService();
