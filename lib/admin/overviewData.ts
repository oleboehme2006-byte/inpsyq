/**
 * Admin Overview — Server-side data fetching for the /admin page.
 *
 * Calls service functions and DB directly (no HTTP round-trips).
 * All functions require a validated orgId from resolveAuthContext().
 */

import { query } from '@/db/client';
import { getOrgHealthSnapshot } from '@/services/ops/healthSnapshot';
import { format } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

export type StepStatus = 'OK' | 'AT_RISK' | 'CRITICAL';

export interface SetupStep {
    key: string;
    label: string;
    status: StepStatus;
    detail: string;
}

export interface SetupStatusSummary {
    steps: SetupStep[];
    overallStatus: StepStatus;
}

export interface OrgHealthSummary {
    totalTeams: number;
    okTeams: number;
    degradedTeams: number;
    failedTeams: number;
    missingProducts: number;
    missingInterpretations: number;
    locksStuck: number;
    targetWeekStart: string | null;
}

export interface LatestRunSummary {
    runId: string | null;
    weekStart: string | null;
    status: string;
    startedAt: string | null;
    teamsProcessed: number;
    teamsFailed: number;
    durationMs: number | null;
    errorMessage: string | null;
}

export interface AlertSummaryItem {
    alertId: string;
    alertType: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    isComputed: boolean;
}

// ─── Setup Status ─────────────────────────────────────────────────────────────

export async function getSetupStatusSummary(orgId: string): Promise<SetupStatusSummary> {
    // Step 1: Teams
    const teamsRes = await query(
        `SELECT COUNT(*) AS total FROM teams WHERE org_id = $1 AND is_archived = false`,
        [orgId]
    );
    const activeTeams = parseInt(teamsRes.rows[0]?.total ?? '0', 10);

    // Step 2: Access (members + pending invites)
    const membersRes = await query(
        `SELECT COUNT(*) AS total FROM memberships WHERE org_id = $1 AND is_active = true`,
        [orgId]
    );
    const membersCount = parseInt(membersRes.rows[0]?.total ?? '0', 10);

    const invitesRes = await query(
        `SELECT COUNT(*) AS total FROM active_invites WHERE org_id = $1 AND expires_at > NOW()`,
        [orgId]
    );
    const pendingInvites = parseInt(invitesRes.rows[0]?.total ?? '0', 10);

    // Step 3: Pipeline (products exist for this org)
    const productsRes = await query(
        `SELECT COUNT(DISTINCT team_id) AS teams_with_data
         FROM org_aggregates_weekly
         WHERE org_id = $1`,
        [orgId]
    );
    const teamsWithData = parseInt(productsRes.rows[0]?.teams_with_data ?? '0', 10);

    // Step 4: Interpretations
    const interpsRes = await query(
        `SELECT COUNT(DISTINCT team_id) AS teams_with_interp
         FROM weekly_interpretations
         WHERE org_id = $1 AND is_active = true`,
        [orgId]
    );
    const teamsWithInterp = parseInt(interpsRes.rows[0]?.teams_with_interp ?? '0', 10);

    // Compute step statuses
    const teamsStep: SetupStep = {
        key: 'teams',
        label: 'Teams Created',
        status: activeTeams === 0 ? 'CRITICAL' : 'OK',
        detail: activeTeams === 0
            ? 'No active teams. Create at least one team before sending invites.'
            : `${activeTeams} active team${activeTeams !== 1 ? 's' : ''} configured.`,
    };

    const accessStep: SetupStep = {
        key: 'access',
        label: 'Access Configured',
        status: membersCount === 0 && pendingInvites === 0 ? 'CRITICAL'
              : membersCount === 0 ? 'AT_RISK'
              : 'OK',
        detail: membersCount === 0 && pendingInvites === 0
            ? 'No members or invites. Import a roster to onboard users.'
            : `${membersCount} active member${membersCount !== 1 ? 's' : ''}, ${pendingInvites} pending invite${pendingInvites !== 1 ? 's' : ''}.`,
    };

    const pipelineStep: SetupStep = {
        key: 'pipeline',
        label: 'Pipeline Running',
        status: activeTeams > 0 && teamsWithData === 0 ? 'CRITICAL'
              : teamsWithData < activeTeams ? 'AT_RISK'
              : 'OK',
        detail: teamsWithData === 0
            ? 'No pipeline data yet. Trigger a weekly run to populate dashboards.'
            : `${teamsWithData} of ${activeTeams} team${activeTeams !== 1 ? 's' : ''} have pipeline data.`,
    };

    const dashboardsStep: SetupStep = {
        key: 'dashboards',
        label: 'Dashboards Ready',
        status: teamsWithInterp === 0 && activeTeams > 0 ? 'AT_RISK'
              : teamsWithData === 0 ? 'CRITICAL'
              : 'OK',
        detail: teamsWithInterp === 0
            ? 'No interpretations generated yet. Run the pipeline to generate briefings.'
            : `${teamsWithInterp} team${teamsWithInterp !== 1 ? 's' : ''} have live interpretations.`,
    };

    const steps: SetupStep[] = [teamsStep, accessStep, pipelineStep, dashboardsStep];
    const overallStatus: StepStatus =
        steps.some(s => s.status === 'CRITICAL') ? 'CRITICAL' :
        steps.some(s => s.status === 'AT_RISK')  ? 'AT_RISK'  : 'OK';

    return { steps, overallStatus };
}

// ─── Org Health ───────────────────────────────────────────────────────────────

