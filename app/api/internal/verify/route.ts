import { NextResponse } from 'next/server';
import { query } from '@/db/client';

export const dynamic = 'force-dynamic';

export async function GET() {
    const report: any = {
        status: 'FAIL',
        checks: {}
    };

    try {
        // 1. DB Connection & Org Check
        const orgRes = await query('SELECT count(*) as c FROM orgs');
        const teamRes = await query('SELECT count(*) as c FROM teams');

        report.checks.db_connection = 'PASS';
        report.checks.org_count = parseInt(orgRes.rows[0].c);
        report.checks.team_count = parseInt(teamRes.rows[0].c);

        if (report.checks.org_count === 0) throw new Error('No Orgs found. Run /api/seed.');

        // 2. Data Check
        const usersRes = await query('SELECT count(*) as c FROM users');
        const responsesRes = await query('SELECT count(*) as c FROM responses');

        report.checks.user_count = parseInt(usersRes.rows[0].c);
        report.checks.response_count = parseInt(responsesRes.rows[0].c);

        if (report.checks.user_count === 0) throw new Error('No Users found.');

        // 3. Inference Check
        const statesRes = await query('SELECT count(*) as c FROM latent_states');
        report.checks.latent_states_count = parseInt(statesRes.rows[0].c);

        // 4. Aggregation Check (Audit Availability)
        const aggRes = await query('SELECT count(*) as c FROM org_aggregates_weekly');
        report.checks.aggregates_count = parseInt(aggRes.rows[0].c);

        if (report.checks.aggregates_count === 0) {
            report.status = 'WARN';
            report.message = 'Aggregates missing. Audit endpoint will need to auto-compute.';
        } else {
            report.status = 'PASS';
        }

        return NextResponse.json(report);

    } catch (e: any) {
        report.status = 'FAIL';
        report.error = e.message;
        report.details = String(e);
        return NextResponse.json(report, { status: 500 });
    }
}
