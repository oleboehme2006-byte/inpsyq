/**
 * GET /api/internal/diag/db-schema
 * 
 * Schema diagnostic endpoint.
 * Returns column info, primary keys, and foreign keys for a table.
 * Requires INTERNAL_ADMIN_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/db/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // Verify secret
    const authHeader = req.headers.get('authorization');
    const expected = process.env.INTERNAL_ADMIN_SECRET;

    if (!expected || authHeader !== `Bearer ${expected}`) {
        return NextResponse.json(
            { ok: false, error: 'Unauthorized' },
            { status: 401 }
        );
    }

    const tableName = req.nextUrl.searchParams.get('table');

    if (!tableName) {
        return NextResponse.json(
            { ok: false, error: 'Missing table parameter' },
            { status: 400 }
        );
    }

    // Validate table name (prevent SQL injection via simple allowlist)
    const validTablePattern = /^[a-z_][a-z0-9_]*$/i;
    if (!validTablePattern.test(tableName)) {
        return NextResponse.json(
            { ok: false, error: 'Invalid table name format' },
            { status: 400 }
        );
    }

    try {
        // Get column information
        const columnsResult = await query(`
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default,
                character_maximum_length
            FROM information_schema.columns
            WHERE table_name = $1
            AND table_schema = 'public'
            ORDER BY ordinal_position
        `, [tableName]);

        if (columnsResult.rows.length === 0) {
            return NextResponse.json({
                ok: false,
                error: `Table '${tableName}' not found or has no columns`,
                hint: 'Check table name spelling. Common tables: orgs, teams, users, memberships'
            });
        }

        // Get primary key columns
        const pkResult = await query(`
            SELECT a.attname as column_name
            FROM pg_index i
            JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
            JOIN pg_class c ON c.oid = i.indrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = $1
            AND n.nspname = 'public'
            AND i.indisprimary
        `, [tableName]);

        // Get foreign keys
        const fkResult = await query(`
            SELECT
                tc.constraint_name as fk_name,
                kcu.column_name as column_name,
                ccu.table_name as references_table,
                ccu.column_name as references_column
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = $1
            AND tc.table_schema = 'public'
        `, [tableName]);

        // Get unique constraints
        const uniqueResult = await query(`
            SELECT
                tc.constraint_name,
                array_agg(kcu.column_name ORDER BY kcu.ordinal_position) as columns
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'UNIQUE'
            AND tc.table_name = $1
            AND tc.table_schema = 'public'
            GROUP BY tc.constraint_name
        `, [tableName]);

        return NextResponse.json({
            ok: true,
            table: tableName,
            columns: columnsResult.rows.map(col => ({
                name: col.column_name,
                type: col.data_type,
                nullable: col.is_nullable === 'YES',
                default: col.column_default,
                maxLength: col.character_maximum_length,
            })),
            primaryKey: pkResult.rows.map(r => r.column_name),
            foreignKeys: fkResult.rows.map(fk => ({
                name: fk.fk_name,
                column: fk.column_name,
                referencesTable: fk.references_table,
                referencesColumn: fk.references_column,
            })),
            uniqueConstraints: uniqueResult.rows.map(u => ({
                name: u.constraint_name,
                columns: u.columns,
            })),
        });

    } catch (e: any) {
        console.error('[Schema Diag] Error:', e.message);
        return NextResponse.json(
            { ok: false, error: 'Failed to fetch schema', details: e.message },
            { status: 500 }
        );
    }
}
