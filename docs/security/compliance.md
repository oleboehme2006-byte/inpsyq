# Compliance & Privacy

## Overview

InPsyQ processes employee sentiment data and must comply with GDPR and related regulations.

---

## Data Classification

| Category | Data Types | Retention |
|----------|-----------|-----------|
| Personal | Email, name, IP | Until account deletion |
| Measurement | Responses, scores | 2 years |
| Aggregated | Team/org statistics | 5 years |
| Audit | Security events | 5 years |

---

## GDPR Compliance

### Lawful Basis

Data processing is based on:
1. **Contract**: Employment relationship via organization
2. **Legitimate interest**: Organizational improvement

### Data Subject Rights

| Right | Implementation |
|-------|----------------|
| Access | Admin can export user data |
| Rectification | Admin can update user info |
| Erasure | Soft-delete with purge option |
| Portability | JSON export available |

---

## Data Processing Agreement (DPA)

A template DPA is available at `docs/legal/DPA.md`.

Key terms:
- InPsyQ acts as **Data Processor**
- Customer is **Data Controller**
- Sub-processors must be disclosed
- 72-hour breach notification

---

## Retention Policies

### Automatic Retention

Configure via environment or admin settings:

```bash
DATA_RETENTION_DAYS=730  # 2 years
AUDIT_RETENTION_DAYS=1825  # 5 years
```

### Retention API

```bash
# Check retention plan (dry run)
curl https://www.inpsyq.com/api/admin/system/retention/plan \
  -H "Authorization: Bearer $SECRET"

# Apply retention
curl -X POST https://www.inpsyq.com/api/admin/system/retention/apply \
  -H "Authorization: Bearer $SECRET"
```

---

## Privacy Operations

### User Soft-Delete

Marks user as deleted, anonymizes PII, but retains aggregated data:

```typescript
import { softDeleteUser } from '@/lib/security/privacy';
await softDeleteUser(userId);
```

### Organization Data Purge

Completely removes all organization data:

```typescript
import { purgeOrgData } from '@/lib/security/privacy';
await purgeOrgData(orgId);
```

---

## Audit Logging

Security-relevant events are logged:

| Event | Data Captured |
|-------|---------------|
| Login success | User ID, IP, timestamp |
| Login failure | Email, IP, reason |
| Role change | Admin ID, user ID, old/new role |
| Data export | Admin ID, scope |
| Data deletion | Admin ID, scope |

### Query Audit Logs

```typescript
import { querySecurityLogs } from '@/lib/security/auditLog';
const logs = await querySecurityLogs({ userId, after, before });
```

---

## Security Contacts

| Purpose | Contact |
|---------|---------|
| Security issues | security@inpsyq.com |
| Privacy requests | privacy@inpsyq.com |
| DPA inquiries | legal@inpsyq.com |
