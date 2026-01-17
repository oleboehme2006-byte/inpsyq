# Local Development Setup

## Prerequisites

- Node.js v18+
- npm
- PostgreSQL (or Neon account)

---

## Quick Start

```bash
# 1. Clone repository
git clone <repo-url>
cd inpsyq

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env.local
# Edit .env.local with your values

# 4. Start development server
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

---

## Environment Variables

### Required

```bash
# Database
DATABASE_URL=postgresql://...

# Auth (for local testing)
EMAIL_PROVIDER=test
AUTH_BASE_URL=http://localhost:3001
```

### Optional

```bash
# Analytics
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=...

# Real email (switch from test)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...
```

---

## Development Fixtures

Bootstrap development fixtures:

```bash
npx tsx scripts/dev/bootstrap.ts
```

This creates:
- Test organization
- Admin user
- Sample teams
- Fixture employees

---

## Test Transport (Email)

When `EMAIL_PROVIDER=test`, emails are written to:

```
artifacts/email_outbox/last_magic_link.json
```

This allows testing magic links without sending real emails.

---

## Simulate Sessions

Generate fake measurement data:

```bash
npx tsx scripts/dev/simulate-sessions.ts
```

---

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run verify:all` | Run all verification scripts |

---

## Directory Structure

```
├── app/                 # Next.js pages and API routes
├── components/          # React components
├── lib/                 # Core business logic
├── services/            # External service integrations
├── db/                  # Database client
├── scripts/             # Operational and dev scripts
│   ├── dev/            # Development helpers
│   ├── ops/            # Operational scripts
│   └── verify/         # Verification scripts
└── docs/               # Documentation
```

---

## Debugging

### Check Auth Origin

```bash
npx tsx scripts/verify/auth.verify.ts
```

### View Database Schema

```bash
npx tsx scripts/debug_schema.ts
```

### Inspect Environment

The dev server logs environment info at startup.
