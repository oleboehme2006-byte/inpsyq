/**
 * INTERPRETATION DIAGNOSTICS — Cache State and Last Generation
 * 
 * GET /api/internal/diag/interpretation?org_id=...&team_id=...&week_start=...
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/db/client';
import { requireInternalAccess } from '@/lib/access/guards';
import { INTERPRETATION_SCHEMA_SQL } from '@/lib/interpretation/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

let schemaEnsured = false;
async function ensureSchema() {
    if (schemaEnsured) return;
    try {
        await query(INTERPRETATION_SCHEMA_SQL);
        schemaEnsured = true;
    } catch (e) {
        schemaEnsured = true;
    }
}

// Simple in-memory stats (internal only, not exported)
const stats = {
    cacheHits: 0,
    cacheMisses: 0,
    generationsSuccess: 0,
    generationsFailure: 0,
};

// Internal stat recording functions
function recordCacheHit() { stats.cacheHits++; }
function recordCacheMiss() { stats.cacheMisses++; }
function recordGenerationSuccess() { stats.generationsSuccess++; }
function recordGenerationFailure() { stats.generationsFailure++; }

export async function GET(req: NextRequest) {
    const requestId = crypto.randomUUID();

    // Guard: internal access required
    const guardResult = await requireInternalAccess(req);
    if (!guardResult.ok) {
        return guardResult.response;
    }

    await ensureSchema();

    try {
        const url = new URL(req.url);
        const orgId = url.searchParams.get('org_id');
        const teamId = url.searchParams.get('team_id');
        const weekStart = url.searchParams.get('week_start');

        if (!orgId) {
            return NextResponse.json(
                { error: 'org_id is required', code: 'VALIDATION_ERROR', request_id: requestId },
                { status: 400 }
            );
        }

        // Build query for active interpretation
        let sql = `
      SELECT 
        org_id, team_id, week_start, input_hash, 
        model_id, prompt_version, created_at, is_active
      FROM weekly_interpretations
      WHERE org_id = $1 AND is_active = true
    `;
        const params: any[] = [orgId];

        if (teamId) {
            sql += ` AND team_id = $2`;
            params.push(teamId);
        }

        if (weekStart) {
            sql += ` AND week_start = $${params.length + 1}`;
            params.push(weekStart);
        }

        sql += ` ORDER BY week_start DESC LIMIT 10`;

        const result = await query(sql, params);

        // Count total rows
        const countResult = await query(
            `SELECT COUNT(*) as count FROM weekly_interpretations WHERE org_id = $1`,
            [orgId]
        );
        const totalRows = parseInt(countResult.rows[0]?.count || '0');

        return NextResponse.json({
            request_id: requestId,
            org_id: orgId,
            team_id: teamId || 'all',
            active_interpretations: result.rows.map(row => ({
                team_id: row.team_id,
                week_start: new Date(row.week_start).toISOString().slice(0, 10),
                input_hash: row.input_hash,
                model_id: row.model_id,
                prompt_version: row.prompt_version,
                created_at: row.created_at,
            })),
            stats: {
                total_rows: totalRows,
                cache_hits: stats.cacheHits,
                cache_misses: stats.cacheMisses,
                generations_success: stats.generationsSuccess,
                generations_failure: stats.generationsFailure,
            },
        });

    } catch (error: any) {
        console.error('[API] /internal/diag/interpretation failed:', error.message);
        return NextResponse.json(
            { error: 'Internal Server Error', code: 'INTERNAL_ERROR', request_id: requestId },
            { status: 500 }
        );
    }
}
