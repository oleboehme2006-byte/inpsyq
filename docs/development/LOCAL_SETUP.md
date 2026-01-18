# Local Development Setup

## Prerequisites

- Node.js 20.x
- npm 10.x
- PostgreSQL database (local or Neon)
- Git

## Initial Setup

### 1. Clone Repository
```bash
git clone git@github.com:your-org/inpsyq.git
cd inpsyq
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment

Copy the example environment file:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:
```bash
# Database
DATABASE_URL=postgres://user:pass@host:5432/dbname

# Auth (for local development)
AUTH_BASE_URL=http://localhost:3000
EMAIL_PROVIDER=test

# Admin
INTERNAL_ADMIN_SECRET=dev-secret-change-in-prod
```

### 4. Initialize Database

Run migrations:
```bash
npx tsx scripts/migrate_phase23_auth.ts
```

### 5. Seed Development Data

```bash
npx tsx scripts/seed_dev.ts
```

This creates:
- Dev organizations with fixture IDs
- Dev users and memberships
- Sample measurement data

### 6. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`.

## Development Workflows

### Running the Dev Server
```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run lint         # ESLint
```

### Database Inspection
```bash
npx tsx scripts/debug_schema.ts      # Show table schemas
npx tsx scripts/debug_access.ts      # Check access patterns
```

### Testing Email Flow
```bash
# Emails written to artifacts/email_outbox/
EMAIL_PROVIDER=test npm run dev

# Check last magic link
cat artifacts/email_outbox/last_magic_link.json
```

## Mock Mode

For UI development without real data:
```bash
NEXT_PUBLIC_DASHBOARD_DEV_MOCKS=true npm run dev
```

Dashboards will show "MOCK DATA" badge and use synthetic data.

## Common Tasks

### Add Admin User
```bash
npx tsx scripts/promote_dev_user.ts --email=you@example.com
```

### Rebuild Aggregates
```bash
npx tsx scripts/rebuild_aggregates_dev.ts
```

### Rebuild Interpretations
```bash
npx tsx scripts/rebuild_weekly_interpretations_dev.ts
```

### Simulate Sessions
```bash
npx tsx scripts/simulate_sessions_dev.ts
```

## Verification

Before pushing changes:
```bash
npm run build
npm run lint
npx tsx scripts/verification/origin.verify.ts
```

## Troubleshooting

### Database Connection Failed
- Check `DATABASE_URL` format
- Ensure database is running
- Check network/firewall

### Build Fails
- Delete `.next/` folder
- Run `npm ci` to reinstall
- Check for TypeScript errors

### Magic Link Not Received
- Check `EMAIL_PROVIDER=test`
- Check `artifacts/email_outbox/last_magic_link.json`

## IDE Setup

### VSCode Extensions
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin

### Settings
```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```
