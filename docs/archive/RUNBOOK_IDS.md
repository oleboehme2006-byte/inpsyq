# RUNBOOK: ID Discovery

## Quick Start

```bash
# 1. Seed dev data (if empty)
npm run seed:dev

# 2. Get IDs
npm run ids
```

---

## Local Usage

```bash
# Get IDs
curl -s http://localhost:3001/api/internal/ids | jq

# Response:
{
  "orgId": "<uuid>",
  "teamId": "<uuid>",
  "userId": "<uuid>",
  "counts": { "orgs": N, "teams": N, "users": N },
  "source": "db"
}
```

---

## Using IDs with Dashboards

```bash
# Get IDs and store
IDS=$(curl -s http://localhost:3001/api/internal/ids)
ORG_ID=$(echo $IDS | jq -r '.orgId')
TEAM_ID=$(echo $IDS | jq -r '.teamId')

# Call team dashboard
curl -s "http://localhost:3001/api/admin/team-dashboard?org_id=$ORG_ID&team_id=$TEAM_ID" | jq

# Call executive dashboard
curl -s "http://localhost:3001/api/admin/executive-dashboard?org_id=$ORG_ID" | jq
```

---

## Production Usage

```bash
# Requires secret
export INTERNAL_ADMIN_SECRET="your-secret"
curl -s -H "x-inpsyq-admin-secret: $INTERNAL_ADMIN_SECRET" \
  https://www.inpsyq.com/api/internal/ids | jq
```

---

## Fallback Behavior

If `organizations` table is empty, endpoint tries:
1. `team.org_id` from teams table
2. `user.org_id` from users table

Warning field indicates source:
- `ORG_FROM_TEAM` — org_id from team row
- `ORG_FROM_USER` — org_id from user row
- `ORG_MISSING_IN_DB` — no org_id found anywhere

---

## Error Codes

| Code | Meaning |
|------|---------|
| `NO_DATA` | No teams AND no users |
| `UNAUTHORIZED` | Production: missing secret |
| `DB_ERROR` | Connection failed |
