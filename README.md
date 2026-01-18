# InPsyq

Psychological measurement and interpretation platform for organizational health.

## Overview

InPsyq transforms employee survey responses into actionable insights for team leads and executives. The platform uses psychometrically validated measurement combined with rule-based decision support to provide:

- **Team Dashboards**: Health status, trends, risk drivers, and recommendations
- **Executive Dashboards**: Organization-wide health overview and systemic issues
- **Measurement Sessions**: Adaptive, evidence-based employee surveys

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL (Neon recommended)
- OpenAI API key

### Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development server
npm run dev
```

### Seed Test Data

```bash
# For local development
npm run seed:dev

# For production (requires INTERNAL_ADMIN_SECRET)
curl -X POST https://www.inpsyq.com/api/internal/admin/test-org/ensure \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET"
curl -X POST https://www.inpsyq.com/api/internal/admin/test-org/seed \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET" \
  -d '{"weeks": 6}'
```

## Architecture

```
User Input → Measurement → Aggregation → Decision Engine → Dashboard
```

- **Measurement Layer**: Psychometrically valid evidence extraction
- **Ontology Layer**: Organizational psychology theory (DAG)
- **Decision Layer**: Rule-based health scoring and recommendations
- **Governance Layer**: Safety flags and data quality gates

See [Architecture Documentation](docs/architecture/overview.md) for details.

## Documentation

### Architecture
- [System Overview](docs/architecture/overview.md)
- [Measurement Layer](docs/architecture/measurement-layer.md)
- [Dashboard Layer](docs/architecture/dashboard-layer.md)
- [Auth & Admin](docs/architecture/auth-and-admin.md)
- [Data Model](docs/architecture/data-model.md)

### Operations
- [Deployment](docs/operations/deployment.md)
- [Admin Operations](docs/operations/admin-operations.md)
- [Verification](docs/operations/verification.md)
- [Troubleshooting](docs/operations/troubleshooting.md)

### Security
- [Security Model](docs/security/security-model.md)

## Verification

```bash
# Before deployment
npx tsx scripts/verification/origin.verify.ts
npx tsx scripts/verification/email.verify.ts

# After seeding
BASE_URL=<url> INTERNAL_ADMIN_SECRET=<secret> \
  npx tsx scripts/verification/test-org.verify.ts
```

## Deployment

```bash
# Build
npm run build

# Deploy to production
git push origin production
```

See [Deployment Guide](docs/operations/deployment.md) for full instructions.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `AUTH_BASE_URL` | Prod | `https://www.inpsyq.com` |
| `RESEND_API_KEY` | Prod | Email sending |
| `INTERNAL_ADMIN_SECRET` | Prod | Admin API access |

## License

Proprietary. All rights reserved.
