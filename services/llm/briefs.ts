import { getOpenAIClient, LLM_CONFIG } from './client';
import { DecisionSnapshot } from '@/services/decision/types';
import { BriefOutput } from './types';

export interface BriefInput {
    org_id: string;
    team_id: string;
    week_start: string;
    snapshot: DecisionSnapshot;
    history: any[]; // weekly aggregates
    profiles: any[]; // weekly profiles
    contributions: any; // audit/team-contributions breakdown
}

export class BriefingService {

    async generateTeamleadBrief(input: BriefInput): Promise<BriefOutput> {
        const openai = getOpenAIClient();

        if (!openai) {
            console.log('[Briefing] No API Key. Falling back to deterministic brief.');
            return this.generateDeterministicBrief(input);
        }

        try {
            const systemPrompt = `
            You are an expert executive assistant for an Engineering Team Lead.
            Generate a high-signal "Team Brief" based on the provided JSON data.
            
            Inputs:
            - Decision Snapshot (State, Trend, Recs)
            - Weekly History (Indices)
            - Profiles (WRP/OUC/TFP)
            - Top Drivers
            
            GOAL: summarize the deterministic data into a natural language narrative.
            DO NOT calculate new scores. Use the scores provided in the snapshot.
            
            Output strictly valid JSON matching the schema.
            `;

            const schema = {
                type: "json_schema",
                json_schema: {
                    name: "teamlead_brief",
                    schema: {
                        type: "object",
                        properties: {
                            headline: { type: "string", description: "Punchy 12-word summary of state" },
                            state_summary: { type: "string" },
                            trend_summary: { type: "string" },
                            top_drivers: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        name: { type: "string" },
                                        scope: { type: "string" },
                                        why_it_matters: { type: "string" },
                                        evidence_from_data: { type: "string" }
                                    },
                                    required: ["name", "scope", "why_it_matters", "evidence_from_data"],
                                    additionalProperties: false
                                }
                            },
                            influence_actions: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        scope: { type: "string" },
                                        action_title: { type: "string" },
                                        steps: { type: "array", items: { type: "string" } }
                                    },
                                    required: ["scope", "action_title", "steps"],
                                    additionalProperties: false
                                }
                            },
                            risks_and_watchouts: { type: "array", items: { type: "string" } },
                            confidence_statement: { type: "string" },
                            citations: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        source: { type: "string" },
                                        fields_used: { type: "array", items: { type: "string" } }
                                    },
                                    required: ["source", "fields_used"],
                                    additionalProperties: false
                                }
                            }
                        },
                        required: ["headline", "state_summary", "trend_summary", "top_drivers", "influence_actions", "risks_and_watchouts", "confidence_statement", "citations"],
                        additionalProperties: false
                    },
                    strict: true
                }
            };

            const completion = await openai.chat.completions.create({
                model: LLM_CONFIG.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    {
                        role: 'user', content: JSON.stringify({
                            state: input.snapshot.state,
                            trend: input.snapshot.trend,
                            drivers: input.snapshot.drivers.top_risks.slice(0, 3),
                            recommendation: input.snapshot.recommendation
                        }, null, 2)
                    }
                    // We reduce payload size by picking key parts. 
                    // Full history might be too big if 50 weeks? Input typically 9 weeks.
                ],
                // @ts-ignore
                response_format: schema,
                temperature: 0.2,
            });

            const content = completion.choices[0].message.content;
            if (!content) throw new Error('Empty LLM response');

            return JSON.parse(content) as BriefOutput;

        } catch (error) {
            console.error('[Briefing] LLM Error:', error);
            return this.generateDeterministicBrief(input);
        }
    }

    private generateDeterministicBrief(input: BriefInput): BriefOutput {
        const s = input.snapshot;
        return {
            headline: `${s.state.label} State: Priority is ${s.recommendation.primary.title}`,
            state_summary: `Team state is currently ${s.state.label} with a health score of ${(s.state.score * 100).toFixed(0)}%. ${s.state.explanation}`,
            trend_summary: `The trend is ${s.trend.direction} over the last few weeks.`,
            top_drivers: s.drivers.top_risks.slice(0, 3).map(d => ({
                name: d.label,
                scope: d.influence_scope,
                why_it_matters: d.explanation,
                evidence_from_data: `Impact score: ${(d.impact * 100).toFixed(0)}%`
            })),
            influence_actions: [
                {
                    scope: "TEAM",
                    action_title: s.recommendation.primary.title,
                    steps: [s.recommendation.primary.description, ...s.recommendation.secondary.map(sec => sec.title)]
                }
            ],
            risks_and_watchouts: ["Data-driven fallback used (LLM unavailable)."],
            confidence_statement: "Based on deterministic analysis.",
            citations: [
                { source: "DecisionSnapshot", fields_used: ["state", "trend", "recommendation"] }
            ]
        };
    }
}

export const briefingService = new BriefingService();
