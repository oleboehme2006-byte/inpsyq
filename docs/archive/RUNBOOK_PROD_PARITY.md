# RUNBOOK: Production Parity Validation

## Quick Validation Commands

### 1. Check Runtime Config (No Auth Required)
```bash
curl -s https://www.inpsyq.com/api/internal/runtime | jq '.runtime.session'
```

**Expected:**
```json
{
  "targetCount": 10,
  "adaptive": false,
  "forceCount": true,
  "minCount": 6,
  "maxCount": 15
}
```

### 2. Start Session (Requires Valid User ID)
```bash
USER_ID="<your-user-uuid>"
curl -s -X POST https://www.inpsyq.com/api/session/start \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_ID\"}" | jq '{
    interactions: .interactions | length,
    target_count: .meta.target_count,
    padded: .meta.padded,
    selector_mode: .meta.selector_mode
  }'
```

**Expected:**
```json
{
  "interactions": 10,
  "target_count": 10,
  "padded": true/false,
  "selector_mode": "llm" or "contextual"
}
```

### 3. Submit Session (After Start)
```bash
SESSION_ID="<session-id-from-start>"
USER_ID="<your-user-uuid>"
# Build responses array (simplified example)
curl -s -X POST https://www.inpsyq.com/api/session/submit \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_ID\", \"sessionId\": \"$SESSION_ID\", \"responses\": []}"
```

**Expected:** `{ "ok": true, ... }`

### 4. Check Teamlead Brief
```bash
TEAM_ID="<your-team-uuid>"
curl -s "https://www.inpsyq.com/api/admin/brief?team_id=$TEAM_ID" | jq '.brief_mode'
```

**Expected:** `"openai"` or `"fallback"`

---

## Automated Verification

```bash
# Local
npm run verify:llm_session

# Production (set TEST_USER_ID if you have one)
PROD_URL=https://www.inpsyq.com npm run verify:prod_parity
```

---

## Root Cause Summary

**Problem:** Production returned `target_count=6` instead of 10.

**Cause:** `interactionEngine.ts` line 80 set `targetCount = 6` when:
- `SESSION_ADAPTIVE !== 'false'` (default: `true`)
- User had >50 history items

**Fix:** Created canonical config resolver with:
- `ADAPTIVE_DEFAULT = false`
- `TARGET_COUNT_DEFAULT = 10`
- Adaptive only affects item selection, NEVER count
