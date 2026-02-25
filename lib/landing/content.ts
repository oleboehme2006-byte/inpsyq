/**
 * LANDING PAGE CONTENT MAPS — DE / EN
 *
 * All static text for the landing page (Phase 4 v2 — 6-section structure).
 * Consumed by useLanguage() hook — never import directly in server components.
 */

export type Lang = 'EN' | 'DE';

export interface SciencePillar {
    title: string;
    desc: string;
}

export interface TutorialCtaTrack {
    role: string;
    title: string;
    desc: string;
    href: string;
    color: string;
}

export interface ProblemItem {
    title: string;
    desc: string;
}

export interface HowItWorksStep {
    step: string;
    title: string;
    desc: string;
}

export interface LandingContent {
    nav: {
        login: string;
        langToggle: string;
    };
    hero: {
        headline: string;
        sub: string;
        scroll: string;
    };
    problem: {
        badge: string;
        headline: string;
        body: string;
        items: ProblemItem[];
    };
    howItWorks: {
        badge: string;
        headline: string;
        body: string;
        steps: HowItWorksStep[];
    };
    science: {
        badge: string;
        headline: string;
        body: string;
        pillars: SciencePillar[];
    };
    roleDemos: {
        badge: string;
        headline: string;
        sub: string;
        tracks: TutorialCtaTrack[];
    };
    pricing: {
        badge: string;
        headline: string;
        sub: string;
        cta: string;
        note: string;
    };
    footer: {
        rights: string;
        privacy: string;
        terms: string;
        imprint: string;
    };
}

