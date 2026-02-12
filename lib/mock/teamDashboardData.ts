/**
 * Team Dashboard Mock Data
 * 
 * All values are coherent with executiveData.ts and internally consistent.
 * Each team's KPI seeds produce deterministic 12-week graph data.
 * Drivers and actions are psychologically grounded and team-specific.
 */

export interface TeamDriver {
    id: string;
    label: string;
    score: number;
    influence: 'Positive' | 'Neutral' | 'Negative';
    trend: 'up' | 'down' | 'stable';
    details: {
        mechanism: string;
        causality: string;
        effects: string;
        recommendation: string;
    };
}

export interface TeamAction {
    id: string;
    title: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    details: {
        context: string;
        rationale: string;
        effects: string;
        criticality: 'HIGH' | 'AT RISK' | 'LOW';
        recommendation: string;
    };
}

export interface TeamGovernance {
    coverage: number;
    dataQuality: number;
    temporalStability: number;
    signalConfidence: number;
    totalSessions: number;
    lastUpdated: string;
}

export interface TeamDashboardEntry {
    id: string;
    name: string;
    members: number;
    status: 'Critical' | 'At Risk' | 'Healthy';
    kpiSeeds: {
        strainBase: number;
        strainGrowth: number;
        withdrawalBase: number;
        withdrawalGrowth: number;
        trustBase: number;
        trustGrowth: number;
        engagementBase: number;
        engagementGrowth: number;
    };
    drivers: TeamDriver[];
    actions: TeamAction[];
    briefing: string[];
    governance: TeamGovernance;
}

