# LLM Session Verification Guide

## 1. Environment Control
You can control the generated session length via environment variables:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `SESSION_QUESTION_COUNT` | `12` | Force exact number of questions. |
| `SESSION_ADAPTIVE` | `true` | If `true` and `QUESTION_COUNT` not set, adapts length based on user history (12 for new, 6 for stable). |

## 2. Verification Script
Run the verification script to test session generation and submission:

```bash
# Default (Adaptive Mode)
npm run verify:llm_session

# Forced Length Mode (Strict Check)
SESSION_QUESTION_COUNT=5 npm run verify:llm_session
```

## 3. Expected Behavior
- **Default**: Script logs "Adaptive Mode" and warns if count != 10 but passes.
- **Forced**: Script errors if count does not match `SESSION_QUESTION_COUNT`.
- **Submit**: Should return 200 OK. 500 errors are logged to server console with details.

## 4. Troubleshooting '500 Internal Server Error' on Submit
- Check server logs for `[API] /session/submit Failed:`.
- Common causes:
  - `prompt_text` missing `|||` delimiter for Choice types.
  - `normalizationService` failing to parse JSON metadata. (Fixed in patch 2025-12-18).
