/**
 * LANDING PAGE CONTENT MAPS — DE / EN
 *
 * All static text for the landing page (Phase 4 v2 redesign).
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
        demoCta: string;
        demoCtaButton: string;
        tourCta: string;
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
            headline: 'Your organisation speaks in signals.\nNo one\'s listening.',
            sub: 'inPsyq is the first causal-inference platform that quantifies psychological strain, trust erosion, and systemic withdrawal — weekly, at enterprise scale — and tells leadership exactly why the numbers are moving.',
            scroll: 'Scroll',
        },
        problem: {
            badge: 'SYSTEMIC BLIND SPOT',
            headline: 'You\'re treating symptoms.\nThe cause was invisible.',
            body: 'Attrition, burnout, and delivery failures are lag metrics. By the time they surface, the psychological conditions that caused them were set weeks ago. No existing instrument was designed to detect the signal before the damage.',
            items: [
                {
                    title: 'Annual surveys capture snapshots',
                    desc: 'Quarterly instruments measure mood at a single point. Organisational strain accumulates in the weeks between — entirely undetected.',
                },
                {
                    title: 'Sentiment ≠ causation',
                    desc: 'Feeling-based tools can\'t distinguish structural dysfunction — role ambiguity, dependency overload — from day-to-day variation. You get correlation without the lever.',
                },
                {
                    title: 'History, not intelligence',
                    desc: 'Attrition rates, eNPS, exit interviews — they describe what already happened. The intervention window closed weeks ago.',
                },
            ],
        },
        howItWorks: {
            badge: 'THE 72-HOUR INTELLIGENCE LOOP',
            headline: 'From two-minute pulse\nto Monday briefing.',
            body: 'A weekly 10-question check-in — validated psychometric items, 2 minutes per employee — feeds a Bayesian inference engine that resolves the psychological state of every team. By Monday morning, each stakeholder holds a role-calibrated briefing.',
            steps: [
                {
                    step: '01',
                    title: 'Weekly Psychometric Pulse',
                    desc: 'Ten validated items targeting ten distinct psychological dimensions from Occupational Health Psychology. Two minutes. Every employee. Every week.',
                },
                {
                    step: '02',
                    title: 'Latent-State Inference',
                    desc: 'Responses enter a Kalman-variant model that infers each dimension as a time-evolving latent state. Uncertainty is quantified per parameter per week — confidence bands are computed, never assumed.',
                },
                {
                    step: '03',
                    title: 'Causal Attribution',
                    desc: 'The engine separates structural causes — role clarity deficits, dependency load — from relational noise. Not what moved. Why it moved.',
                },
                {
                    step: '04',
                    title: 'Role-Calibrated Briefings',
                    desc: 'An LLM trained on organisational psychology synthesises 48-dimensional signal vectors into board-ready briefings for executives, talking points for teamleads, and private summaries for employees. Every Monday.',
                },
            ],
        },
        science: {
            badge: 'VALIDATED METHODOLOGY',
            headline: 'Thirty years of research.\nOperationalised in seven days.',
            body: 'Every index, every signal, every intervention recommendation traces to peer-reviewed causal models in Occupational Health Psychology. Not pattern-matched opinion. Not engagement proxies. Structure.',
            pillars: [
                {
                    title: 'Psychometric Precision',
                    desc: 'Ten validated dimensions engineered to hold construct ambiguity below 5% standard error. Items drawn from peer-reviewed OHP instruments. Construct validity tracked per deployment cohort.',
                },
                {
                    title: 'Bayesian Latent-State Model',
                    desc: 'A Kalman-variant engine tracking each psychological dimension as a time-evolving latent state. Uncertainty quantified per parameter per week. k-anonymity enforced at every aggregation step.',
                },
                {
                    title: 'LLM Narrative Synthesis',
                    desc: 'A fine-tuned model converting 48-dimensional signal vectors into role-appropriate natural language. Executive briefings, teamlead talking points, employee summaries — generated from the same causal substrate. Updated every Monday.',
                },
            ],
        },
        roleDemos: {
            badge: 'SEE IT IN ACTION',
            headline: 'Four roles. Four lenses.\nOne platform.',
            sub: 'Every stakeholder — from the board room to the individual contributor — sees exactly what they need. Explore a live demo or walk through a guided tour of any role.',
            demoCta: 'Experience the full Executive Dashboard — live, with synthetic data.',
            demoCtaButton: 'Open Live Demo',
            tourCta: 'Start Tour →',
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
            badge: 'ENTERPRISE DEPLOYMENT',
            headline: 'Built for organisations that\ntake culture seriously.',
            sub: 'inPsyq is deployed white-glove. We configure indices, calibrate thresholds, integrate your data infrastructure, and train your stakeholders — in days, not months.',
            cta: 'Request a Demo',
            note: 'By invitation only.',
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
            headline: 'Ihre Organisation sendet Signale.\nNiemand hört zu.',
            sub: 'inPsyq ist die erste Kausalinferenz-Plattform, die psychologische Belastung, Vertrauenserosion und systemischen Rückzug quantifiziert — wöchentlich, auf Unternehmensebene — und der Führung erklärt, warum sich die Werte bewegen.',
            scroll: 'Scrollen',
        },
        problem: {
            badge: 'DER SYSTEMISCHE BLINDE FLECK',
            headline: 'Sie behandeln Symptome.\nDie Ursache war unsichtbar.',
            body: 'Fluktuation, Burnout und gescheiterte Lieferungen sind Nachlaufindikatoren. Wenn sie sichtbar werden, standen die psychologischen Bedingungen, die sie verursacht haben, schon Wochen fest. Kein bestehendes Instrument erkennt das Signal vor dem Schaden.',
            items: [
                {
                    title: 'Jahresumfragen messen Momentaufnahmen',
                    desc: 'Quartals-Instrumente erfassen Stimmung zu einem einzigen Zeitpunkt. Systemische Belastung akkumuliert in den Wochen dazwischen — völlig unerkannt.',
                },
                {
                    title: 'Stimmung ≠ Kausalität',
                    desc: 'Gefühlsbasierte Tools unterscheiden nicht zwischen struktureller Dysfunktion — Rollenambiguität, Abhängigkeitsüberlastung — und alltäglicher Variation. Korrelation ohne Hebel.',
                },
                {
                    title: 'Geschichte statt Intelligence',
                    desc: 'Fluktuationsraten, eNPS, Exit-Interviews — sie beschreiben Vergangenes. Das Interventionsfenster war Wochen zuvor geschlossen.',
                },
            ],
        },
        howItWorks: {
            badge: 'DER 72-STUNDEN-INTELLIGENCE-LOOP',
            headline: 'Von der Zwei-Minuten-Umfrage\nzum Montags-Briefing.',
            body: 'Eine wöchentliche 10-Fragen-Kurzerhebung — validierte psychometrische Items, 2 Minuten pro Mitarbeiterin — speist ein Bayesianisches Inferenzmodell, das den psychologischen Zustand jedes Teams auflöst. Montag früh liegt jeder Stakeholderin ein rollenspezifisches Briefing vor.',
            steps: [
                {
                    step: '01',
                    title: 'Wöchentlicher Psychometrischer Puls',
                    desc: 'Zehn validierte Items zu zehn distinkten psychologischen Dimensionen der Arbeits- und Gesundheitspsychologie. Zwei Minuten. Alle. Jede Woche.',
                },
                {
                    step: '02',
                    title: 'Latent-State-Inferenz',
                    desc: 'Antworten fließen in ein Kalman-Varianten-Modell, das jede Dimension als zeitlich evolvierenden Latent-State rekonstruiert. Unsicherheit wird pro Parameter pro Woche quantifiziert — Konfidenzintervalle werden berechnet, nie angenommen.',
                },
                {
                    step: '03',
                    title: 'Kausale Attribution',
                    desc: 'Die Engine trennt strukturelle Ursachen — Rollenklarheitsdefizite, Abhängigkeitslast — von relationalem Rauschen. Nicht was sich bewegt hat. Warum.',
                },
                {
                    step: '04',
                    title: 'Rollenspezifische Briefings',
                    desc: 'Ein auf Organisationspsychologie trainiertes LLM synthetisiert 48-dimensionale Signalvektoren in vorstandsreife Briefings für Executives, Gesprächspunkte für Teamleads und private Zusammenfassungen für Mitarbeiter:innen. Jeden Montag.',
                },
            ],
        },
        science: {
            badge: 'VALIDIERTE METHODIK',
            headline: 'Dreißig Jahre Forschung.\nIn sieben Tagen operationalisiert.',
            body: 'Jeder Index, jedes Signal, jede Interventionsempfehlung geht auf peer-reviewte Kausalmodelle der Arbeits- und Gesundheitspsychologie zurück. Keine musterbasierten Meinungen. Keine Engagement-Proxys. Struktur.',
            pillars: [
                {
                    title: 'Psychometrische Präzision',
                    desc: 'Zehn validierte Dimensionen, konstruiert, um Konstruktambiguität unter 5 % Standardfehler zu halten. Items aus peer-reviewten AHP-Instrumenten. Konstruktvalidität wird pro Deployment-Kohorte verfolgt.',
                },
                {
                    title: 'Bayesianisches Latent-State-Modell',
                    desc: 'Eine Kalman-Varianten-Engine verfolgt jede psychologische Dimension als zeitlich evolvierenden Latent-State. Unsicherheit wird pro Parameter pro Woche quantifiziert. k-Anonymität wird bei jedem Aggregationsschritt erzwungen.',
                },
                {
                    title: 'LLM-Narrativ-Synthese',
                    desc: 'Ein feinabgestimmtes Modell konvertiert 48-dimensionale Signalvektoren in rollenangemessene natürliche Sprache. Executive-Briefings, Teamlead-Talking-Points, Mitarbeiter:innen-Zusammenfassungen — generiert aus demselben kausalen Substrat. Jeden Montag aktualisiert.',
                },
            ],
        },
        roleDemos: {
            badge: 'ERLEBEN SIE ES LIVE',
            headline: 'Vier Rollen. Vier Perspektiven.\nEine Plattform.',
            sub: 'Jede Stakeholderin — vom Vorstand bis zur Einzelkontributorin — sieht genau das, was sie braucht. Erkunden Sie eine Live-Demo oder nehmen Sie an einer geführten Tour teil.',
            demoCta: 'Erleben Sie das vollständige Executive Dashboard — live, mit synthetischen Daten.',
            demoCtaButton: 'Live-Demo öffnen',
            tourCta: 'Tour starten →',
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
            badge: 'ENTERPRISE-DEPLOYMENT',
            headline: 'Für Organisationen,\ndie Kultur ernst nehmen.',
            sub: 'inPsyq wird White-Glove deployt. Wir konfigurieren die Indizes, kalibrieren Schwellenwerte, integrieren Ihre Dateninfrastruktur und schulen Ihre Stakeholder — in Tagen, nicht Monaten.',
            cta: 'Demo anfragen',
            note: 'Nur auf Einladung.',
        },
        footer: {
            rights: '© 2026 inPsyq GmbH. Alle Rechte vorbehalten.',
            privacy: 'Datenschutz',
            terms: 'AGB',
            imprint: 'Impressum',
        },
    },
};
