/**
 * LANDING PAGE CONTENT MAPS — DE / EN
 *
 * All static text for the landing page.
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

export interface LandingContent {
    nav: {
        login: string;
        tour: string;
    };
    hero: {
        headline: string;
        sub: string;
        scroll: string;
    };
    comparison: {
        headline: string;
        subline: string;
        statusQuo: {
            title: string;
            items: Array<{ title: string; desc: string }>;
        };
        inpsyq: {
            title: string;
            items: Array<{ title: string; desc: string }>;
        };
    };
    pain: {
        badge: string;
        headline: string;
        body: string;
    };
    mechanism: {
        headline: string;
        body: string;
        cta: string;
    };
    science: {
        badge: string;
        headline: string;
        body: string;
        pillars: SciencePillar[];
    };
    gateway: {
        badge: string;
        headline: string;
        body: string;
        demoLabel: string;
        demoSub: string;
        tutorialLabel: string;
        tutorialSub: string;
    };
    tutorialCta: {
        headline: string;
        sub: string;
        tracks: TutorialCtaTrack[];
    };
    pricing: {
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
            tour: 'Tour',
        },
        hero: {
            headline: 'Measure the Unmeasurable.',
            sub: 'The first AI-native diagnostic instrument that quantifies the psychological bandwidth driving your delivery timelines.',
            scroll: 'Scroll',
        },
        comparison: {
            headline: 'The precision of a psychologist.\nThe scale of a machine.',
            subline: 'TRADITIONAL HR VS. INPSYQ SYSTEM',
            statusQuo: {
                title: 'Status Quo',
                items: [
                    { title: 'Episodic Observation', desc: 'Quarterly or annual surveys.' },
                    { title: 'Subjective Sentiment', desc: 'Feelings, untethered from context.' },
                    { title: 'Trailing Lag-Metrics', desc: 'Measuring attrition after it happens.' },
                ],
            },
            inpsyq: {
                title: 'Expert Intelligence',
                items: [
                    { title: 'Continuous Telemetry', desc: 'Weekly, low-friction psychometric pulses.' },
                    { title: 'Validated Causal Indices', desc: 'Root-cause identification via behavioral science.' },
                    { title: 'Leading Risk Indicators', desc: 'Detecting trust gaps before delivery breaks.' },
                ],
            },
        },
        pain: {
            badge: 'Systemic Strain Detected',
            headline: 'You are managing the symptoms.\nThe cause is invisible.',
            body: 'Burnout, attrition, and missed deadlines are lag metrics. By the time they hit your dashboard, the damage is done. You are flying blind on the most critical driver of your organization: psychological safety and bandwidth.',
        },
        mechanism: {
            headline: 'Continuous intelligence.\nZero friction.',
            body: 'A 10-question pulse check. 2 minutes a week. We don\'t track keystrokes—we measure trust, systemic friction, and cognitive bandwidth through validated psychometric instruments.',
            cta: 'Enter Employee Demo',
        },
        science: {
            badge: 'Validated Methodology',
            headline: 'Organizational science,\noperationalized at scale.',
            body: 'inPsyq is built on three decades of psychometric research. Every index, every signal, every intervention recommendation traces back to peer-reviewed causal models — not pattern-matched opinion.',
            pillars: [
                {
                    title: 'Psychometric Precision',
                    desc: 'Ten validated dimensions derived from Occupational Health Psychology. Each question is engineered to reduce construct ambiguity below 5% standard error.',
                },
                {
                    title: 'Causal Attribution Engine',
                    desc: 'Bayesian latent-state inference separates structural drivers (role clarity, dependency load) from noise. We tell you why — not just what.',
                },
                {
                    title: 'LLM Narrative Synthesis',
                    desc: 'A fine-tuned language model converts 48-dimensional signal vectors into board-ready briefings and targeted team interventions. Updated every Monday morning.',
                },
            ],
        },
        gateway: {
            badge: 'Signal Space Aligned',
            headline: 'Data without interpretation\nis just liability.',
            body: 'inPsyq\'s AI aggregates weekly responses, identifies causal systemic drivers, and generates actionable narrative briefings. Instantly.',
            demoLabel: 'Exploratory Demonstrations',
            demoSub: 'Access live interactive sandbox data.',
            tutorialLabel: 'Guided Platform Tutorial',
            tutorialSub: 'Learn to interpret the psychological data.',
        },
        tutorialCta: {
            headline: 'See the platform through your lens.',
            sub: 'Four role-specific guided walkthroughs — each calibrated to the decisions and data you\'ll actually use.',
            tracks: [
                {
                    role: 'EXECUTIVE',
                    title: 'Executive Board',
                    desc: 'Macro-level systemic risk, leading indicators, and board-ready narrative briefings.',
                    href: '/tutorial/executive',
                    color: '#0EA5E9',
                },
                {
                    role: 'TEAMLEAD',
                    title: 'Team Operations',
                    desc: 'Causal attribution, targeted interventions, and weekly talking points for 1:1s.',
                    href: '/tutorial/teamlead',
                    color: '#E11D48',
                },
                {
                    role: 'EMPLOYEE',
                    title: 'Employee Pulse',
                    desc: 'The 10-question psychometric instrument — what each question measures and why it matters.',
                    href: '/tutorial/employee',
                    color: '#10B981',
                },
                {
                    role: 'ADMIN',
                    title: 'Platform Administration',
                    desc: 'Org onboarding, pipeline management, system health monitoring, and RBAC configuration.',
                    href: '/tutorial/admin',
                    color: '#F59E0B',
                },
            ],
        },
        pricing: {
            headline: 'Enterprise-grade precision,\ndeployed in days.',
            sub: 'inPsyq is a white-glove deployment. We work directly with your executive team to configure indices, calibrate thresholds, and connect your existing data infrastructure.',
            cta: 'Request a Demo',
            note: 'No self-serve signup. Serious inquiries only.',
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
            tour: 'Tour',
        },
        hero: {
            headline: 'Das Unsichtbare messbar machen.',
            sub: 'Das erste KI-native Diagnoseinstrument, das die psychologische Kapazität quantifiziert, die Ihre Lieferzeiten bestimmt.',
            scroll: 'Scrollen',
        },
        comparison: {
            headline: 'Die Präzision eines Psychologen.\nDie Skalierbarkeit einer Maschine.',
            subline: 'TRADITIONELLES HR VS. INPSYQ-SYSTEM',
            statusQuo: {
                title: 'Status Quo',
                items: [
                    { title: 'Episodische Beobachtung', desc: 'Quartals- oder Jahresumfragen.' },
                    { title: 'Subjektive Stimmung', desc: 'Gefühle, losgelöst vom Kontext.' },
                    { title: 'Nachlaufende Metriken', desc: 'Fluktuation wird gemessen, nachdem sie passiert ist.' },
                ],
            },
            inpsyq: {
                title: 'Expert-Intelligenz',
                items: [
                    { title: 'Kontinuierliche Telemetrie', desc: 'Wöchentliche, reibungsarme psychometrische Pulse.' },
                    { title: 'Validierte Kausalindizes', desc: 'Ursachenidentifikation durch Verhaltenswissenschaft.' },
                    { title: 'Frühwarnindikatoren', desc: 'Vertrauenslücken erkennen, bevor Lieferungen scheitern.' },
                ],
            },
        },
        pain: {
            badge: 'Systemische Belastung erkannt',
            headline: 'Sie behandeln die Symptome.\nDie Ursache bleibt unsichtbar.',
            body: 'Burnout, Fluktuation und verpasste Deadlines sind Nachlaufmetriken. Wenn sie auf Ihrem Dashboard erscheinen, ist der Schaden bereits angerichtet. Sie navigieren blind bei dem kritischsten Treiber Ihrer Organisation: psychologische Sicherheit und Kapazität.',
        },
        mechanism: {
            headline: 'Kontinuierliche Intelligenz.\nNull Reibung.',
            body: 'Eine 10-Fragen-Kurzumfrage. 2 Minuten pro Woche. Wir tracken keine Tastenanschläge — wir messen Vertrauen, systemische Reibung und kognitive Kapazität durch validierte psychometrische Instrumente.',
            cta: 'Employee-Demo öffnen',
        },
        science: {
            badge: 'Validierte Methodik',
            headline: 'Organisationswissenschaft,\noperationalisiert im Maßstab.',
            body: 'inPsyq basiert auf drei Jahrzehnten psychometrischer Forschung. Jeder Index, jedes Signal, jede Interventionsempfehlung geht auf peer-reviewed Kausalmodelle zurück — nicht auf musterabgleiche Meinungen.',
            pillars: [
                {
                    title: 'Psychometrische Präzision',
                    desc: 'Zehn validierte Dimensionen aus der Arbeits- und Gesundheitspsychologie. Jede Frage ist so konzipiert, dass die Konstruktambiguität unter 5% Standardfehler bleibt.',
                },
                {
                    title: 'Kausal-Attributions-Engine',
                    desc: 'Bayesianische Latent-State-Inferenz trennt strukturelle Treiber (Rollenklarheit, Abhängigkeitslast) von Rauschen. Wir zeigen Ihnen das Warum — nicht nur das Was.',
                },
                {
                    title: 'LLM-Narrativ-Synthese',
                    desc: 'Ein fein abgestimmtes Sprachmodell wandelt 48-dimensionale Signalvektoren in Vorstandsbriefings und zielgerichtete Teaminterventionen um. Jeden Montag aktualisiert.',
                },
            ],
        },
        gateway: {
            badge: 'Signalraum ausgerichtet',
            headline: 'Daten ohne Interpretation\nsind nur Haftung.',
            body: 'inPsyqs KI aggregiert wöchentliche Antworten, identifiziert kausale systemische Treiber und generiert handlungsrelevante Narrativ-Briefings. Sofort.',
            demoLabel: 'Explorative Demonstrationen',
            demoSub: 'Live-Sandbox-Daten interaktiv erkunden.',
            tutorialLabel: 'Geführtes Plattform-Tutorial',
            tutorialSub: 'Die psychologischen Daten interpretieren lernen.',
        },
        tutorialCta: {
            headline: 'Die Plattform durch Ihre Linse erleben.',
            sub: 'Vier rollenspezifische geführte Walkthroughs — jeder kalibriert auf die Entscheidungen und Daten, die Sie tatsächlich verwenden.',
            tracks: [
                {
                    role: 'EXECUTIVE',
                    title: 'Executive Board',
                    desc: 'Systemische Makro-Risiken, Frühwarnindikatoren und vorstandsreife Narrative Briefings.',
                    href: '/tutorial/executive',
                    color: '#0EA5E9',
                },
                {
                    role: 'TEAMLEAD',
                    title: 'Team-Operations',
                    desc: 'Kausalzuschreibung, zielgerichtete Interventionen und wöchentliche Gesprächspunkte für 1:1s.',
                    href: '/tutorial/teamlead',
                    color: '#E11D48',
                },
                {
                    role: 'EMPLOYEE',
                    title: 'Mitarbeiter-Puls',
                    desc: 'Das psychometrische 10-Fragen-Instrument — was jede Frage misst und warum das wichtig ist.',
                    href: '/tutorial/employee',
                    color: '#10B981',
                },
                {
                    role: 'ADMIN',
                    title: 'Plattform-Administration',
                    desc: 'Org-Onboarding, Pipeline-Management, System-Health-Monitoring und RBAC-Konfiguration.',
                    href: '/tutorial/admin',
                    color: '#F59E0B',
                },
            ],
        },
        pricing: {
            headline: 'Enterprise-Präzision,\ndeploybar in Tagen.',
            sub: 'inPsyq ist ein White-Glove-Deployment. Wir arbeiten direkt mit Ihrem Executive-Team zusammen, um Indizes zu konfigurieren, Schwellenwerte zu kalibrieren und Ihre bestehende Dateninfrastruktur anzubinden.',
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
