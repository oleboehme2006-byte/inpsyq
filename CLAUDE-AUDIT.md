# inPsyq Project Audit Specification

## Audit Context

inPsyq is an advanced, enterprise-grade psychological analytics platform. The application is approaching a production launch with real clients. We need a comprehensive codebase audit to identify technical debt, security vulnerabilities, performance bottlenecks, and missing critical features.

## Your Role (Claude Code)

1. **Read-Only Mode:** Do NOT modify any files during this audit phase. Your goal is strictly analysis and reporting.
2. **Domain Focus:** Analyze the 6 specific domains listed below.
3. **Structured Output:** Generate a single, comprehensive markdown report named `AUDIT-RESULTS-[YYYY-MM-DD].md` in the project root.

## Domains to Audit

### 1. Security & Authentication

- **Current State:** Clerk is implemented (middleware + `/api/auth/redirect` + `resolveAuthContext()`).
- **Audit Focus:** Are all dashboard and API routes properly gated? Are there any exposed secrets? Is RBAC (Role-Based Access Control) strictly enforced at the data level? Are we relying on `NEXT_PUBLIC_DEMO_MODE=true` in ways that break when disabled?

### 2. Data Pipeline & Inference Engine

- **Current State:** Weekly cron jobs process psychometric data via LLMs.
- **Audit Focus:** Is the pipeline idempotent? How does it handle LLM API timeouts or malformed JSON responses? Are there retries? Is there sufficient telemetry/logging for failed pipeline runs?

### 3. Database Schema & Performance

- **Current State:** Neon Postgres accessed via custom query client.
- **Audit Focus:** Identify missing indexes on frequently queried foreign keys (e.g., `user_id`, `org_id`, `team_id`). Are there potential N+1 query problems in dashboard data fetching? Are ON DELETE cascading rules configured correctly?

### 4. Frontend Architecture & React Performance

- **Current State:** Next.js App Router, Tailwind, Framer Motion.
- **Audit Focus:** Identify unnecessary re-renders in complex interactive components (like the causal graph or dashboard tables). Spot excessive bundle sizes or inefficient imports. Flag any "prop drilling" that should use Context/Zustand.

### 5. API Layer & Contracts

- **Current State:** Next.js Route Handlers.
- **Audit Focus:** Do mutation endpoints strictly validate inputs (e.g., Zod)? Is error handling consistent across endpoints? Are we exposing more data than necessary to the client?

### 6. DevOps & Production Readiness

- **Current State:** Vercel deployment.
- **Audit Focus:** What is missing for a true enterprise launch? (e.g., Sentry error tracking, PostHog analytics, structured logging, rate limiting on public endpoints).

## Output Requirement

The resulting `AUDIT-RESULTS-[YYYY-MM-DD].md` file must group findings by domain. Under each domain, categorize findings strictly as:

- 🔴 **Critical:** Must fix before client launch (security flaws, data loss risks, showstoppers).
- 🟡 **Important:** Strong recommendation to fix soon (performance, significant tech debt, UX bugs).
- 🟢 **Nice-to-have:** Polish, minor optimizations, long-term architectural improvements.

For each finding, include:

- A brief description of the issue.
- The specific file path(s) involved.
- Concrete recommendations on how to fix it.
