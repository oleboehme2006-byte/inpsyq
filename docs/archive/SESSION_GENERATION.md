# Session Generation Configuration

The Employee Session (`/session`) now uses OpenAI to generate dynamic, psychologically valid question sets (default: 10).

## Configuration

| Env Variable | Default | Description |
| :--- | :--- | :--- |
| `SESSION_QUESTION_COUNT` | `10` | Number of questions to generate per session. |
| `OPENAI_API_KEY` | Required | If missing, falls back to legacy 3-question logic. |
| `OPENAI_MODEL` | `gpt-5-mini` | Model used for generation and interpretation. |

## Feature: Dynamic Choice Options
Choice interactions now have their options generated dynamically to match the specific question context.
- **Old way:** Fixed "Positive/Negative" (often mismatched).
- **New way:** Context-aware options (e.g., "Very Clear", "Ambiguous", etc.).
- **Mechanism:** Options are embedded in `prompt_text` invisible to the user using the `|||` delimiter, parsed by the UI.

## Verification
You can verify LLM usage by:
1. **Dev UI:** Look for the `LLM: OPENAI` badge in the bottom-right corner of the session screen (Dev mode only).
2. **Server Logs:** Look for `[LLM] used=true generated=10`.
3. **Script:** Run `npm run verify:llm_session` (ensure port 3001 is used).
