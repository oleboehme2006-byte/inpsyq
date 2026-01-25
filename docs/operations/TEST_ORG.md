# Test Organization & Verification

The "InPsyq Demo Org" is a dedicated organization used for verification, local development, and end-to-end testing.

## Identity Policy (Deterministic)
All entities within the Test Org are generated using **Stable UUIDs** (UUIDv5-like hash) to ensure idempotency and stable IDs across environment resets.

- **Namespace**: `getStableUUID(namespace, key)`
- **Org ID**: `99999999-9999-4999-8999-999999999999` (Fixed)
- **Teams**: Derived from `team:${name}` (e.g., "Engineering", "Product").
- **Users**: Derived from `user:${email}`.
- **Sessions**: Derived from `session:${user_id}:${week_start}`.
- **Alerts**: Derived from `alert:${week_start}:${type}`.

## Seeding
The seeding script (`lib/admin/seedTestOrg.ts`) is safe to run repeatedly. It employs:
1. **Cascade Deletes**: Removes old test data safely before re-seeding if structure changes.
2. **Idempotency**: Using stable IDs, it ensures `INSERT ON CONFLICT DO UPDATE/NOTHING` behaviors result in a zero-diff state on subsequent runs.
3. **Depth**: Defaults to 12 weeks of historical data.

## Verification
We use a **Unified Runner** on localhost to verify the entire stack:

```bash
npx tsx scripts/verification/run.local.ts
```

This script:
1. **Builds** the application (`next build`).
2. **Seeds** the Test Org (Pass 1).
3. **Re-Seeds** (Pass 2) to prove Idempotency (snapshots must match).
4. **Starts** the production server locally.
5. **Verifies Auth Flow**: Mints a login link, consumes it, and checks Session Cookie.
6. **Verifies Org Context**: Selects the Test Org and verifies Admin API access.
