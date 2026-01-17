# System Architecture

## Overview

InPsyQ is a social sentiment analysis platform for organizations. It provides:
- **Weekly measurement sessions** for employees
- **Team-level dashboards** for teamleads
- **Executive dashboards** for org-wide insights
- **Admin tools** for organization management

## Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js App                            │
├──────────────┬──────────────┬──────────────┬───────────────┤
│   Public     │    Auth      │  Protected   │    Admin      │
│  (landing)   │ (magic-link) │ (dashboards) │  (internal)   │
└──────────────┴──────────────┴──────────────┴───────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Routes                               │
│  /api/auth/*  /api/employee/*  /api/team/*  /api/admin/*    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Core Services                            │
│                                                             │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │    Auth     │ │  Measurement │ │    Interpretation    │ │
│  │  (session,  │ │  (sessions,  │ │   (weekly analysis,  │ │
│  │ magic-link) │ │  responses)  │ │      LLM-driven)     │ │
│  └─────────────┘ └──────────────┘ └──────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL (Neon)                        │
│  users • orgs • teams • memberships • sessions • responses  │
└─────────────────────────────────────────────────────────────┘
```

## Data Model

### Core Entities

| Entity | Description |
|--------|-------------|
| `orgs` | Organizations (tenants) |
| `teams` | Teams within organizations |
| `users` | User accounts (email-based) |
| `memberships` | User ↔ Org ↔ Team relationships with roles |
| `measurement_sessions` | Weekly measurement sessions per user |
| `measurement_responses` | Individual item responses |
| `weekly_interpretations` | LLM-generated weekly analysis |

### Role Hierarchy

| Role | Access Level |
|------|--------------|
| EMPLOYEE | Own session only |
| TEAMLEAD | Own team dashboard |
| EXECUTIVE | All team dashboards, org-level view |
| ADMIN | Full access + admin tools |

## Authentication Flow

```
User → /login → Enter email
     → Request magic link (rate-limited)
     → Email with /auth/consume?token=...
     → Click link → Session created → Redirect by role
```

Key properties:
- **Single-use tokens** with 15-minute expiry
- **Tokens stored hashed** (SHA-256)
- **Sessions stored hashed** in database
- **Invite-only access** — unknown emails cannot authenticate

## Environment Configuration

### Critical Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_BASE_URL` | Production | Canonical public origin (e.g., `https://www.inpsyq.com`) |
| `EMAIL_PROVIDER` | Yes | `resend` (prod), `disabled` (preview), `test` (dev) |
| `RESEND_API_KEY` | If resend | Resend API key |
| `INTERNAL_ADMIN_SECRET` | Yes | Secret for internal admin endpoints |

### Environment Hierarchy

| Environment | VERCEL_ENV | Characteristics |
|-------------|------------|-----------------|
| Production | `production` | Real emails, strict origin |
| Staging | `preview` | No emails, staging data |
| Preview | `preview` | No emails, branch deploys |
| Development | `development` | Local, test transport |

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js pages and API routes |
| `components/` | React components |
| `lib/` | Core business logic |
| `services/` | External service integrations |
| `db/` | Database client and queries |
| `scripts/` | Operational and verification scripts |
| `docs/` | Documentation |
