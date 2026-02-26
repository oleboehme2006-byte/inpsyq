/**
 * LANDING PAGE CONTENT — DE / EN
 * Complete rewrite: 7 sections
 */

export type Lang = 'EN' | 'DE';

export interface StakeholderCard {
    label: string;
    title: string;
    body: string;
    color: string; // left accent border colour
}

export interface ValueStatement {
    lead: string;
    body: string;
}

export interface DeepDiveSection {
    label: string;
    labelColor: string;
    title: string;
    body: string; // multi-paragraph, separated by \n\n
    linkHref: string;
}

export interface TutorialTrack {
    role: string;
    title: string;
    sub: string;
    desc: string;
    href: string;
    color: string;
}

export interface LandingContent {
    nav: { login: string; langToggle: string };
    hero: {
        headline: string;     // \n separated lines
        cta: string;
        scroll: string;
    };
    gutFeeling: {
        headline: string;
        p1: string;
        p2: string;
        p3: string;           // resolution — rendered in text-white
    };
    depth: {
        headline: string;
        body: string;
        depthReveal: string;  // "What happens next..." — rendered in text-white
        cards: StakeholderCard[];
    };
    whatChanges: {
        headline: string;
        statements: ValueStatement[];
    };
    deepDive: {
        headline: string;
        sub: string;
        sections: DeepDiveSection[];
    };
    experience: {
        demoLabel: string;
        demoTitle: string;
        demoSub: string;
        demoCta: string;
        tutorialHeadline: string;
        tutorialSub: string;
        tracks: TutorialTrack[];
    };
    contact: {
        headline: string;
        sub: string;
        cta: string;
        note: string;
    };
    footer: { rights: string; privacy: string; terms: string; imprint: string };
}

