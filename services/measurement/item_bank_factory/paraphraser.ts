
import { getOpenAIClient, LLM_CONFIG } from '../../llm/client';
import { Item } from './types';

// Strict Paraphrase Schema
const PARAPHRASE_SCHEMA = {
    type: "json_schema",
    json_schema: {
        name: "paraphrase_items",
        schema: {
            type: "object",
            properties: {
                paraphrases: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            original_id: { type: "string" },
                            new_prompt: { type: "string" }
                        },
                        required: ["original_id", "new_prompt"],
                        additionalProperties: false
                    }
                }
            },
            required: ["paraphrases"],
            additionalProperties: false
        },
        strict: true
    }
};

export async function paraphraseItems(items: Item[]): Promise<Item[]> {
    const openai = getOpenAIClient();
    if (!openai) {
        console.log("   [Paraphraser] No OpenAI Key. Skipping paraphrasing.");
        return [];
    }

    console.log(`   [Paraphraser] Paraphrasing batch of ${items.length} items...`);

    try {
        const batchPrompt = items.map(i => `ID: ${i.item_id}\nPrompt: "${i.prompt}"`).join('\n\n');

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Cost efficient
            messages: [
                { role: "system", content: "You are a psychometrician. Paraphrase the following survey items to create distinct but semantically equivalent variations. Keep same construct/meaning. Do not change time windows." },
                { role: "user", content: batchPrompt }
            ],
            // @ts-ignore
            response_format: PARAPHRASE_SCHEMA,
            temperature: 0.7
        });

        const content = completion.choices[0].message.content;
        if (!content) return [];

        const result = JSON.parse(content);
        const newItems: Item[] = [];

        for (const p of result.paraphrases) {
            const original = items.find(i => i.item_id === p.original_id);
            if (original) {
                // Clone and update
                newItems.push({
                    ...original,
                    item_id: `${original.item_id}_para_${Date.now().toString().slice(-4)}`, // Temp ID, will be hashed later
                    prompt: p.new_prompt,
                    source: 'llm_paraphrase',
                    created_at: new Date().toISOString()
                });
            }
        }

        return newItems;

    } catch (e) {
        console.error("   [Paraphraser] Error:", e);
        return [];
    }
}
