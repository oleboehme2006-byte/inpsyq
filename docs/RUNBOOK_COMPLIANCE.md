# Compliance Runbook

## Legal Pages

| Page | URL | Purpose |
|------|-----|---------|
| Privacy | `/privacy` | Data processing disclosure |
| Imprint | `/imprint` | EU legal identification |
| Terms | `/terms` | B2B service terms |

## Data Roles

- **Customer**: Data Controller (determines purpose)
- **InPsyq**: Data Processor (follows instructions)

## Data Retention

| Data Type | Retention | Defined In |
|-----------|-----------|------------|
| Session responses | 12 months | `lib/compliance/retention.ts` |
| Aggregates | Indefinite | Non-identifiable |
| Invites | 72 hours | Auto-expire |
| Audit logs | 24 months | `lib/compliance/retention.ts` |

## Subprocessors

| Provider | Purpose | Location |
|----------|---------|----------|
| Vercel | Hosting | USA (EU region) |
| Neon | Database | EU Frankfurt |
| OpenAI | LLM (optional) | USA |

## Data Subject Requests

1. Customer receives request from employee
2. Customer forwards to InPsyq via support
3. InPsyq responds within 15 business days
4. Customer fulfills request

## DPA Execution

1. Customer signs `docs/DPA.md` template
2. Both parties retain copies
3. Update subprocessor list with 30 days notice

## Verification

```bash
# Check pages load
curl -s https://app.inpsyq.com/privacy | head -20
curl -s https://app.inpsyq.com/imprint | head -20
curl -s https://app.inpsyq.com/terms | head -20
```
