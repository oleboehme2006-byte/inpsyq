# RUNBOOK: Session API Production Verification

## Quick Validation Commands

### 1. Check Runtime Config
```bash
curl -s https://www.inpsyq.com/api/internal/runtime | jq '.runtime.session'
```

**Expected:**
```json
{
  "targetCount": 10,
  "adaptive": false,
  "forceCount": true
}
```

---

### 2. Test Invalid UUID Rejection
```bash
curl -i -X POST https://www.inpsyq.com/api/session/start \
  -H "Content-Type: application/json" \
  -d '{"userId": "not-a-valid-uuid|"}'
```

**Expected:**
- HTTP/2 400
- Response: `{"error":"userId must be a valid UUID","code":"INVALID_USERID","field":"userId","request_id":"..."}`

---

### 3. Start Valid Session
```bash
USER_ID="<your-valid-user-uuid>"
curl -i -X POST https://www.inpsyq.com/api/session/start \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_ID\"}"
```

**Expected:**
- HTTP/2 200
- `interactions` array with exactly 10 items
- `meta.target_count` = 10
- `meta.request_id` present

---

### 4. Submit Session
```bash
SESSION_ID="<session-id-from-start>"
USER_ID="<your-valid-user-uuid>"
curl -i -X POST https://www.inpsyq.com/api/session/submit \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_ID\", \"sessionId\": \"$SESSION_ID\", \"responses\": []}"
```

**Expected:**
- HTTP/2 200
- `{"ok": true, "request_id": "...", "duration_ms": ..., "processed": 0}`

---

### 5. Retrieve Diagnostic Entry
```bash
REQUEST_ID="<request_id-from-response>"
curl -s "https://www.inpsyq.com/api/internal/diag/session?request_id=$REQUEST_ID" | jq
```

---

## Automated Verification

```bash
# Local
npm run verify:llm_session

# Production
PROD_URL=https://www.inpsyq.com TEST_USER_ID=<uuid> npm run verify:prod_session
```

---

## Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| 400 with INVALID_USERID | UUID has trailing characters | Use clean UUID |
| 0 interactions | User doesn't exist | Use valid user from org |
| target_count=6 | Old code deployed | Deploy latest |
| meta=null | Old code | Deploy latest |
