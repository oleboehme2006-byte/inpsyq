'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { SlideShow } from './SlideShow';
import type { Slide } from './SlideShow';
import { User, Users, RefreshCw, Activity, Database } from 'lucide-react';

const adminSlides: Slide[] = [
    {
        icon: <User className="w-8 h-8" />,
        headline: 'Your Role as Platform Operator',
        body: 'As an Admin, you own the configuration, integrity, and operational health of your organisation\'s inPsyq deployment. You are not a data consumer — you are the operator who ensures the pipeline runs cleanly, data meets quality thresholds, and stakeholders have access to the right views. The dashboards executives and teamleads see depend entirely on the correctness of what you configure.',
        bullets: [
            'Configure org structure: teams, reporting lines, RBAC roles',
            'Manage roster: import employees, assign teams, deactivate leavers',
            'Monitor pipeline health: response rates, lock status, quality gates',
            'Escalate anomalies: alert feed, coverage warnings, system errors',
        ],
    },
    {
        icon: <Users className="w-8 h-8" />,
        headline: 'Onboarding an Organisation',
        body: 'New organisation setup follows a defined sequence. Start with the org record, then create teams and assign reporting structures, then import the employee roster via CSV or the invite flow. Each employee receives a Clerk auth invitation. Roles (EMPLOYEE, TEAMLEAD, EXECUTIVE, ADMIN) are assigned in the membership table and control which dashboards each person can access.',
        bullets: [
            'Create org → configure k-anonymity threshold and slug',
            'Create teams → set team names and org assignment',
            'Import roster → CSV upload or manual invite per user',
            'Assign roles → memberships table; one user can have one role per org',
            'Verify onboarding → check that all invites are accepted and roles are correctly set',
        ],
    },
    {
        icon: <RefreshCw className="w-8 h-8" />,
        headline: 'The Weekly Pipeline — Automatic and Manual',
        body: 'inPsyq\'s pipeline runs automatically every Monday morning: it ingests the previous week\'s responses, runs the Bayesian inference model, computes team and org aggregates, stores weekly snapshots, and triggers LLM briefing generation. As admin, you can monitor this run, trigger a manual run for testing or reprocessing, and dry-run against a specific date range without writing to the database.',
        bullets: [
            'Automatic trigger: every Monday 06:00 UTC via scheduled job',
            'Manual trigger: POST /api/admin/pipeline/run with { orgId, weekStart }',
            'Dry-run mode: POST /api/admin/pipeline/run with { dryRun: true } — logs output without writing',
            'Lock status: pipeline sets a processing lock per org per week; check /admin for lock state',
            'Reprocessing: unlock the week then re-trigger — safe to run idempotently',
        ],
    },
    {
        icon: <Activity className="w-8 h-8" />,
        headline: 'System Health — What to Watch',
        body: 'The system health panel shows you the operational status of the pipeline, response rate coverage, and any active alerts. Response rate is the critical input variable — if coverage drops below the k-anonymity threshold, that team\'s data is suppressed for that week. The alert feed surfaces conditions that require manual review: missed runs, quality degradation, coverage warnings.',
        bullets: [
            'Coverage: percentage of active employees who responded this week',
            'Quality: signal confidence computed from response variance and model uncertainty',
            'Lock status: green = pipeline completed cleanly; amber = in progress; red = failed or locked',
            'Alert feed: severity-ranked list of conditions requiring attention',
            'Data quality score: combination of coverage, temporal stability, and signal confidence',
        ],
    },
    {
        icon: <Database className="w-8 h-8" />,
        headline: 'Data Governance — Your Compliance Obligations',
        body: 'As platform operator, you are responsible for ensuring data governance policies are correctly configured and enforced. The k-anonymity threshold prevents individual identification. Retention policy controls how long historical data is stored. All personally identifiable information is separated from signal data at the schema level — employee records and response signals are in separate tables with controlled joins.',
        bullets: [
            'k-anonymity threshold: set per org; default 5; minimum 3; must be reviewed with legal',
            'Retention policy: configurable per org; signals older than retention window are purged on pipeline run',
            'k-anonymity enforcement: pipeline automatically suppresses team results below threshold',
            'Audit log: all admin actions are written to audit_events — immutable, org-scoped',
            'RBAC: roles are enforced server-side in resolveAuthContext; no client-side bypass possible',
        ],
    },
];

export function TutorialAdmin() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnTo = searchParams.get('returnTo') || '/tutorial';

    return (
        <SlideShow slides={adminSlides} onComplete={() => router.push(returnTo)} />
    );
}
