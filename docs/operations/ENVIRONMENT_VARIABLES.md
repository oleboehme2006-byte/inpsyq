# Environment Variables

Authoritative registry of all environment variables used by InPsyq.

## Required (All Environments)

| Variable | Type | Description |
|----------|------|-------------|
| `DATABASE_URL` | String | PostgreSQL connection string |
| `INTERNAL_ADMIN_SECRET` | String | Bearer token for internal admin APIs |

## Authentication

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_BASE_URL` | Production | Canonical origin (must be `https://www.inpsyq.com` in prod) |
| `SESSION_SECRET` | Recommended | Session signing secret (defaults to random if not set) |

## Email

| Variable | Values | Description |
|----------|--------|-------------|
| `EMAIL_PROVIDER` | `resend`, `test`, `disabled` | Email transport selection |
| `RESEND_API_KEY` | String | Resend API key (required if provider=resend) |
| `EMAIL_FROM` | Email | Sender address |

## Environment Detection

| Variable | Values | Description |
|----------|--------|-------------|
| `VERCEL_ENV` | `production`, `preview`, `development` | Vercel deployment environment |
| `NODE_ENV` | `production`, `development` | Node.js environment |
| `APP_ENV` | `production`, `staging`, `development` | Application environment |
| `NEXT_PUBLIC_APP_ENV` | Same as APP_ENV | Client-side environment |

## Feature Flags

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_DASHBOARD_DEV_MOCKS` | `false` | Enable mock data in dashboards |

## External Services

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | For interpretations | OpenAI API key |
| `SLACK_WEBHOOK_URL` | Optional | Slack alerting webhook |

## Analytics

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Optional | Plausible analytics domain |

## Vercel-Specific

| Variable | Auto-set | Description |
|----------|----------|-------------|
| `VERCEL_URL` | Yes | Preview deployment URL |
| `VERCEL_GIT_COMMIT_SHA` | Yes | Git commit hash |
| `VERCEL_GIT_COMMIT_REF` | Yes | Git branch name |

## Environment Configurations

### Production
```bash
DATABASE_URL=postgres://...
AUTH_BASE_URL=https://www.inpsyq.com
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...
INTERNAL_ADMIN_SECRET=<secret>
APP_ENV=production
```

### Staging/Preview
```bash
DATABASE_URL=postgres://...
EMAIL_PROVIDER=disabled
INTERNAL_ADMIN_SECRET=<secret>
APP_ENV=staging
```

### Development
```bash
DATABASE_URL=postgres://...
AUTH_BASE_URL=http://localhost:3000
EMAIL_PROVIDER=test
INTERNAL_ADMIN_SECRET=dev-secret
```

## Validation

Origin enforcement:
- Production requires `AUTH_BASE_URL=https://www.inpsyq.com`
- Any deviation throws `ORIGIN_MISCONFIGURED` error

Email suppression:
- Preview/staging environments never send real emails
- Test transport writes to `artifacts/email_outbox/`