export const teamDashboardData: Record<string, TeamDashboardEntry> = {
    product: {
        id: 'product',
        name: 'Product',
        members: 24,
        status: 'Critical',
        kpiSeeds: {
            strainBase: 45, strainGrowth: 3.2,
            withdrawalBase: 20, withdrawalGrowth: 2.5,
            trustBase: 15, trustGrowth: 1.5,
            engagementBase: 72, engagementGrowth: -2.8,
        },
        drivers: [
            {
                id: 'pd1',
                label: 'Scope Overload',
                score: 78,
                influence: 'Negative',
                trend: 'up',
                details: {
                    mechanism: "Accumulated feature commitments from Q3 planning have exceeded the team's delivery capacity by an estimated 140%, creating a persistent sense of falling behind.",
                    causality: "Excessive scope → cognitive overload → decision fatigue → compressed timelines → spillover pressure on Engineering → cross-functional friction amplification.",
                    effects: "Directly elevating cognitive load and decision fatigue across all product managers. Strain increased by 12% over 4 weeks, with engagement declining proportionally as the team loses agency.",
                    recommendation: "Conduct an immediate scope audit with stakeholders to defer or descope 30-40% of Q4 commitments. Establish a 'feature budget' ceiling per sprint."
                }
            },
            {
                id: 'pd2',
                label: 'Stakeholder Pressure',
                score: 65,
                influence: 'Negative',
                trend: 'up',
                details: {
                    mechanism: "Competing priorities from Sales, Leadership, and Customer Success are creating context-switching overhead averaging 12 priority changes per week.",
                    causality: "Multi-source demands → context switching → autonomy erosion → learned helplessness pattern → reduced initiative and proactive behavior.",
                    effects: "Eroding autonomous decision-making capability. Response latency metrics show a 22% increase, indicating growing paralysis in prioritization. Trust in leadership decisions declining.",
                    recommendation: "Implement a single prioritization authority (CPO shield) to buffer the team from ad-hoc requests. Formalize a weekly intake process."
                }
            },
            {
                id: 'pd3',
                label: 'Role Ambiguity',
                score: 42,
                influence: 'Neutral',
                trend: 'stable',
                details: {
                    mechanism: "Recent org restructuring has blurred boundaries between Product Managers and Product Owners, creating duplicated effort and interpersonal friction.",
                    causality: "Unclear role boundaries → duplicated work → interpersonal friction → meeting overhead increase → reduced collaboration efficiency.",
                    effects: "Contributing to a 15% increase in meeting overhead and visible frustration signals. Not yet cascading into withdrawal but could amplify if scope overload intensifies.",
                    recommendation: "Clarify RACI matrices for all active workstreams and conduct 1:1 role alignment sessions within the next 2 weeks."
                }
            }
        ],
        actions: [
            {
                id: 'pa1',
                title: 'Cognitive Load Reduction',
                severity: 'critical',
                message: "Implement mandatory deep-work blocks to combat decision fatigue",
                details: {
                    context: "Product managers are averaging 6.2 hours of meetings per day with only 1.8 hours of uninterrupted focus time, well below the 4-hour threshold for sustainable cognitive performance.",
                    rationale: "Research in occupational psychology shows that decision quality degrades exponentially when focus time drops below 3 hours/day. Current levels predict a 45% increase in error-prone decisions within 2 weeks.",
                    effects: "Expected to reduce strain by 10-15% within one sprint cycle and improve decision-making quality metrics.",
                    criticality: 'HIGH',
                    recommendation: "Block 9-12 AM as 'no-meeting' time across the team. Cancel all recurring meetings with <3 required attendees. Implement async decision logs."
                }
            },
            {
                id: 'pa2',
                title: 'Autonomy Restoration',
                severity: 'warning',
                message: "Re-establish team decision authority to counter learned helplessness",
                details: {
                    context: "Micro-management signals have increased by 22% as leadership anxiety about Q4 targets rises, paradoxically reducing the team's ability to deliver.",
                    rationale: "Self-Determination Theory predicts that autonomy erosion leads to amotivation. Current patterns match early-stage autonomy withdrawal syndrome.",
                    effects: "Restoring bounded autonomy typically improves engagement by 8-12% and reduces withdrawal risk within 3 weeks.",
                    criticality: 'AT RISK',
                    recommendation: "Define clear 'decision zones' where the team has full authority. Leadership check-ins should shift from directive to coaching-oriented formats."
                }
            },
            {
                id: 'pa3',
                title: 'Psychological Safety Audit',
                severity: 'info',
                message: "Assess and reinforce psychological safety signals within the team",
                details: {
                    context: "Declining trust scores suggest that team members may be withholding concerns or creative ideas, reducing innovation capacity.",
                    rationale: "Edmondson's framework indicates that psychological safety is the strongest predictor of team performance. Current levels are approaching the 'silence threshold'.",
                    effects: "Early intervention can prevent the cascade from silence to disengagement, preserving the team's creative output and collaboration quality.",
                    criticality: 'LOW',
                    recommendation: "Facilitate a structured retrospective focused on 'what can't we say?' — use anonymous input to surface systemic concerns."
                }
            }
        ],
        briefing: [
            'The Product team is experiencing a critical convergence of scope overload and stakeholder pressure that has pushed strain to <span class="text-strain">78%</span>, the highest across the organization. This is not a sudden spike but a trajectory that has been building over 4 weeks, driven by Q4 launch commitments colliding with unresolved technical debt from Q3. The team\'s engagement has dropped to <span class="text-white">42%</span>, now below the critical threshold, with withdrawal signals emerging in 3 of 6 sub-units.',
            '<span class="text-white font-medium">Recommendation:</span> Immediate scope reduction is the highest-leverage intervention. Deferring 30-40% of active commitments will create the cognitive headroom needed to stabilize the team. Simultaneously, restoring decision autonomy through clear "ownership zones" will counteract the learned helplessness pattern that is accelerating disengagement. Without intervention within 14 days, attrition risk rises to <span class="text-strain">70%</span>.'
        ],
        governance: {
            coverage: 92,
            dataQuality: 85,
            temporalStability: 78,
            signalConfidence: 72,
            totalSessions: 12,
            lastUpdated: 'Dec 24, 2025'
        }
    },

    engineering: {
        id: 'engineering',
        name: 'Engineering',
        members: 42,
        status: 'At Risk',
        kpiSeeds: {
            strainBase: 30, strainGrowth: 2.8,
            withdrawalBase: 25, withdrawalGrowth: 2.2,
            trustBase: 22, trustGrowth: 2.0,
            engagementBase: 78, engagementGrowth: -1.5,
        },
        drivers: [
            {
                id: 'ed1',
                label: 'Technical Debt Burden',
                score: 62,
                influence: 'Negative',
                trend: 'up',
                details: {
                    mechanism: "Accumulated shortcuts from rapid delivery cycles have created a maintenance overhead consuming 35% of sprint capacity, reducing time for meaningful feature work.",
                    causality: "Rapid delivery shortcuts → accumulating debt → 35% sprint overhead → reduced feature time → frustration → 'craftsman guilt' → motivation decline.",
                    effects: "Generating frustration across senior engineers and slowing junior onboarding. Velocity has declined while hours increased — a classic diminishing returns pattern.",
                    recommendation: "Allocate 20% of each sprint exclusively to tech debt remediation. Create a visible 'debt burndown' dashboard to restore agency and progress signals."
                }
            },
            {
                id: 'ed2',
                label: 'Upstream Compression',
                score: 55,
                influence: 'Negative',
                trend: 'up',
                details: {
                    mechanism: "Product delays are compressing engineering timelines, creating a persistent 'hurry-up-and-wait' cycle that disrupts flow states and planning reliability.",
                    causality: "Product delays → compressed timelines → disrupted flow states → planning unreliability → learned helplessness → velocity decline despite increased effort.",
                    effects: "Team velocity has declined by 18% despite increased hours. Planning confidence eroded, leading to conservative estimation and reduced ambition in sprint goals.",
                    recommendation: "Institute a 2-day buffer between Product handoff and Engineering sprint commitment. Protect sprint scope from mid-cycle changes."
                }
            },
            {
                id: 'ed3',
                label: 'On-Call Fatigue',
                score: 38,
                influence: 'Neutral',
                trend: 'stable',
                details: {
                    mechanism: "A concentrated on-call rotation among 4 senior engineers (due to knowledge silos) is creating localized burnout and resentment.",
                    causality: "Knowledge silos → concentrated rotation → localized sleep disruption → resentment toward broader team → potential knowledge flight risk.",
                    effects: "Currently contained to a small group but these are critical-path engineers. Their departure would create catastrophic knowledge loss affecting the entire team.",
                    recommendation: "Expand on-call rotation by cross-training 3-4 additional engineers. Implement a 'follow-the-sun' model to reduce after-hours burden."
                }
            }
        ],
        actions: [
            {
                id: 'ea1',
                title: 'Flow State Protection',
                severity: 'critical',
                message: "Shield deep-work time from interruptions and context switches",
                details: {
                    context: "Engineers are experiencing an average of 14 context switches per day, well above the 6-switch threshold where cognitive performance degrades significantly.",
                    rationale: "Csikszentmihalyi's flow research shows that interruptions cost 23 minutes of recovery time each. At 14 switches/day, the team loses ~5.4 hours of productive capacity daily.",
                    effects: "Reducing to <8 switches/day is projected to restore 15-20% of lost velocity and decrease frustration-linked strain signals.",
                    criticality: 'HIGH',
                    recommendation: "Implement 'Maker Schedule' blocks (4-hour uninterrupted windows). Move all sync standup to async formats. Shield the team from Slack DMs during focus blocks."
                }
            },
            {
                id: 'ea2',
                title: 'Mastery & Growth Signaling',
                severity: 'warning',
                message: "Counteract stagnation feelings with visible skill development paths",
                details: {
                    context: "60% of engineers report that they are 'just maintaining' rather than growing, a key predictor of voluntary attrition in technical roles.",
                    rationale: "Deci & Ryan's Self-Determination Theory identifies competence as a core intrinsic motivator. When growth stalls, engagement follows within 4-6 weeks.",
                    effects: "Introducing structured learning time and tech talks can reverse the 'stagnation narrative' and improve engagement scores by 5-8%.",
                    criticality: 'AT RISK',
                    recommendation: "Allocate 10% time for self-directed learning. Launch a monthly 'Tech Talk' series. Create a visible skills matrix to track and celebrate growth."
                }
            },
            {
                id: 'ea3',
                title: 'Peer Recognition Program',
                severity: 'info',
                message: "Strengthen social bonds through structured peer appreciation",
                details: {
                    context: "In a remote-first environment, informal appreciation has declined by 40%, reducing the 'social glue' that buffers teams against stress.",
                    rationale: "Baumeister's belongingness hypothesis predicts that social disconnection amplifies the psychological impact of workload stress by 2-3x.",
                    effects: "Regular peer recognition typically improves team cohesion scores within 2 sprints and creates a protective buffer against strain contagion.",
                    criticality: 'LOW',
                    recommendation: "Implement a weekly 'kudos' channel. Consider a rotating 'engineer of the sprint' recognition. Ensure recognition is specific and behavior-linked, not generic."
                }
            }
        ],
        briefing: [
            'Engineering is operating under sustained upstream pressure from Product delays, compressing development cycles and creating a "hurry-up-and-wait" pattern that has pushed strain to <span class="text-strain">65%</span>. Technical debt now consumes 35% of sprint capacity, generating visible frustration among senior engineers. Withdrawal signals are emerging — PR review participation has dropped by 18% and "camera-off" meeting behavior has increased, both early indicators of disengagement.',
            '<span class="text-white font-medium">Recommendation:</span> The most effective intervention is protecting flow states through mandatory deep-work blocks and reducing context switches from 14 to under 8 per day. Combined with a dedicated 20% tech debt allocation per sprint, this should restore a sense of progress and craftsmanship. The on-call rotation must be expanded to prevent localized burnout among critical-path engineers.'
        ],
        governance: {
            coverage: 88,
            dataQuality: 82,
            temporalStability: 76,
            signalConfidence: 70,
            totalSessions: 18,
            lastUpdated: 'Dec 24, 2025'
        }
    },

    sales: {
        id: 'sales',
        name: 'Sales',
        members: 35,
        status: 'At Risk',
        kpiSeeds: {
            strainBase: 22, strainGrowth: 2.0,
            withdrawalBase: 22, withdrawalGrowth: 2.2,
            trustBase: 25, trustGrowth: 2.2,
            engagementBase: 75, engagementGrowth: -1.2,
        },
        drivers: [
            {
                id: 'sd1',
                label: 'Target Pressure',
                score: 52,
                influence: 'Negative',
                trend: 'up',
                details: {
                    mechanism: "Q4 quota increases of 25% without corresponding pipeline growth are creating a perceived gap between expectations and achievability.",
                    causality: "Unrealistic targets → perceived unattainability → stress shift from 'eustress' to 'distress' → effort reduction → self-fulfilling underperformance cycle.",
                    effects: "Competitive stress has crossed from motivating to paralyzing for 40% of reps. Pipeline activity declining as 'I can't win' narrative takes hold.",
                    recommendation: "Recalibrate quotas based on actual pipeline velocity. Introduce milestone-based interim targets to restore incremental success experiences."
                }
            },
            {
                id: 'sd2',
                label: 'Product Confidence Gap',
                score: 45,
                influence: 'Negative',
                trend: 'up',
                details: {
                    mechanism: "Recent quality issues and delayed features are eroding the team's confidence in pitching the product, creating cognitive dissonance during client calls.",
                    causality: "Product quality issues → rep uncertainty → unconscious signaling during pitches → reduced win rates → ethical fatigue → avoidance behavior.",
                    effects: "Win rates have dropped 8% as reps unconsciously signal uncertainty. 3 senior reps have expressed 'ethical fatigue' about over-promising, with 2 reducing outbound activity.",
                    recommendation: "Facilitate transparent Product-Sales alignment sessions. Provide reps with honest talking points about known limitations alongside the roadmap."
                }
            },
            {
                id: 'sd3',
                label: 'Competitive Anxiety',
                score: 30,
                influence: 'Neutral',
                trend: 'stable',
                details: {
                    mechanism: "Aggressive competitor positioning in 2 key segments is generating threat-based motivation rather than approach-based motivation in the team.",
                    causality: "Competitor gains → threat perception → defensive posturing → negativity bias in pipeline reviews → reduced risk-taking on new opportunities.",
                    effects: "Currently contained to enterprise segment reps but creating a negativity bias that affects broader team morale during pipeline reviews.",
                    recommendation: "Reframe competitive positioning from 'defending against threats' to 'differentiating strengths'. Provide win/loss analysis training."
                }
            }
        ],
        actions: [
            {
                id: 'sa1',
                title: 'Success Experience Design',
                severity: 'warning',
                message: "Restructure targets to restore achievability perception",
                details: {
                    context: "Only 35% of the team hit their monthly target last month, down from 60% three months ago. The 'I can't win' narrative is taking hold.",
                    rationale: "Bandura's self-efficacy theory predicts that repeated failure experiences create a downward spiral of effort reduction. The current target structure is eroding self-belief.",
                    effects: "Interim milestones can reverse the efficacy decline within one sales cycle by providing frequent 'wins' that rebuild confidence.",
                    criticality: 'AT RISK',
                    recommendation: "Introduce weekly micro-targets alongside monthly quotas. Celebrate pipeline progression, not just closed deals. Consider temporary quota relief for the lowest-performing segment."
                }
            },
            {
                id: 'sa2',
                title: 'Ethical Alignment Session',
                severity: 'warning',
                message: "Address cognitive dissonance between product reality and sales messaging",
                details: {
                    context: "3 senior reps have privately flagged discomfort with current positioning, and 2 have reduced outbound activity — a classic avoidance response to ethical tension.",
                    rationale: "Festinger's cognitive dissonance theory predicts that unresolved ethical conflicts lead to either attitude change (cynicism) or behavior change (quiet quitting).",
                    effects: "Transparent alignment typically restores engagement within 2 weeks and actually improves client trust through authentic communication.",
                    criticality: 'AT RISK',
                    recommendation: "Organize a cross-functional session with Product leadership to align on honest messaging. Provide an updated 'what we can and can't promise' guide."
                }
            },
            {
                id: 'sa3',
                title: 'Resilience Coaching',
                severity: 'info',
                message: "Build psychological resilience to handle rejection and competitive pressure",
                details: {
                    context: "Rejection sensitivity has increased as win rates decline, creating a compounding negative cycle where reps avoid difficult prospects.",
                    rationale: "Cognitive-behavioral approaches to rejection desensitization can break this cycle by reframing losses as learning data rather than personal failure.",
                    effects: "Teams trained in resilience coaching typically show a 15% improvement in outbound activity and a 10% improvement in competitive win rates within one quarter.",
                    criticality: 'LOW',
                    recommendation: "Introduce bi-weekly 'loss debrief' sessions focused on learning extraction. Consider external coaching for the 3 most affected reps."
                }
            }
        ],
        briefing: [
            'Sales is navigating a challenging environment where Q4 quota increases have outpaced pipeline growth, pushing strain to <span class="text-strain">45%</span> — moderate but trending upward. The more concerning signal is the emerging "product confidence gap": quality regressions in recent releases are creating cognitive dissonance among senior reps who feel unable to authentically represent the product. Win rates have declined <span class="text-white">8%</span>, and ethical fatigue signals are detectable in 3 key team members.',
            '<span class="text-white font-medium">Recommendation:</span> The priority intervention is restoring achievability perception through restructured interim targets. Simultaneously, a transparent Product-Sales alignment session can address the ethical tension before it metastasizes into cynicism or quiet quitting. The team\'s cultural fundamentals remain healthy — this is an operational risk, not a values crisis.'
        ],
        governance: {
            coverage: 85,
            dataQuality: 80,
            temporalStability: 82,
            signalConfidence: 68,
            totalSessions: 14,
            lastUpdated: 'Dec 24, 2025'
        }
    },

    operations: {
        id: 'operations',
        name: 'Operations',
        members: 18,
        status: 'Healthy',
        kpiSeeds: {
            strainBase: 18, strainGrowth: 1.2,
            withdrawalBase: 5, withdrawalGrowth: 0.5,
            trustBase: 40, trustGrowth: 3.2,
            engagementBase: 82, engagementGrowth: 0.3,
        },
        drivers: [
            {
                id: 'od1',
                label: 'Process Maturity',
                score: 28,
                influence: 'Positive',
                trend: 'down',
                details: {
                    mechanism: "Well-established SOPs and continuous improvement cycles have created a stable, predictable work environment that supports psychological safety.",
                    causality: "Mature processes → role clarity → reduced ambiguity → psychological safety → sustained engagement and low strain.",
                    effects: "Serving as a positive internal benchmark. Team members report high clarity on roles, expectations, and escalation paths. Strain remains the lowest in the organization.",
                    recommendation: "Maintain current processes. Consider formalizing the team's practices as an internal 'best practice' template for other departments."
                }
            },
            {
                id: 'od2',
                label: 'Cross-Team Demand',
                score: 35,
                influence: 'Neutral',
                trend: 'up',
                details: {
                    mechanism: "Increasing reliance from Product and Engineering on Ops support for deployment and infrastructure is creating a slow but steady workload creep.",
                    causality: "Upstream team strain → increased ops dependency → workload creep → capacity erosion → potential stability threat if unaddressed.",
                    effects: "Currently manageable but trajectory suggests the team could shift from 'Healthy' to 'At Risk' within 6-8 weeks if demand growth continues unchecked.",
                    recommendation: "Proactively negotiate boundaries and SLAs with dependent teams. Consider hiring 1-2 additional ops engineers to absorb the growth."
                }
            },
            {
                id: 'od3',
                label: 'Monotony Risk',
                score: 22,
                influence: 'Neutral',
                trend: 'stable',
                details: {
                    mechanism: "High process maturity can paradoxically lead to boredom and under-stimulation for high-performing team members seeking growth challenges.",
                    causality: "Over-routinized work → under-stimulation → growth-seeking behavior → internal mobility interest → potential talent loss if unaddressed.",
                    effects: "Currently low impact — 2 team members have shown interest in lateral moves, an early signal of growth-seeking behavior. Not yet affecting team output.",
                    recommendation: "Introduce rotation programs or innovation sprints to provide cognitive variety without disrupting operational stability."
                }
            }
        ],
        actions: [
            {
                id: 'oa1',
                title: 'Boundary Protection',
                severity: 'warning',
                message: "Formalize SLAs before cross-team demand erodes stability",
                details: {
                    context: "Ad-hoc support requests from Product and Engineering have increased 40% in 6 weeks, but the team has absorbed them without complaint — a 'silent overextension' pattern.",
                    rationale: "Teams with high conscientiousness often mask overload until a tipping point. The absence of complaints is not evidence of sustainability.",
                    effects: "Formalizing boundaries now will preserve the team's healthy status and prevent a sudden transition to 'At Risk' that is harder to reverse.",
                    criticality: 'AT RISK',
                    recommendation: "Define clear SLAs for support requests. Implement a ticketing system for cross-team asks. Track and make visible the actual ops capacity utilization."
                }
            },
            {
                id: 'oa2',
                title: 'Growth Path Design',
                severity: 'info',
                message: "Proactively address monotony risk for high performers",
                details: {
                    context: "Two senior ops engineers have expressed interest in different roles during 1:1s — not a flight risk yet, but a signal that mastery needs are outpacing challenge.",
                    rationale: "Hackman & Oldham's Job Characteristics Model identifies skill variety and task significance as key motivators. Over-routinized roles reduce both.",
                    effects: "Introducing structured challenge opportunities can retain high performers while actually improving the team's capability breadth.",
                    criticality: 'LOW',
                    recommendation: "Offer cross-training rotations with Engineering. Create an 'Ops Innovation Sprint' quarterly where team members can work on improvement initiatives."
                }
            },
            {
                id: 'oa3',
                title: 'Resilience Documentation',
                severity: 'info',
                message: "Document and share the team's success patterns as organizational learning",
                details: {
                    context: "Operations is the most stable team in the organization. Their practices contain transferable insights that could benefit struggling teams.",
                    rationale: "Appreciative Inquiry methodology suggests that studying what works well is more effective for organizational improvement than only diagnosing problems.",
                    effects: "Creates positive visibility for the team (recognition), while spreading stability practices to other units.",
                    criticality: 'LOW',
                    recommendation: "Conduct an 'Appreciative Inquiry' session to extract and document the team's success factors. Share findings in a leadership brief."
                }
            }
        ],
        briefing: [
            'Operations continues to be the organization\'s stability anchor, maintaining healthy strain levels at <span class="text-engagement">35%</span> and engagement at <span class="text-engagement">85%</span>. Process maturity and clear role definitions are key contributors to this resilience. The primary narrative to monitor is the gradual increase in cross-team support demand — a 40% uptick in ad-hoc requests from Product and Engineering is currently being absorbed, but this "silent overextension" pattern could erode stability within 6-8 weeks if unchecked.',
            '<span class="text-white font-medium">Recommendation:</span> Proactive boundary formalization (SLAs) is the key preventive action. The team\'s health should not be mistaken for unlimited capacity. Additionally, investing in growth pathways for high performers will prevent monotony-driven attrition before it materializes as a retention problem.'
        ],
        governance: {
            coverage: 95,
            dataQuality: 91,
            temporalStability: 88,
            signalConfidence: 82,
            totalSessions: 9,
            lastUpdated: 'Dec 24, 2025'
        }
    },

    support: {
        id: 'support',
        name: 'Support',
        members: 28,
        status: 'Healthy',
        kpiSeeds: {
            strainBase: 12, strainGrowth: 1.0,
            withdrawalBase: 8, withdrawalGrowth: 0.6,
            trustBase: 42, trustGrowth: 3.5,
            engagementBase: 85, engagementGrowth: 0.2,
        },
        drivers: [
            {
                id: 'sud1',
                label: 'Upstream Quality Issues',
                score: 40,
                influence: 'Negative',
                trend: 'up',
                details: {
                    mechanism: "Recent product quality regressions are increasing ticket volume by 30%, creating emotional labor strain as agents manage frustrated customers.",
                    causality: "Product regressions → ticket volume surge → increased customer frustration → emotional labor escalation → empathy erosion → service quality decline risk.",
                    effects: "Elevating emotional exhaustion without increasing cognitive strain — a distinct burnout pattern. If sustained, will erode empathy capacity and degrade CSAT within 4-6 weeks.",
                    recommendation: "Establish a direct escalation channel with Engineering for regression-related tickets. Provide agents with honest 'known issues' messaging to reduce emotional friction."
                }
            },
            {
                id: 'sud2',
                label: 'Emotional Labor Load',
                score: 35,
                influence: 'Negative',
                trend: 'up',
                details: {
                    mechanism: "Sustained exposure to customer frustration without adequate support resources creates a slow erosion of empathy capacity — known as 'compassion fatigue'.",
                    causality: "Customer frustration exposure → empathy depletion → professional masking → hidden strain accumulation → eventual breakdown risk.",
                    effects: "CSAT scores remain stable due to professional training, but internal satisfaction metrics are declining. The team is 'masking' strain that will eventually surface.",
                    recommendation: "Introduce structured debrief sessions after high-intensity interactions. Consider rotating difficult ticket queues to distribute emotional load."
                }
            },
            {
                id: 'sud3',
                label: 'Recognition Deficit',
                score: 25,
                influence: 'Neutral',
                trend: 'stable',
                details: {
                    mechanism: "Support teams frequently operate as 'invisible infrastructure' — high performance is expected but rarely celebrated, reducing perceived significance.",
                    causality: "Invisible contributions → low perceived significance → reduced motivation signal → chronic low-grade dissatisfaction.",
                    effects: "Low-level but persistent dissatisfaction with organizational visibility. The team's resilience currently masks this need, but it compounds other stressors over time.",
                    recommendation: "Implement visible recognition in company-wide forums. Share CSAT success stories with leadership. Include support metrics in executive briefings."
                }
            }
        ],
        actions: [
            {
                id: 'sua1',
                title: 'Compassion Fatigue Protocol',
                severity: 'warning',
                message: "Implement structured emotional recovery for frontline agents",
                details: {
                    context: "Agents handling 40+ emotionally charged interactions per week are showing early signs of empathy withdrawal — shorter responses, reduced probing.",
                    rationale: "Maslach's burnout model identifies emotional exhaustion as the first stage. Without intervention, depersonalization follows within 4-6 weeks.",
                    effects: "Structured debriefs and rotation protocols can maintain empathy levels while preventing the cascade to clinical burnout indicators.",
                    criticality: 'AT RISK',
                    recommendation: "Implement 15-min debrief sessions after difficult interactions. Create a 'buddy system' for emotional support. Limit difficult ticket streaks to 3 consecutive."
                }
            },
            {
                id: 'sua2',
                title: 'Upstream Feedback Loop',
                severity: 'info',
                message: "Create direct channels to influence product quality through support data",
                details: {
                    context: "Support has the richest dataset on user pain points but no formal mechanism to influence product priorities, creating a 'shouting into the void' frustration.",
                    rationale: "Perceived influence is a key component of job meaningfulness (Hackman & Oldham). When impact is invisible, motivation declines regardless of workload.",
                    effects: "Establishing a formal feedback loop can improve both product quality and support team engagement by restoring a sense of agency and impact.",
                    criticality: 'LOW',
                    recommendation: "Create a weekly 'Top 5 User Pain Points' report from Support to Product. Include support leadership in sprint planning. Track and celebrate fixes driven by support data."
                }
            },
            {
                id: 'sua3',
                title: 'Visibility & Recognition Initiative',
                severity: 'info',
                message: "Ensure Support contributions are visible at the organizational level",
                details: {
                    context: "The team's high CSAT scores (92%) are not featured in organizational communications, despite being a key competitive differentiator.",
                    rationale: "Organizational justice research shows that equitable recognition across teams is essential for sustained engagement. Invisible success breeds resentment.",
                    effects: "Visible recognition can boost engagement by 5-8% and strengthen the team's identity as a strategic (not just reactive) function.",
                    criticality: 'LOW',
                    recommendation: "Feature Support metrics in the executive briefing. Create a quarterly 'Customer Hero' award. Share CSAT achievements in all-hands meetings."
                }
            }
        ],
        briefing: [
            'Support maintains strong overall health with engagement at <span class="text-engagement">88%</span> and low withdrawal risk. However, the team is absorbing the downstream impact of upstream quality issues — ticket volume has increased 30% due to recent product regressions, elevating emotional labor strain. While CSAT scores remain high at 92%, this is being sustained through professional masking rather than genuine ease. Early signals of "compassion fatigue" are emerging in response patterns.',
            '<span class="text-white font-medium">Recommendation:</span> Implement a structured compassion fatigue protocol before emotional exhaustion compounds. The team\'s resilience is a strategic asset worth protecting proactively. Additionally, establishing a formal upstream feedback loop will not only improve product quality but restore the team\'s sense of agency and impact — critical psychological needs currently under-served.'
        ],
        governance: {
            coverage: 98,
            dataQuality: 93,
            temporalStability: 90,
            signalConfidence: 85,
            totalSessions: 14,
            lastUpdated: 'Dec 24, 2025'
        }
    },

    hr: {
        id: 'hr',
        name: 'HR',
        members: 8,
        status: 'Healthy',
        kpiSeeds: {
            strainBase: 15, strainGrowth: 1.0,
            withdrawalBase: 4, withdrawalGrowth: 0.4,
            trustBase: 45, trustGrowth: 3.5,
            engagementBase: 88, engagementGrowth: 0.2,
        },
        drivers: [
            {
                id: 'hd1',
                label: 'Organizational Tension Exposure',
                score: 38,
                influence: 'Negative',
                trend: 'up',
                details: {
                    mechanism: "As organizational strain rises, HR becomes the primary container for employee concerns, complaints, and emotional processing across all teams.",
                    causality: "Organizational strain → increased employee concerns → HR absorption of emotional load → vicarious stress → helper burnout risk for exposed HRBPs.",
                    effects: "Creating vicarious stress and 'helper burnout' risk, particularly for the 2 HRBPs aligned to Product and Engineering. One has reported sleep disruption.",
                    recommendation: "Provide external supervision or coaching for HRBPs handling high-strain teams. Implement boundaries around availability hours for non-urgent queries."
                }
            },
            {
                id: 'hd2',
                label: 'Policy-People Tension',
                score: 28,
                influence: 'Neutral',
                trend: 'stable',
                details: {
                    mechanism: "Balancing organizational policy enforcement with empathetic people support creates a persistent cognitive-emotional tension unique to HR roles.",
                    causality: "Dual-role expectation → cognitive-emotional conflict → chronic low-grade stressor → potential intensification during crisis-level decisions.",
                    effects: "Low-grade but chronic stressor. Well-managed currently but could intensify significantly if organizational strain triggers policy-critical situations (e.g., PIPs, layoffs).",
                    recommendation: "Ensure HR team has clear decision frameworks for difficult situations. Provide ethics training and peer consultation structures."
                }
            },
            {
                id: 'hd3',
                label: 'Data Overload',
                score: 18,
                influence: 'Positive',
                trend: 'stable',
                details: {
                    mechanism: "The introduction of InPsyq analytics has added a new data stream that, while requiring learning investment, is empowering the team with evidence-based decision-making capability.",
                    causality: "New analytics capability → initial learning curve → growing data literacy → evidence-based interventions → increased strategic influence potential.",
                    effects: "Minor current learning overhead but trending toward a net positive. The data enables more targeted, effective interventions across the organization.",
                    recommendation: "Provide structured training on InPsyq data interpretation. Consider designating a 'People Analytics Lead' within the team."
                }
            }
        ],
        actions: [
            {
                id: 'ha1',
                title: 'Helper Burnout Prevention',
                severity: 'warning',
                message: "Protect HRBPs from vicarious stress through supervision structures",
                details: {
                    context: "The 2 HRBPs supporting Product and Engineering are absorbing disproportionate emotional load from those high-strain teams. One has reported sleep disruption.",
                    rationale: "Figley's compassion fatigue model applies directly to HR professionals who absorb team distress. Without structured support, helper burnout follows within 6-8 weeks.",
                    effects: "External supervision or coaching can reduce vicarious stress by 30-40% while actually improving the quality of support these HRBPs provide.",
                    criticality: 'AT RISK',
                    recommendation: "Arrange external coaching sessions for the 2 HRBPs. Implement a bi-weekly 'peer debrief' within the HR team. Set clear off-hours boundaries."
                }
            },
            {
                id: 'ha2',
                title: 'Analytics Capability Building',
                severity: 'info',
                message: "Develop internal competence to interpret and act on psychological data",
                details: {
                    context: "InPsyq provides rich data but the team currently relies on external interpretation, creating a dependency that slows response times.",
                    rationale: "Building internal analytical capability aligns with autonomy needs and positions HR as a strategic partner rather than a reactive function.",
                    effects: "Improved data literacy will enable faster, more targeted interventions and increase HR's strategic influence within the organization.",
                    criticality: 'LOW',
                    recommendation: "Schedule a training workshop on InPsyq data interpretation. Create simplified dashboards for high-frequency metrics. Designate a People Analytics Lead."
                }
            },
            {
                id: 'ha3',
                title: 'Strategic Positioning Enhancement',
                severity: 'info',
                message: "Evolve HR's role from operational support to strategic organizational health partner",
                details: {
                    context: "HR is well-positioned to lead the organizational response to the current strain crisis but needs explicit mandate and visibility to do so effectively.",
                    rationale: "Ulrich's HR model positions 'Strategic Partner' as the highest-value role. Current crisis conditions create an opportunity for this transition.",
                    effects: "Elevating HR's strategic role can improve organizational response speed and create a sustainable model for proactive health management.",
                    criticality: 'LOW',
                    recommendation: "Present a 'People Health Strategy' to the executive team. Propose HR-led interventions for Product/Engineering based on InPsyq data insights."
                }
            }
        ],
        briefing: [
            'HR is the healthiest team in the organization with engagement at <span class="text-engagement">90%</span> and strain at a manageable <span class="text-engagement">30%</span>. However, the team\'s stability masks an emerging vicarious stress pattern: the 2 HRBPs supporting Product and Engineering are absorbing significant emotional load from those high-strain teams. One HRBP has reported sleep disruption — a clinical-level signal that warrants immediate attention despite the team\'s overall green metrics.',
            '<span class="text-white font-medium">Recommendation:</span> Prioritize helper burnout prevention for the 2 exposed HRBPs through external supervision or coaching. The team\'s overall health creates an opportunity to invest in analytics capability building and strategic positioning, enabling HR to lead the organizational response to the current strain crisis rather than simply absorbing its consequences.'
        ],
        governance: {
            coverage: 100,
            dataQuality: 95,
            temporalStability: 92,
            signalConfidence: 88,
            totalSessions: 4,
            lastUpdated: 'Dec 24, 2025'
        }
    }
};

/** Get all team IDs */
export const allTeamIds = Object.keys(teamDashboardData);

/** Get a single team by ID, with fallback */
export function getTeamData(teamId: string): TeamDashboardEntry | undefined {
    return teamDashboardData[teamId.toLowerCase()];
}
