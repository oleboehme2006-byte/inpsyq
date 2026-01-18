# Runbook: Phase 13 LLM Hardening

## Environment Variables
Ensure these are set in `.env.local` for LLM features (optional, defaults to disabled).

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `disabled` | Set to `openai` to enable LLM. |
| `OPENAI_API_KEY` | `(empty)` | Required if provider is openai. |
| `LLM_MODEL` | `gpt-4o-mini` | Model ID. |
| `LLM_TIMEOUT_MS` | `20000` | Max duration before timeout. |
| `LLM_MAX_TOKENS_TEAM` | `700` | Max output tokens per team generation. |
| `LLM_CONCURRENCY` | `2` | Max parallel LLM requests. |

## enabling LLM in Development
1. Add `LLM_PROVIDER=openai` and `OPENAI_API_KEY=sk-...` to `.env.local`.
2. Restart the dev server (`npm run dev`).
3. Run `npm run weekly:dev:run`.

## How to Verify
Run the full verification suite:
```bash
npm run verify:phase13
```

This runs:
1. **Contract Test**: Verifies deterministic fallback works when LLM is missing/fails.
2. **Security Test**: Verifies API endpoints are protected.
3. **Smoke Test**: runs a full weekly cycle and checks for generated interpretations.

## Troubleshooting

### LLM Generation Failed
Check application logs for `LLM Generation failed` or `LLM Failed, falling back to deterministic`.
- **Cause**: Invalid API Key? Rate Limits?
- **Action**: Check `OPENAI_API_KEY`. Check usage quotas.

### Fallback Used Unexpectedly
If `deterministic_fallback` is being used even with correct keys:
- **Cause**: Grounding validation failure or JSON parsing error.
- **Verification**: Check if the LLM output was valid JSON. The error log should contain the reason.

### Concurrency Issues
If the runner hangs:
- **Cause**: Semaphore deadlock (should verify `concurrencyLimiter` logic).
- **Action**: Restart server.
