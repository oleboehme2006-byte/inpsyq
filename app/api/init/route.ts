import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/db/client';
import { SCHEMA_SQL } from '@/lib/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        let shouldReset = searchParams.get('reset') === 'true';

        // Self-Healing: Check if we need to migrate schema automatically
        if (!shouldReset) {
            try {
                // Test if team_id column exists
                await query('SELECT team_id FROM teams LIMIT 1');
            } catch (e: any) {
                const errString = String(e);
                // Check code 42703 (undefined_column) or string matching
                if (e.code === '42703' || errString.includes('does not exist') || errString.includes('team_id')) {
                    console.log("[Init] Schema mismatch detected (missing team_id). Triggering auto-reset.");
                    shouldReset = true;
                }
            }
        }

        if (shouldReset) {
            console.log("[Init] Resetting database to fix schema...");
            await query(`
                DROP TABLE IF EXISTS 
                employee_profiles, 
                private_feedback, 
                org_profiles_weekly, 
                org_aggregates_weekly, 
                latent_states, 
                encoded_signals, 
                responses, 
                sessions, 
                interactions, 
                users, 
                teams, 
                orgs 
                CASCADE;
            `);
            console.log("[Init] Database reset complete.");
        }

        console.log("[Init] Executing schema...");
        await query(SCHEMA_SQL);
        console.log("[Init] Schema applied successfully.");

        return NextResponse.json({
            success: true,
            message: 'Schema initialized',
            reset_performed: shouldReset
        });
    } catch (error) {
        console.error("[Init Error]", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
