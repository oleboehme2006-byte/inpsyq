
import './_bootstrap';
import { query } from '@/db/client';

async function createUsageTable() {
    console.log('--- Creating interpretation_usage table ---');

    await query(`
        CREATE TABLE IF NOT EXISTS interpretation_usage (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            org_id TEXT NOT NULL,
            team_id TEXT, -- NULL for org-level
            week_start DATE NOT NULL,
            input_hash TEXT NOT NULL,
            
            -- Usage Metrics
            model_id TEXT NOT NULL,
            prompt_tokens INTEGER DEFAULT 0,
            completion_tokens INTEGER DEFAULT 0,
            total_tokens INTEGER DEFAULT 0,
            latency_ms INTEGER DEFAULT 0,
            
            -- Metadata
            provider TEXT NOT NULL, -- 'openai', 'anthropic', etc.
            is_fallback BOOLEAN DEFAULT false,
            
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Index for aggregation by org/date
        CREATE INDEX IF NOT EXISTS idx_interpretation_usage_org_date 
        ON interpretation_usage(org_id, created_at);

        -- Index for team lookups
        CREATE INDEX IF NOT EXISTS idx_interpretation_usage_team_date 
        ON interpretation_usage(org_id, team_id, created_at);
    `);

    console.log('✓ interpretation_usage table created');
}

createUsageTable().catch(e => {
    console.error(e);
    process.exit(1);
});
