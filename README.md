# InPsyQ

Social sentiment analysis platform for organizations.

## What is InPsyQ?

InPsyQ provides weekly measurement sessions for employees, generating team-level and organization-wide insights through LLM-powered interpretation. It enables teamleads and executives to understand team dynamics and sentiment trends.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your database URL and settings

# Start development server
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

## Documentation

| Topic | Location |
|-------|----------|
| **Architecture** | [docs/architecture/system-overview.md](docs/architecture/system-overview.md) |
| **Deployment** | [docs/operations/deployment.md](docs/operations/deployment.md) |
| **Monitoring** | [docs/operations/monitoring.md](docs/operations/monitoring.md) |
| **Test Org Seeding** | [docs/operations/test-org-seeding.md](docs/operations/test-org-seeding.md) |
| **Authentication** | [docs/security/authentication.md](docs/security/authentication.md) |
| **Authorization** | [docs/security/authorization.md](docs/security/authorization.md) |
| **Compliance** | [docs/security/compliance.md](docs/security/compliance.md) |
| **Local Development** | [docs/development/local-setup.md](docs/development/local-setup.md) |

## Verification

Run verification scripts to check system health:

```bash
# Authentication invariants
npx tsx scripts/verify/auth.verify.ts

# Email/magic link generation
npx tsx scripts/verify/email.verify.ts

# Test organization
BASE_URL=https://www.inpsyq.com INTERNAL_ADMIN_SECRET=... \
npx tsx scripts/verify/test-org.verify.ts

# Production smoke test
BASE_URL=https://www.inpsyq.com \
npx tsx scripts/verify/production-smoke.verify.ts
```

## Deployment

See [docs/operations/deployment.md](docs/operations/deployment.md) for the complete deployment guide.

Quick version:
```bash
# Merge to production and push
git checkout production
git merge main
git push origin production
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (Neon)
- **Email**: Resend
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Project Structure

```
├── app/                 # Next.js pages and API routes
├── components/          # React components
├── lib/                 # Core business logic
├── services/            # External service integrations
├── db/                  # Database client
├── scripts/
│   ├── verify/         # Verification scripts
│   ├── ops/            # Operational scripts
│   └── dev/            # Development helpers
└── docs/               # Documentation
```

## License

Proprietary. All rights reserved.
