# Privacy Runbook

## GDPR Data Subject Rights

### Right to Erasure (Art. 17)

**User Deletion:**
1. Admin calls soft-delete via API
2. User's `deleted_at` is set
3. All sessions revoked
4. User cannot login
5. Historical aggregates preserved (anonymized)

**API:**
```
POST /api/admin/users/delete
Body: { "user_id": "target-user-id" }
```

### Right to Access (Art. 15)

Data export should include:
- User profile
- Session history
- Response data (within retention)

### Right to Portability (Art. 20)

Same as access, exported in JSON format.

## Org Data Erasure

**WARNING: Irreversible**

1. Always run dry-run first
2. Verify counts are as expected
3. Execute real purge only with explicit confirmation

**Dry Run:**
```
POST /api/admin/org/purge
Body: { "dry_run": true }
```

## Data Retention

| Data Type | Retention | Enforcement |
|-----------|-----------|-------------|
| Session responses | 12 months | Cleanup job |
| Aggregates | Indefinite | N/A |
| Invites | 72 hours | Auto-expire |
| Audit logs | 24 months | Cleanup job |

### Verification
```bash
npx tsx scripts/verify_retention_cleanup.ts
```

## Subprocessors

All listed in `/privacy` page.
Change requires 30-day notice to customers.
