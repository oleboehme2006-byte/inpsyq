# Phase 31: Security, Privacy & Ops Hardening

## Overview
Enterprise-grade security, privacy controls, and operational observability.

## Part A: Security & Abuse Hardening

### Rate Limiting (`lib/security/rateLimit.ts`)
| Endpoint | Limit | Block Time |
|----------|-------|------------|
| `/api/auth/request-link` | 5/min | 5 min |
| `/api/auth/consume` | 10/min | 5 min |
| Admin mutations | 20/min | 1 min |
| Destructive actions | 3/10min | 10 min |

Features:
- Sliding window algorithm
- Per-IP + per-identity isolation
- Clear JSON errors on limit exceeded

### Session Hardening (`lib/security/session.ts`)
| Limit | Value |
|-------|-------|
| Absolute lifetime | 30 days |
| Idle timeout | 7 days |
| Fresh session (for destructive ops) | 10 minutes |

## Part B: Privacy & GDPR

### User Soft-Delete (`lib/security/privacy.ts`)
- Marks `deleted_at` timestamp
- Revokes all sessions
- Prevents future login
- Preserves historical aggregates

### Org Data Erasure
- Dry-run mode available
- Deletes: sessions, invites, memberships
- Audit logged

## Part C: Audit Logging

### Actions Logged (`lib/security/auditLog.ts`)
- LOGIN_SUCCESS / LOGIN_FAILURE
- SESSION_CREATED / SESSION_REVOKED
- ROLE_CHANGED
- INVITE_CREATED / INVITE_REVOKED / INVITE_ACCEPTED
- WEEKLY_RUN_STARTED / WEEKLY_RUN_COMPLETED / WEEKLY_RUN_FAILED
- USER_DELETED
- ORG_PURGE_STARTED / ORG_PURGE_COMPLETED
- RATE_LIMIT_EXCEEDED
- REAUTH_REQUIRED

Each entry includes:
- actor_user_id
- org_id
- action
- timestamp
- metadata (JSON)

## Part D: Observability

### System Health (`/api/internal/health/system`)
Returns:
- DB connectivity + latency
- Pipeline freshness
- Interpretation coverage
- Stuck locks count

Requires `INTERNAL_ADMIN_SECRET`.

## Verification

```bash
npm run build
npm run lint

# Security tests (no server needed)
npx tsx scripts/verify_phase31_security.ts

# Ops tests (requires server)
INTERNAL_ADMIN_SECRET=xxx npx tsx scripts/verify_phase31_ops.ts
```

## Files Added
- `lib/security/rateLimit.ts`
- `lib/security/session.ts`
- `lib/security/auditLog.ts`
- `lib/security/privacy.ts`
- `app/api/internal/health/system/route.ts`
- `scripts/verify_phase31_security.ts`
- `scripts/verify_phase31_ops.ts`
