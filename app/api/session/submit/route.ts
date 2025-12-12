import { NextResponse } from 'next/server';
import { query } from '@/db/client';
import { encoderService } from '@/services/encoderService';
import { inferenceEngine } from '@/services/inferenceService';

export async function POST(req: Request) {
    try {
        const { sessionId, interactionId, responseText, userId } = await req.json();

        if (!sessionId || !interactionId || !responseText) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Save Raw Response
        const responseRes = await query(`
        INSERT INTO responses (session_id, interaction_id, raw_input, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING response_id
    `, [sessionId, interactionId, responseText]);

        const responseId = responseRes.rows[0].response_id;

        // 2. Encode
        const encoded = await encoderService.encode(responseText);

        // 3. Save Encoded Signals
        await query(`
        INSERT INTO encoded_signals (response_id, signals, uncertainty, confidence, flags, topics)
        VALUES ($1, $2, $3, $4, $5, $6)
    `, [responseId, encoded.signals, encoded.uncertainty, encoded.confidence, encoded.flags, encoded.topics]);

        // 4. Update Inference (Bayesian)
        // Need interaction targets
        const interaction = await query(`SELECT parameter_targets FROM interactions WHERE interaction_id = $1`, [interactionId]);
        if (interaction.rows.length > 0) {
            const targets = interaction.rows[0].parameter_targets as string[];
            for (const target of targets) {
                // Use specific signal for this target if available, or heuristic
                // Mock encoder returns signals for ALL params currently
                // We should use the one relevant to the target

                // Cast strictly for TS if needed, but 'target' is string key
                const signalValue = encoded.signals[target as any];
                const uncertaintyValue = encoded.uncertainty[target as any];

                if (signalValue !== undefined) {
                    await inferenceEngine.updateState(
                        userId,
                        signalValue,
                        uncertaintyValue,
                        target as any,
                        encoded.confidence,
                        encoded.flags.nonsense
                    );
                }
            }
        }

        // 5. Close Session
        const duration = 60; // Mock duration
        await query(`
        UPDATE sessions 
        SET completed_at = NOW(), duration_seconds = $2
        WHERE session_id = $1
    `, [sessionId, duration]);

        return NextResponse.json({ success: true, analysis: encoded });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
