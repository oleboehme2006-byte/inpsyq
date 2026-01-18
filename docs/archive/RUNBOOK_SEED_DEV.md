# RUNBOOK: Dev Seeding

## Quick Start

```bash
# 1. Seed test data
npm run seed:dev

# 2. Get IDs
npm run ids

# 3. Test dashboard
IDS=$(curl -s http://localhost:3001/api/internal/ids)
ORG=$(echo $IDS | jq -r '.orgId')
TEAM=$(echo $IDS | jq -r '.teamId')
curl -s "http://localhost:3001/api/admin/team-dashboard?org_id=$ORG&team_id=$TEAM" | jq '.meta'
```

---

## Schema Reference

| Table | Primary Key | References |
|-------|-------------|------------|
| `orgs` | `org_id` | — |
| `teams` | `team_id` | `orgs.org_id` |
| `users` | `user_id` | `orgs.org_id`, `teams.team_id` |

---

## Expected Output

### `npm run seed:dev`
```
=== Development Seed ===

Creating organization...
Creating teams...
Creating users...

=== Seed Complete ===

IDs for testing:

  ORG_ID=<uuid>
  TEAM_ID=<uuid>
  USER_ID=<uuid>
```

### `npm run ids`
```json
{
  "orgId": "<uuid>",
  "teamId": "<uuid>",
  "userId": "<uuid>",
  "counts": { "orgs": 1, "teams": 2, "users": 10 },
  "source": "db"
}
```

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `DATABASE_URL missing` | No .env.local | Create .env.local with DATABASE_URL |
| `NO_DATA` | Empty DB | Run `npm run seed:dev` |
| `column does not exist` | Schema mismatch | Table is `orgs` not `organizations` |
