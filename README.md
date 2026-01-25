# InPsyq

**Organizational Wellbeing Intelligence Platform**

InPsyq provides continuous psychological measurement and AI-driven interpretation for organizational health. It transforms weekly employee sentiment data into actionable insights for team leads and executives.

## Architecture

```
Measurement → Aggregation → Attribution → Interpretation → Dashboards
```

| Layer | Purpose |
|-------|---------|
| **Measurement** | Weekly psychometric surveys with adaptive item selection |
| **Aggregation** | Temporal series with trend, volatility, regime detection |
| **Attribution** | Causal driver analysis (internal vs external factors) |
| **Interpretation** | LLM-generated narrative insights per team/week |
| **Dashboards** | Role-based UIs for employees, team leads, executives |

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your database and API keys

# Run development server
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_BASE_URL` | Production | Canonical origin (e.g., `https://www.inpsyq.com`) |
| `EMAIL_PROVIDER` | Yes | `resend`, `test`, or `disabled` |
| `RESEND_API_KEY` | If resend | Email API key |
| `INTERNAL_ADMIN_SECRET` | Yes | Admin API authentication |

## Documentation

| Topic | Location |
|-------|----------|
| System Architecture | [`docs/architecture/`](docs/architecture/) |
| Security & Auth | [`docs/security/`](docs/security/) |
| Operations & Deployment | [`docs/operations/`](docs/operations/) |
| Local Development | [`docs/development/`](docs/development/) |
| Legal | [`docs/legal/`](docs/legal/) |

## Verification

```bash
# Build verification
npm run build
npm run lint

# Local verification scripts
npx tsx scripts/verification/origin.verify.ts
npx tsx scripts/verification/test-org.verify.ts
```

## Deployment

- **Staging**: Preview deployments on Vercel
- **Production**: `git push origin production`

See [`docs/operations/DEPLOYMENT.md`](docs/operations/DEPLOYMENT.md) for complete deployment guide.

## License

Proprietary. All rights reserved.
