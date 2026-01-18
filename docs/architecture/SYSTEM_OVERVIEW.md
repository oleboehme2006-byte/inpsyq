# System Overview

InPsyq is an organizational wellbeing intelligence platform that transforms psychometric measurement into actionable insights.

## Data Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Measurement │───▶│ Aggregation │───▶│ Attribution │───▶│Interpretation│───▶│ Dashboards  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 1. Measurement Layer (`lib/measurement/`)
[📄 Deep Dive: Measurement Engine](./MEASUREMENT_ENGINE.md)
- Weekly psychometric surveys
- Adaptive item selection based on response patterns
- Quality metrics (completion rate, response time, confidence)

### 2. Aggregation Layer (`lib/aggregation/`)
[📄 Deep Dive: Aggregation & Attribution](./AGGREGATION_AND_ATTRIBUTION.md)
- ISO week-based temporal aggregation (Monday start)
- Team and organization series builders
- Trend, volatility, and regime detection

### 3. Attribution Layer (`lib/attribution/`)
[📄 Deep Dive: Aggregation & Attribution](./AGGREGATION_AND_ATTRIBUTION.md)
- Causal driver analysis
- Internal vs external factor decomposition
- Propagation risk assessment

### 4. Interpretation Layer (`services/interpretation/`)
[📄 Deep Dive: Interpretation Engine](./INTERPRETATION_ENGINE.md)
- LLM-generated narrative insights
- Per-team and org-level interpretations
- Structured output (highlights, concerns, recommendations)

### 5. Dashboard Layer (`app/`)
- Role-based access (ADMIN, EXECUTIVE, TEAMLEAD, EMPLOYEE)
- Real-time data visualization
- Mock mode for development

## Key Invariants

1. **Measurement Uniqueness**: One session per user per week (`(user_id, week_start)` unique)
2. **Origin Enforcement**: Production magic links always use `https://www.inpsyq.com`
3. **Session Security**: 30-day absolute lifetime, 7-day idle timeout
4. **Test Org Isolation**: `TEST_ORG_ID = 99999999-9999-4999-8999-999999999999`

## Directory Structure

```
lib/
├── aggregation/     # Temporal series and trend computation
├── attribution/     # Causal driver analysis
├── auth/            # Session and token management
├── admin/           # Admin operations (test org seeding)
├── env/             # Environment and origin management
├── measurement/     # Psychometric data collection
└── security/        # Rate limiting, audit logging, privacy

services/
├── email/           # Email transport abstraction
├── interpretation/  # LLM interpretation service
└── ops/            # Monitoring and health checks

app/
├── (auth)/          # Authentication pages
├── (public)/        # Public pages (landing, legal)
├── admin/           # Admin UI
├── employee/        # Employee dashboards
├── team/            # Team lead dashboards
├── executive/       # Executive dashboards
└── api/             # API routes
```

## External Dependencies

| Service | Purpose |
|---------|---------|
| Neon PostgreSQL | Primary database |
| Vercel | Hosting and deployment |
| Resend | Transactional email |
| OpenAI | LLM interpretations |

## Configuration

See [`DEPLOYMENT.md`](../operations/DEPLOYMENT.md) for environment variable reference.
