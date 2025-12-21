# RUNBOOK: System Verification (Final)

## Quick Start

```bash
# 1. Seed development data
npm run seed:dev

# 2. Get IDs
npm run ids

# 3. Test session
curl -s http://localhost:3001/api/session/start \
  -X POST -H "Content-Type: application/json" \
  -d '{"userId":"<userId from step 2>"}' | jq '.meta'
```

---

## Full Verification Flow

### 1. Seed Dev Data
```bash
npm run seed:dev
```

Creates: 1 org, 2 teams, 10 users.

### 2. Get IDs
```bash
npm run ids
# or
curl -s http://localhost:3001/api/internal/ids | jq
```

### 3. Test Session Start
```bash
USER_ID=$(curl -s http://localhost:3001/api/internal/ids | jq -r '.userId')

curl -s http://localhost:3001/api/session/start \
  -X POST -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\"}" | jq '{
    count: .interactions | length,
    target: .meta.target_count,
    actual: .meta.actual_count,
    padded: .meta.padded
  }'
```

Expected:
- `count` = `target` = `actual` = 10
- `padded` = false (or true if padding was needed)

### 4. Test Dashboard
```bash
IDS=$(curl -s http://localhost:3001/api/internal/ids)
ORG=$(echo $IDS | jq -r '.orgId')
TEAM=$(echo $IDS | jq -r '.teamId')

curl -s "http://localhost:3001/api/admin/team-dashboard?org_id=$ORG&team_id=$TEAM" | jq '.meta'
```

### 5. Browser Test
1. Open http://localhost:3001/admin/teamlead
2. Enter org/team IDs from step 2
3. Verify 4 index panels render with uncertainty halos

### 6. Parity Check
```bash
npm run verify:parity
```

---

## Invariants (Must Hold)

| Check | Expected |
|-------|----------|
| `interactions.length` | = `meta.target_count` |
| `meta.actual_count` | = `meta.target_count` |
| Session count | 10 (default) |
| Governance blocked | No (with seeded data) |

---

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `seed:dev` | Create local test data |
| `ids` | Get org/team/user UUIDs |
| `verify:parity` | Compare dev vs prod |
| `verify:dashboard` | Test dashboard endpoints |
| `verify:llm_session` | Test session generation |

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| DATABASE_URL missing | .env.local not found | Create .env.local with DATABASE_URL |
| NO_DATA | Empty DB | Run `npm run seed:dev` |
| created_at column | Old query | Queries now use LIMIT 1 without ORDER BY |
| 6 items instead of 10 | Adaptive bug | Fixed: adaptive never reduces count |
