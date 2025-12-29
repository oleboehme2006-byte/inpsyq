
import { NextRequest, NextResponse } from 'next/server';
import { checkSystemAlerts } from '@/services/ops/alerting';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('x-internal-admin-secret');
    const authCron = req.headers.get('x-cron-secret');
    const secretAdmin = process.env.INTERNAL_ADMIN_SECRET;
    const secretCron = process.env.INTERNAL_CRON_SECRET;

    const isAuthorized = (secretAdmin && authHeader === secretAdmin) ||
        (secretCron && authCron === secretCron);

    if (!isAuthorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await checkSystemAlerts();
        return NextResponse.json({ ok: true, status: 'checked' });
    } catch (e: any) {
        console.error('[Ops] Check failed:', e);
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