export async function getOrgHealthSummary(orgId: string): Promise<OrgHealthSummary> {
    try {
        const snapshot = await getOrgHealthSnapshot(orgId, -1);
        return {
            totalTeams:              snapshot.teamsTotal,
            okTeams:                 snapshot.teamsOk,
            degradedTeams:           snapshot.teamsDegraded,
            failedTeams:             snapshot.teamsFailed,
            missingProducts:         snapshot.missingProducts,
            missingInterpretations:  snapshot.missingInterpretations,
            locksStuck:              snapshot.locksStuck,
            targetWeekStart:         snapshot.weekStart ?? null,
        };
    } catch {
        return {
            totalTeams: 0, okTeams: 0, degradedTeams: 0, failedTeams: 0,
            missingProducts: 0, missingInterpretations: 0, locksStuck: 0,
            targetWeekStart: null,
        };
    }
}

// ─── Latest Pipeline Run ──────────────────────────────────────────────────────

export async function getLatestRuns(orgId: string, limit = 3): Promise<LatestRunSummary[]> {
    try {
        // Try pipeline_jobs table first (production)
        const jobsRes = await query(
            `SELECT job_id, payload, status, created_at, updated_at, error_message
             FROM pipeline_jobs
             WHERE (payload->>'orgId' = $1 OR payload->>'org_id' = $1)
             ORDER BY created_at DESC
             LIMIT $2`,
            [orgId, limit]
        );

        if (jobsRes.rows.length > 0) {
            return jobsRes.rows.map((r: any) => ({
                runId:          r.job_id,
                weekStart:      r.payload?.weekStart ?? r.payload?.week_start ?? null,
                status:         r.status ?? 'UNKNOWN',
                startedAt:      r.created_at ? format(new Date(r.created_at), 'MMM d, yyyy HH:mm') : null,
                teamsProcessed: r.payload?.counts?.teamsSuccess ?? 0,
                teamsFailed:    r.payload?.counts?.teamsFailed ?? 0,
                durationMs:     r.payload?.durationMs ?? null,
                errorMessage:   r.error_message ?? null,
            }));
        }
    } catch {
        // table may not exist yet — fall through to audit log
    }

    // Fallback: audit_events
    try {
        const auditRes = await query(
            `SELECT event_id, event_type, metadata, created_at
             FROM audit_events
             WHERE org_id = $1
               AND event_type IN ('ADMIN_RUN_WEEKLY', 'ADMIN_RUN_WEEKLY_DRYRUN', 'WEEKLY_RUN_COMPLETE', 'WEEKLY_RUN_FAILED')
             ORDER BY created_at DESC
             LIMIT $2`,
            [orgId, limit]
        );

        return auditRes.rows.map((r: any) => ({
            runId:          r.event_id,
            weekStart:      r.metadata?.weekStart ?? r.metadata?.week_start ?? null,
            status:         r.event_type.includes('FAILED') ? 'FAILED'
                          : r.event_type.includes('DRY') ? 'DRY_RUN'
                          : 'COMPLETED',
            startedAt:      r.created_at ? format(new Date(r.created_at), 'MMM d, yyyy HH:mm') : null,
            teamsProcessed: r.metadata?.counts?.teamsSuccess ?? 0,
            teamsFailed:    r.metadata?.counts?.teamsFailed ?? 0,
            durationMs:     r.metadata?.durationMs ?? null,
            errorMessage:   r.metadata?.error ?? null,
        }));
    } catch {
        return [];
    }
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export async function getRecentAlerts(orgId: string, limit = 5): Promise<AlertSummaryItem[]> {
    const alerts: AlertSummaryItem[] = [];

    // Stored alerts
    try {
        const storedRes = await query(
            `SELECT alert_id, alert_type, severity, message
             FROM alerts
             WHERE org_id = $1 AND resolved_at IS NULL
             ORDER BY created_at DESC
             LIMIT $2`,
            [orgId, limit]
        );
        for (const r of storedRes.rows) {
            alerts.push({
                alertId:   r.alert_id,
                alertType: r.alert_type,
                severity:  r.severity as 'critical' | 'warning' | 'info',
                message:   r.message,
                isComputed: false,
            });
        }
    } catch {
        // alerts table may not exist yet
    }

    // Computed alerts from health snapshot (fill remaining slots)
    if (alerts.length < limit) {
        try {
            const snapshot = await getOrgHealthSnapshot(orgId, -1);
            if (snapshot.teamsFailed > 0) {
                alerts.push({
                    alertId:   'computed-coverage',
                    alertType: 'COVERAGE_GAP',
                    severity:  'critical',
                    message:   `${snapshot.teamsFailed} team${snapshot.teamsFailed !== 1 ? 's' : ''} failed pipeline processing this week.`,
                    isComputed: true,
                });
            }
            if (snapshot.locksStuck > 0) {
                alerts.push({
                    alertId:   'computed-lock',
                    alertType: 'LOCK_STUCK',
                    severity:  'warning',
                    message:   `${snapshot.locksStuck} pipeline lock${snapshot.locksStuck !== 1 ? 's' : ''} appear stuck. Manual release may be needed.`,
                    isComputed: true,
                });
            }
            if (snapshot.teamsDegraded > 0) {
                alerts.push({
                    alertId:   'computed-interp',
                    alertType: 'INTERPRETATION_FALLBACK',
                    severity:  'info',
                    message:   `${snapshot.teamsDegraded} team${snapshot.teamsDegraded !== 1 ? 's' : ''} used deterministic fallback for briefings (no LLM output).`,
                    isComputed: true,
                });
            }
        } catch {
            // skip computed alerts if health snapshot fails
        }
    }

    return alerts.slice(0, limit);
}
