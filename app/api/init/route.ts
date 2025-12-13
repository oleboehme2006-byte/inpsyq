import { NextResponse } from 'next/server';
import { query } from '@/db/client';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const schemaPath = path.join(process.cwd(), 'db', 'schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        // Split by semicolon to run statements? 
        // pg driver might support multi-statement query depending on config, but usually yes.
        // simpler to just run it.

        await query(sql);

        return NextResponse.json({ success: true, message: 'Schema initialized' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