export const content: Record<Lang, LandingContent> = {
    EN: {
        nav: { login: 'Log in', langToggle: 'DE' },
        hero: {
            headline: "A psychologist can't decode\nevery team at once.\nSo we engineered one that can.",
            cta: 'See how',
            scroll: 'Scroll',
        },
        gutFeeling: {
            headline: "The gut feeling was right.\nThe instrument was missing.",
            p1: "Leaders already sense when something shifts. The quieter meetings. The delayed responses. The subtle withdrawal before anyone hands in a resignation. That instinct is real — it's pattern recognition built from years of experience.",
            p2: "But instinct doesn't produce evidence. It doesn't tell you which team, which structural driver, or how much time you have left to act. It gives you a feeling in a boardroom full of opinions.",
            p3: "inPsyq gives that instinct an instrument. The patterns a trained psychologist would recognise over weeks of observation — cognitive load compounding, trust thinning between functions, engagement silently decaying — are now resolved mathematically. Continuously. Across your entire organisation.",
        },
        depth: {
            headline: "Two minutes per person per week.\nThat's the entire input.",
            body: "Ten carefully constructed psychometric items — grounded in thirty years of occupational health research — feed a mathematical model that most organisations don't know exists. It tracks psychological dimensions as evolving states. Quantifies uncertainty per team per week. Separates structural causes from individual noise. And synthesises everything into intelligence calibrated for each stakeholder's role.",
            depthReveal: "No one fills out forms for twenty minutes. The model extracts what it needs. The rest is mathematics.",
            cards: [
                {
                    label: 'EXECUTIVE INTELLIGENCE',
                    title: 'The entire organisation. One screen. Every Monday.',
                    body: "Risk-stratified team portfolio. Systemic drivers ranked by influence. Teams flagged before deterioration reaches performance metrics. A board-ready briefing synthesised from the week's inference — not summarised from last month's text.",
                    color: '#0EA5E9',
                },
                {
                    label: 'OPERATIONAL INTELLIGENCE',
                    title: 'The structural driver. Not the symptom.',
                    body: "When your team's numbers move, the system tells you why — is it internal role ambiguity, external dependency overload, or cross-team friction? Interventions are gated by statistical confidence. You act on structure, not guesswork.",
                    color: '#E11D48',
                },
                {
                    label: 'PERSONAL INTELLIGENCE',
                    title: 'Two minutes that change how your organisation listens.',
                    body: "Your identity never leaves the model. K-anonymity ensures no individual signal is recoverable. What you get: the knowledge that your voice was heard structurally — not as a data point, but as part of a living model that drives real decisions.",
                    color: '#10B981',
                },
            ],
        },
        whatChanges: {
            headline: "What changes when you can actually see.",
            statements: [
                {
                    lead: 'Interventions happen weeks earlier.',
                    body: "When psychological strain is detected at the structural level — not reported anecdotally at an HR offsite — leadership can act while the intervention window is still open. The difference between a conversation and a resignation is often three weeks.",
                },
                {
                    lead: 'Decisions are evidence-based, not opinion-based.',
                    body: "The briefing doesn't say 'the team seems stressed.' It says which dimension moved, by how much, with what confidence, caused by which structural factor. Leadership debates shift from 'I think' to 'the data shows.'",
                },
                {
                    lead: 'The signal is continuous. Not annual.',
                    body: "Annual surveys produce snapshots. inPsyq produces a living signal — every week, every team, with uncertainty quantified. Trends become visible. Deterioration is caught in motion, not in retrospect.",
                },
            ],
        },
        deepDive: {
            headline: "For those who want to look under the hood.",
            sub: "The science, the mathematics, and the psychology behind the system.",
            sections: [
                {
                    label: 'METHODOLOGY',
                    labelColor: '#8B5CF6',
                    title: 'Psychometric Foundations',
                    body: "The instrument is built on thirty years of occupational health psychology. Each of the ten items targets a distinct dimension — autonomy, role clarity, psychological safety, workload pressure, dependency load, belonging, and four composite constructs that feed the index model.\n\nThe items are not opinion questions. They are psychometric probes — each validated against clinical benchmarks, each designed to elicit a response that the model can decompose into latent state estimates. The instrument is short by design: two minutes preserves response rates above 85%, which is the statistical threshold for reliable team-level inference.\n\nEvery item has been tested for internal consistency, test-retest reliability, and discriminant validity across industries. The dimensional structure is invariant to team size, seniority distribution, and cultural context — verified across deployment cohorts.",
                    linkHref: '/docs/methodology',
                },
                {
                    label: 'ALGORITHMS',
                    labelColor: '#0EA5E9',
                    title: 'Bayesian Inference & Causal Attribution',
                    body: "Responses enter a Bayesian latent-state model — a Kalman filter variant that treats each psychological dimension as a time-evolving hidden state. Unlike snapshot analyses, the model maintains a belief distribution over each dimension, updating it weekly with new evidence while carrying forward the accumulated signal.\n\nUncertainty is not an afterthought. Every estimate comes with a confidence interval computed from the posterior distribution. When coverage is low or responses are inconsistent, the bands widen automatically — the system knows what it doesn't know.\n\nCausal attribution operates on the structured signal. The engine separates endogenous drivers — role clarity deficits, workload imbalance, autonomy constraints — from exogenous noise. It identifies which structural factor is moving the signal, with what magnitude, at what confidence level. The output is not 'your team is stressed.' It's 'role ambiguity in Engineering is driving a 15-point strain increase with 89% confidence.'",
                    linkHref: '/docs/algorithms',
                },
                {
                    label: 'PSYCHOLOGY',
                    labelColor: '#10B981',
                    title: 'From Signal to Intelligence',
                    body: "The final stage transforms structured mathematical output into human-readable intelligence. A language model trained on organisational psychology literature synthesises the full 48-dimensional signal vector into role-calibrated briefings.\n\nExecutive briefings are systemic: they name organisational risk, quantify probability, and recommend resource reallocation. Team-level briefings are operational: they isolate the specific structural driver, name the intervention, and scope the timeline.\n\nThe briefing is generated fresh from the latest inference run — it is never a summary of previous text. Every sentence can be traced back to a specific model output. This is not generative content. It is structured intelligence, rendered in natural language.\n\nPrivacy is architectural. Individual responses are aggregated before model input. K-anonymity thresholds are configurable per organisation. No individual's signal trajectory is recoverable from any output — not by the system, not by leadership, not by the LLM.",
                    linkHref: '/docs/psychology',
                },
            ],
        },
        experience: {
            demoLabel: 'LIVE INTERFACE · SYNTHETIC DATA',
            demoTitle: 'Open the Executive Dashboard',
            demoSub: 'A synthetic organisation. The real interface. Full signal vector.',
            demoCta: 'Open Live Demo',
            tutorialHeadline: 'Select your Learning Track',
            tutorialSub: 'Experience how inPsyq translates raw psychological signals into actionable executive and operational intelligence.',
            tracks: [
                { role: 'EXECUTIVE', title: 'Executive Board', sub: 'MACRO-LEVEL SYSTEMIC RISK', desc: 'Learn to interpret the organizational weather map. Understand how the system aggregates thousands of data points to identify leading indicators of burnout and attrition before they affect delivery.', href: '/tutorial/executive', color: '#0EA5E9' },
                { role: 'TEAMLEAD', title: 'Team Operations', sub: 'MICRO-LEVEL CAUSAL DRIVERS', desc: "Drill down into specific operational units. Understand how to isolate the root cause of friction — whether it's internal role clarity or external dependency bottlenecks — and apply targeted interventions.", href: '/tutorial/teamlead', color: '#E11D48' },
                { role: 'EMPLOYEE', title: 'Employee Pulse Session', sub: 'THE PSYCHOMETRIC INSTRUMENT', desc: 'Understand the 10-question pulse check. What each question measures, why it matters, and how your responses are anonymized before contributing to team-level insight.', href: '/tutorial/employee', color: '#10B981' },
                { role: 'ADMIN', title: 'Platform Administration', sub: 'DATA GOVERNANCE & PIPELINE', desc: 'Learn to onboard an organization, run the weekly intelligence pipeline, monitor system health, and enforce data privacy through k-anonymity configuration.', href: '/tutorial/admin', color: '#F59E0B' },
            ],
        },
        contact: {
            headline: "Built for organisations that take their people seriously.",
            sub: "inPsyq is deployed white-glove. Configured, calibrated, and integrated — in days, not months.",
            cta: 'Get in touch',
            note: 'By invitation only.',
        },
        footer: { rights: '© 2026 inPsyq GmbH. All rights reserved.', privacy: 'Privacy', terms: 'Terms', imprint: 'Imprint' },
    },

    DE: {
        nav: { login: 'Anmelden', langToggle: 'EN' },
        hero: {
            headline: "Ein Psychologe kann nicht jedes Team\ngleichzeitig entschlüsseln.\nAlso haben wir einen entwickelt, der das kann.",
            cta: 'So funktioniert es',
            scroll: 'Scrollen',
        },
        gutFeeling: {
            headline: "Das Bauchgefühl hatte recht.\nDas Instrument fehlte.",
            p1: "Führungskräfte spüren bereits, wenn sich etwas verschiebt. Die stilleren Meetings. Die verzögerten Antworten. Der subtile Rückzug, bevor jemand kündigt. Diese Intuition ist real — sie ist Mustererkennung, aufgebaut aus jahrelanger Erfahrung.",
            p2: "Aber Intuition erzeugt keine Evidenz. Sie sagt nicht, welches Team, welcher strukturelle Treiber, oder wie viel Zeit zum Handeln bleibt. Sie liefert ein Gefühl in einem Raum voller Meinungen.",
            p3: "inPsyq gibt dieser Intuition ein Instrument. Die Muster, die ein ausgebildeter Psychologe über Wochen der Beobachtung erkennen würde — kognitive Belastung, die sich verdichtet, Vertrauen, das zwischen Abteilungen dünner wird, Engagement, das still erodiert — werden jetzt mathematisch aufgelöst. Kontinuierlich. In Ihrer gesamten Organisation.",
        },
        depth: {
            headline: "Zwei Minuten pro Person pro Woche.\nDas ist der gesamte Input.",
            body: "Zehn sorgfältig konstruierte psychometrische Items — fundiert auf dreißig Jahren arbeitspsychologischer Forschung — speisen ein mathematisches Modell, von dem die meisten Organisationen nicht wissen, dass es existiert. Es verfolgt psychologische Dimensionen als evolvierende Zustände. Quantifiziert Unsicherheit pro Team pro Woche. Trennt strukturelle Ursachen von individuellem Rauschen. Und synthetisiert alles zu Intelligence, kalibriert für die Rolle jedes Stakeholders.",
            depthReveal: "Niemand füllt zwanzig Minuten Formulare aus. Das Modell extrahiert, was es braucht. Der Rest ist Mathematik.",
            cards: [
                {
                    label: 'EXECUTIVE INTELLIGENCE',
                    title: 'Die gesamte Organisation. Ein Bildschirm. Jeden Montag.',
                    body: "Risikostratifiziertes Team-Portfolio. Systemische Treiber nach Einfluss gerankt. Teams geflaggt, bevor Verschlechterung Performance-Metriken erreicht. Ein vorstandsreifes Briefing, synthetisiert aus der aktuellen Inferenz — nicht zusammengefasst aus letztem Monat.",
                    color: '#0EA5E9',
                },
                {
                    label: 'OPERATIVE INTELLIGENCE',
                    title: 'Der strukturelle Treiber. Nicht das Symptom.',
                    body: "Wenn sich die Zahlen Ihres Teams bewegen, sagt das System warum — interne Rollenambiguität, externe Abhängigkeitsüberlastung oder Interteam-Reibung? Interventionen sind durch statistische Konfidenz gesteuert. Sie handeln auf Basis von Struktur, nicht von Vermutungen.",
                    color: '#E11D48',
                },
                {
                    label: 'PERSÖNLICHE INTELLIGENCE',
                    title: 'Zwei Minuten, die verändern, wie Ihre Organisation zuhört.',
                    body: "Ihre Identität verlässt nie das Modell. K-Anonymität stellt sicher, dass kein individuelles Signal rekonstruierbar ist. Was Sie bekommen: das Wissen, dass Ihre Stimme strukturell gehört wurde — als Teil eines lebenden Modells, das echte Entscheidungen antreibt.",
                    color: '#10B981',
                },
            ],
        },
        whatChanges: {
            headline: "Was sich ändert, wenn man tatsächlich sehen kann.",
            statements: [
                {
                    lead: 'Interventionen geschehen Wochen früher.',
                    body: "Wenn psychische Belastung auf struktureller Ebene erkannt wird — nicht anekdotisch beim HR-Offsite berichtet — kann die Führung handeln, solange das Interventionsfenster noch offen ist. Der Unterschied zwischen einem Gespräch und einer Kündigung beträgt oft drei Wochen.",
                },
                {
                    lead: 'Entscheidungen basieren auf Evidenz, nicht auf Meinungen.',
                    body: "Das Briefing sagt nicht 'das Team scheint gestresst.' Es sagt, welche Dimension sich bewegt hat, um wie viel, mit welcher Konfidenz, verursacht durch welchen strukturellen Faktor. Führungsdebatten verschieben sich von 'Ich denke' zu 'Die Daten zeigen.'",
                },
                {
                    lead: 'Das Signal ist kontinuierlich. Nicht jährlich.',
                    body: "Jahresumfragen erzeugen Momentaufnahmen. inPsyq erzeugt ein lebendes Signal — jede Woche, jedes Team, mit quantifizierter Unsicherheit. Trends werden sichtbar. Verschlechterung wird in Bewegung erkannt, nicht im Rückblick.",
                },
            ],
        },
        deepDive: {
            headline: "Für alle, die unter die Haube schauen wollen.",
            sub: "Die Wissenschaft, die Mathematik und die Psychologie hinter dem System.",
            sections: [
                {
                    label: 'METHODIK',
                    labelColor: '#8B5CF6',
                    title: 'Psychometrische Grundlagen',
                    body: "Das Instrument basiert auf dreißig Jahren Arbeits- und Gesundheitspsychologie. Jedes der zehn Items zielt auf eine eigene Dimension — Autonomie, Rollenklarheit, psychologische Sicherheit, Arbeitsbelastung, Abhängigkeitslast, Zugehörigkeit und vier komposite Konstrukte, die das Indexmodell speisen.\n\nDie Items sind keine Meinungsfragen. Sie sind psychometrische Sonden — jede validiert gegen klinische Benchmarks, jede konstruiert, um eine Antwort hervorzurufen, die das Modell in Latent-State-Schätzungen zerlegen kann. Das Instrument ist bewusst kurz: zwei Minuten erhalten Antwortraten über 85 %, was die statistische Schwelle für verlässliche Teamebenen-Inferenz ist.\n\nJedes Item wurde auf interne Konsistenz, Test-Retest-Reliabilität und diskriminante Validität über Branchen hinweg geprüft. Die dimensionale Struktur ist invariant gegenüber Teamgröße, Senioritätsverteilung und kulturellem Kontext — verifiziert über Deployment-Kohorten.",
                    linkHref: '/docs/methodology',
                },
                {
                    label: 'ALGORITHMEN',
                    labelColor: '#0EA5E9',
                    title: 'Bayesianische Inferenz & Kausale Attribution',
                    body: "Antworten fließen in ein Bayesianisches Latent-State-Modell — eine Kalman-Filter-Variante, die jede psychologische Dimension als zeitlich evolvierenden verborgenen Zustand behandelt. Anders als Momentaufnahme-Analysen pflegt das Modell eine Belief-Distribution über jede Dimension, aktualisiert sie wöchentlich mit neuer Evidenz und trägt das akkumulierte Signal fort.\n\nUnsicherheit ist kein Nachgedanke. Jede Schätzung kommt mit einem Konfidenzintervall, berechnet aus der Posterior-Distribution. Bei niedriger Coverage oder inkonsistenten Antworten weiten sich die Bänder automatisch — das System weiß, was es nicht weiß.\n\nKausale Attribution operiert auf dem strukturierten Signal. Die Engine trennt endogene Treiber — Rollenklarheitsdefizite, Workload-Imbalance, Autonomie-Constraints — von exogenem Rauschen. Sie identifiziert, welcher strukturelle Faktor das Signal bewegt, mit welcher Magnitude, bei welchem Konfidenzniveau.",
                    linkHref: '/docs/algorithms',
                },
                {
                    label: 'PSYCHOLOGIE',
                    labelColor: '#10B981',
                    title: 'Vom Signal zur Intelligence',
                    body: "Die letzte Stufe transformiert strukturierten mathematischen Output in menschenlesbare Intelligence. Ein auf Organisationspsychologie-Literatur trainiertes Sprachmodell synthetisiert den vollen 48-dimensionalen Signalvektor in rollenspezifische Briefings.\n\nExecutive-Briefings sind systemisch: sie benennen organisationales Risiko, quantifizieren Wahrscheinlichkeit und empfehlen Ressourcen-Reallokation. Team-Briefings sind operativ: sie isolieren den spezifischen strukturellen Treiber, benennen die Intervention und umreißen den Zeitrahmen.\n\nDas Briefing wird frisch aus dem neuesten Inferenzlauf generiert — es ist nie eine Zusammenfassung früherer Texte. Jeder Satz kann auf einen spezifischen Modell-Output zurückverfolgt werden.\n\nPrivatsphäre ist architektonisch. Individuelle Antworten werden vor dem Modell-Input aggregiert. K-Anonymitäts-Schwellen sind pro Organisation konfigurierbar. Keine individuelle Signaltrajektorie ist aus irgendeinem Output rekonstruierbar.",
                    linkHref: '/docs/psychology',
                },
            ],
        },
        experience: {
            demoLabel: 'LIVE-INTERFACE · SYNTHETISCHE DATEN',
            demoTitle: 'Das Executive Dashboard öffnen',
            demoSub: 'Eine synthetische Organisation. Das echte Interface. Voller Signalvektor.',
            demoCta: 'Live-Demo öffnen',
            tutorialHeadline: 'Wählen Sie Ihren Lernpfad',
            tutorialSub: 'Erleben Sie, wie inPsyq rohe psychologische Signale in umsetzbare Intelligence übersetzt.',
            tracks: [
                { role: 'EXECUTIVE', title: 'Executive Board', sub: 'MAKRO-EBENE SYSTEMISCHES RISIKO', desc: 'Lernen Sie die organisationale Wetterkarte zu interpretieren. Verstehen Sie, wie das System Tausende Datenpunkte aggregiert, um Frühwarnindikatoren für Burnout und Fluktuation zu identifizieren.', href: '/tutorial/executive', color: '#0EA5E9' },
                { role: 'TEAMLEAD', title: 'Team-Operations', sub: 'MIKRO-EBENE KAUSALE TREIBER', desc: 'Tauchen Sie in spezifische operative Einheiten ein. Verstehen Sie, wie die Grundursache von Reibung isoliert wird — ob interne Rollenklarheit oder externe Abhängigkeitsengpässe.', href: '/tutorial/teamlead', color: '#E11D48' },
                { role: 'EMPLOYEE', title: 'Mitarbeiter-Puls', sub: 'DAS PSYCHOMETRISCHE INSTRUMENT', desc: 'Verstehen Sie den 10-Fragen-Pulscheck. Was jede Frage misst, warum sie wichtig ist und wie Ihre Antworten anonymisiert werden.', href: '/tutorial/employee', color: '#10B981' },
                { role: 'ADMIN', title: 'Plattform-Administration', sub: 'DATA GOVERNANCE & PIPELINE', desc: 'Lernen Sie eine Organisation onzuboarden, die wöchentliche Intelligence-Pipeline auszuführen und Systemgesundheit zu überwachen.', href: '/tutorial/admin', color: '#F59E0B' },
            ],
        },
        contact: {
            headline: "Für Organisationen, die ihre Mitarbeitenden ernst nehmen.",
            sub: "inPsyq wird White-Glove deployt. Konfiguriert, kalibriert und integriert — in Tagen, nicht Monaten.",
            cta: 'Kontakt aufnehmen',
            note: 'Nur auf Einladung.',
        },
        footer: { rights: '© 2026 inPsyq GmbH. Alle Rechte vorbehalten.', privacy: 'Datenschutz', terms: 'AGB', imprint: 'Impressum' },
    },
};