export const content: Record<Lang, LandingContent> = {
    EN: {
        nav: {
            login: 'Log in',
            langToggle: 'DE',
        },
        hero: {
            headline: 'The psychological layer\nyour organisation doesn\'t know it\'s missing.',
            sub: 'The first causal-inference platform that quantifies psychological bandwidth, trust dynamics, and systemic strain — and tells you why they\'re moving, before delivery breaks.',
            scroll: 'Scroll',
        },
        problem: {
            badge: 'Systemic Blind Spot',
            headline: 'You\'re managing the wreckage.\nThe damage was invisible.',
            body: 'Attrition, burnout, and missed delivery timelines are lag metrics. By the time they register on your dashboard, the psychological conditions that caused them were set weeks prior. No existing HR tool was built to see the signal before the failure.',
            items: [
                {
                    title: 'Annual Surveys Miss the Cycle',
                    desc: 'Quarterly or annual instruments capture mood at a single point. Organisational strain accumulates in the weeks between — entirely undetected.',
                },
                {
                    title: 'Sentiment Is Not Causation',
                    desc: 'Feeling-based tools can\'t separate structural dysfunction (role ambiguity, dependency overload) from surface noise. You get correlation without the lever to pull.',
                },
                {
                    title: 'Lag Metrics Report History',
                    desc: 'Attrition data, eNPS scores, and exit interviews describe what already happened. The window for intervention has long closed.',
                },
            ],
        },
        howItWorks: {
            badge: 'The Intelligence Loop',
            headline: 'From pulse to briefing\nin 72 hours.',
            body: 'A 10-question weekly check-in — 2 minutes per employee — feeds a Bayesian inference model that resolves the psychological state of every team. By Monday morning, every stakeholder has a role-calibrated briefing.',
            steps: [
                {
                    step: '01',
                    title: 'Weekly Psychometric Pulse',
                    desc: 'Ten validated items. Two minutes. Delivered every week to every employee. Questions target ten distinct psychological dimensions derived from Occupational Health Psychology.',
                },
                {
                    step: '02',
                    title: 'Bayesian Latent-State Inference',
                    desc: 'Responses feed a Kalman-variant latent state model. Each dimension is inferred with uncertainty quantification — separating signal from noise, tracking drift across weeks.',
                },
                {
                    step: '03',
                    title: 'Causal Attribution Engine',
                    desc: 'The model identifies whether strain is structural (role clarity, dependency load) or relational (trust gaps, withdrawal patterns). Not what — why.',
                },
                {
                    step: '04',
                    title: 'Role-Calibrated Briefings',
                    desc: 'An LLM fine-tuned on organisational psychology converts 48-dimensional signal vectors into board-ready briefings for executives, talking points for teamleads, and private summaries for employees.',
                },
            ],
        },
        science: {
            badge: 'Validated Methodology',
            headline: 'Thirty years of psychometric research.\nOperationalised at scale.',
            body: 'Every index, every signal, every intervention recommendation in inPsyq traces back to peer-reviewed causal models in Occupational Health Psychology and organisational science. Not pattern-matched opinion. Not engagement proxies.',
            pillars: [
                {
                    title: 'Psychometric Precision',
                    desc: 'Ten validated dimensions engineered to reduce construct ambiguity below 5% standard error. Items are drawn from peer-reviewed OHP instruments — not proprietary survey questions. Construct validity is tracked per deployment cohort.',
                },
                {
                    title: 'Bayesian Latent-State Model',
                    desc: 'A Kalman-variant inference engine tracks each psychological dimension as a latent state evolving over time. Uncertainty is quantified per parameter per week — confidence bands are computed, not assumed. k-anonymity thresholds prevent reverse-identification at every aggregation step.',
                },
                {
                    title: 'LLM Narrative Synthesis',
                    desc: 'A fine-tuned language model translates 48-dimensional signal vectors into role-appropriate natural language. Executive briefings, teamlead talking points, and employee summaries are generated from the same causal model — not generalised copy. Updated every Monday.',
                },
            ],
        },
        roleDemos: {
            badge: 'Guided Platform Tours',
            headline: 'See the platform\nthrough your lens.',
            sub: 'Four role-specific guided walkthroughs — each calibrated to the decisions and data you\'ll actually use.',
            tracks: [
                {
                    role: 'EXECUTIVE',
                    title: 'Executive Board',
                    desc: 'Macro-level systemic risk, leading indicators, causal driver attribution, and board-ready narrative briefings.',
                    href: '/tutorial/executive',
                    color: '#0EA5E9',
                },
                {
                    role: 'TEAMLEAD',
                    title: 'Team Operations',
                    desc: 'Team-scoped psychological indices, internal driver analysis, targeted interventions, and weekly 1:1 talking points.',
                    href: '/tutorial/teamlead',
                    color: '#E11D48',
                },
                {
                    role: 'EMPLOYEE',
                    title: 'Employee Pulse',
                    desc: 'The 10-question psychometric instrument — what each dimension measures, how anonymity is enforced, and what happens to your response.',
                    href: '/tutorial/employee',
                    color: '#10B981',
                },
                {
                    role: 'ADMIN',
                    title: 'Platform Administration',
                    desc: 'Org onboarding, roster management, pipeline orchestration, system health monitoring, and RBAC configuration.',
                    href: '/tutorial/admin',
                    color: '#F59E0B',
                },
            ],
        },
        pricing: {
            badge: 'Enterprise Deployment',
            headline: 'Enterprise-grade precision.\nDeployed in days.',
            sub: 'inPsyq is a white-glove deployment. We work directly with your executive team to configure indices, calibrate thresholds, connect your existing data infrastructure, and train your stakeholders.',
            cta: 'Request a Demo',
            note: 'No self-serve signup. Serious enquiries only.',
        },
        footer: {
            rights: '© 2026 inPsyq GmbH. All rights reserved.',
            privacy: 'Privacy',
            terms: 'Terms',
            imprint: 'Imprint',
        },
    },

    DE: {
        nav: {
            login: 'Anmelden',
            langToggle: 'EN',
        },
        hero: {
            headline: 'Die psychologische Schicht,\ndie Ihrer Organisation fehlt.',
            sub: 'Die erste Kausalinferenz-Plattform, die psychologische Kapazität, Vertrauensdynamiken und systemische Belastung quantifiziert — und erklärt, warum sie sich verändern, bevor Lieferungen scheitern.',
            scroll: 'Scrollen',
        },
        problem: {
            badge: 'Systemischer blinder Fleck',
            headline: 'Sie managen die Folgeschäden.\nDer Schaden war unsichtbar.',
            body: 'Fluktuation, Burnout und verpasste Deadlines sind Nachlaufmetriken. Wenn sie auf Ihrem Dashboard erscheinen, wurden die psychologischen Bedingungen, die sie verursacht haben, Wochen zuvor gesetzt. Kein bestehendes HR-Tool wurde entwickelt, um das Signal vor dem Ausfall zu erkennen.',
            items: [
                {
                    title: 'Jahresumfragen verpassen den Zyklus',
                    desc: 'Quartals- oder Jahresinstrumente erfassen die Stimmung zu einem einzigen Zeitpunkt. Organisationale Belastung akkumuliert in den Wochen dazwischen — vollständig unentdeckt.',
                },
                {
                    title: 'Sentiment ist keine Kausalität',
                    desc: 'Gefühlsbasierte Tools können strukturelle Dysfunktion (Rollenambiguität, Abhängigkeitsüberlastung) nicht von Oberflächenrauschen trennen. Sie erhalten Korrelation ohne den Hebel, den Sie ziehen müssen.',
                },
                {
                    title: 'Nachlaufmetriken berichten Geschichte',
                    desc: 'Fluktuationsdaten, eNPS-Werte und Exit-Interviews beschreiben, was bereits passiert ist. Das Interventionsfenster ist längst geschlossen.',
                },
            ],
        },
        howItWorks: {
            badge: 'Der Intelligenz-Loop',
            headline: 'Vom Puls zum Briefing\nin 72 Stunden.',
            body: 'Eine wöchentliche 10-Fragen-Kurzumfrage — 2 Minuten pro Mitarbeiter — speist ein Bayesianisches Inferenzmodell, das den psychologischen Zustand jedes Teams auflöst. Bis Montag früh hat jeder Stakeholder ein rollenspezifisches Briefing.',
            steps: [
                {
                    step: '01',
                    title: 'Wöchentlicher Psychometrischer Puls',
                    desc: 'Zehn validierte Items. Zwei Minuten. Wöchentlich an jeden Mitarbeiter zugestellt. Fragen zielen auf zehn distinkte psychologische Dimensionen der Arbeits- und Gesundheitspsychologie.',
                },
                {
                    step: '02',
                    title: 'Bayesianische Latent-State-Inferenz',
                    desc: 'Antworten speisen ein Kalman-Varianten-Latent-State-Modell. Jede Dimension wird mit Unsicherheitsquantifizierung inferiert — Signal von Rauschen trennend, Drift über Wochen verfolgend.',
                },
                {
                    step: '03',
                    title: 'Kausal-Attributions-Engine',
                    desc: 'Das Modell identifiziert, ob Belastung strukturell (Rollenklarheit, Abhängigkeitslast) oder relational (Vertrauenslücken, Rückzugsmuster) ist. Nicht was — warum.',
                },
                {
                    step: '04',
                    title: 'Rollenspezifische Briefings',
                    desc: 'Ein auf Organisationspsychologie feinabgestimmtes LLM konvertiert 48-dimensionale Signalvektoren in vorstandsreife Briefings für Executives, Gesprächspunkte für Teamleads und private Zusammenfassungen für Mitarbeiter.',
                },
            ],
        },
        science: {
            badge: 'Validierte Methodik',
            headline: 'Dreißig Jahre psychometrische Forschung.\nOperationalisiert im Maßstab.',
            body: 'Jeder Index, jedes Signal, jede Interventionsempfehlung in inPsyq geht auf peer-reviewte Kausalmodelle der Arbeits- und Gesundheitspsychologie und Organisationswissenschaft zurück. Keine musterabgeglichene Meinung. Keine Engagement-Proxies.',
            pillars: [
                {
                    title: 'Psychometrische Präzision',
                    desc: 'Zehn validierte Dimensionen, entwickelt um Konstruktambiguität unter 5% Standardfehler zu halten. Items stammen aus peer-reviewten AHP-Instrumenten — keine proprietären Umfragefragen. Konstruktvalidität wird pro Deploymentkohort verfolgt.',
                },
                {
                    title: 'Bayesianisches Latent-State-Modell',
                    desc: 'Eine Kalman-Varianten-Inferenz-Engine verfolgt jede psychologische Dimension als latenten Zustand, der sich im Laufe der Zeit entwickelt. Unsicherheit wird pro Parameter pro Woche quantifiziert — Konfidenzintervalle werden berechnet, nicht angenommen. k-Anonymitätsschwellen verhindern Rückidentifikation bei jedem Aggregationsschritt.',
                },
                {
                    title: 'LLM-Narrativ-Synthese',
                    desc: 'Ein feinabgestimmtes Sprachmodell übersetzt 48-dimensionale Signalvektoren in rollenangemessene natürliche Sprache. Executive-Briefings, Teamlead-Gesprächspunkte und Mitarbeiterzusammenfassungen werden aus demselben Kausalmodell generiert — keine allgemeine Vorlage. Jeden Montag aktualisiert.',
                },
            ],
        },
        roleDemos: {
            badge: 'Geführte Plattform-Touren',
            headline: 'Die Plattform durch\nIhre Linse erleben.',
            sub: 'Vier rollenspezifische geführte Walkthroughs — jeder kalibriert auf die Entscheidungen und Daten, die Sie tatsächlich verwenden.',
            tracks: [
                {
                    role: 'EXECUTIVE',
                    title: 'Executive Board',
                    desc: 'Systemische Makro-Risiken, Frühwarnindikatoren, Kausalattribution und vorstandsreife Narrative Briefings.',
                    href: '/tutorial/executive',
                    color: '#0EA5E9',
                },
                {
                    role: 'TEAMLEAD',
                    title: 'Team-Operations',
                    desc: 'Teamspezifische psychologische Indizes, interne Treiberanalyse, zielgerichtete Interventionen und wöchentliche 1:1-Gesprächspunkte.',
                    href: '/tutorial/teamlead',
                    color: '#E11D48',
                },
                {
                    role: 'EMPLOYEE',
                    title: 'Mitarbeiter-Puls',
                    desc: 'Das psychometrische 10-Fragen-Instrument — was jede Dimension misst, wie Anonymität durchgesetzt wird und was mit Ihrer Antwort passiert.',
                    href: '/tutorial/employee',
                    color: '#10B981',
                },
                {
                    role: 'ADMIN',
                    title: 'Plattform-Administration',
                    desc: 'Org-Onboarding, Roster-Management, Pipeline-Orchestrierung, System-Health-Monitoring und RBAC-Konfiguration.',
                    href: '/tutorial/admin',
                    color: '#F59E0B',
                },
            ],
        },
        pricing: {
            badge: 'Enterprise-Deployment',
            headline: 'Enterprise-Präzision.\nDeploybar in Tagen.',
            sub: 'inPsyq ist ein White-Glove-Deployment. Wir arbeiten direkt mit Ihrem Executive-Team zusammen, um Indizes zu konfigurieren, Schwellenwerte zu kalibrieren, Ihre bestehende Dateninfrastruktur anzubinden und Ihre Stakeholder zu schulen.',
            cta: 'Demo anfragen',
            note: 'Kein Self-Serve-Signup. Nur ernsthafte Anfragen.',
        },
        footer: {
            rights: '© 2026 inPsyq GmbH. Alle Rechte vorbehalten.',
            privacy: 'Datenschutz',
            terms: 'AGB',
            imprint: 'Impressum',
        },
    },
};
