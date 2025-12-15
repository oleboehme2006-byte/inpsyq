# LLM Diagnosis Guide

This guide explains how to debug and verify LLM (OpenAI) usage in local and production environments.

## Quick Check

Run the verification script locally (requires `npm run dev` running on port 3001):
```bash
npm run verify:llm_session
```

### Expected Output (Healthy)
```
LLM Used: true
Question Count: 10
```

### Expected Output (Fallback/Error)
```
LLM Used: false
LLM Error: {
  "reason": "openai_error",
  "code": "401", 
  "messageSafe": "Incorrect API key provided..."
}
```

## Failure Modes

| Error Reason | Cause | Fix |
| :--- | :--- | :--- |
| `missing_key` | `OPENAI_API_KEY` is not set. | Check `.env.local` or Vercel Env Vars. |
| `openai_error` | API Key invalid, Quota exceeded, or Model not found. | Check code (401/403/404) and `OPENAI_MODEL` setting. |
| `max_retries_exceeded` | Generator produced duplicates or invalid JSON 3 times. | Check prompts or model capabilities. |
| `fallback` | Generic logic fallback (rare). | Check `InteractionEngine` logs. |

## Configuration

| Env Variable | Default | Description |
| :--- | :--- | :--- |
| `OPENAI_MODEL` | `gpt-5-mini` | The model ID to use. |
| `SESSION_QUESTION_COUNT` | `10` | Number of questions to generate. |

## Logs

In `npm run dev` or Vercel logs, look for:
- `[InteractionEngine] Using Legacy Fallback Error: ...`
- `[LLM] Generator Error: ...`
