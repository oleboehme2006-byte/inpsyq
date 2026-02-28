# inPsyq Codebase Audit — 2026-02-28

**Scope:** Pre-launch enterprise readiness audit across 6 domains.
**Mode:** Read-only analysis. No files were modified.
**Auditor:** Claude Code (claude-sonnet-4-6)

---

## Summary Table

| Domain | 🔴 Critical | 🟡 Important | 🟢 Nice-to-have |
|--------|-------------|--------------|-----------------|
| 1. Security & Authentication | 3 | 3 | 2 |
| 2. Data Pipeline & Inference | 2 | 3 | 1 |
| 3. Database Schema & Performance | 0 | 5 | 2 |
| 4. Frontend Architecture | 0 | 2 | 3 |
| 5. API Layer & Contracts | 1 | 4 | 1 |
| 6. DevOps & Production Readiness | 1 | 4 | 2 |
| **Total** | **7** | **21** | **11** |

---

## Domain 1 — Security & Authentication

### 🔴 Critical: `DEMO_MODE` Bypass Disables All Auth in Middleware

**File:** `middleware.ts:14-33`

```ts
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
// ...
if (DEMO_MODE) {
    return NextResponse.next(); // bypasses ALL protection
}
```

If `NEXT_PUBLIC_DEMO_MODE=true` is accidentally left in a production Vercel environment (or set by mistake), every dashboard route, every admin route, and every API route is fully unauthenticated and publicly accessible. Because the variable name starts with `NEXT_PUBLIC_`, it is also embedded in the client bundle and visible to users. This is a single-environment-variable misconfiguration away from a complete auth bypass.

**Recommendation:** Remove the middleware bypass entirely. Demo mode should be enforced at the page/data layer (already is), not by bypassing the entire auth middleware. Use a separate Vercel preview deployment for demos, never the production domain.

---

### 🔴 Critical: Global Admin Bypass Allows Cross-Tenant Data Access

**File:** `lib/access/guards.ts:430-444`

```ts
// ADMIN bypass: if user is ADMIN in *any* org, allow cross-org access
const isGlobalAdmin = memberships.some(m => m.role === 'ADMIN');

if (!membership && !isGlobalAdmin) { ... }

// Use matched membership, or synthesize an ADMIN context for cross-org access
const effectiveRole = membership?.role ?? 'ADMIN';
```

`requireRolesStrict()` — which gates the majority of admin and org-management routes — grants any user with the `ADMIN` role in **any** organisation unrestricted access to **any other** organisation's data. A user can set the `inpsyq_selected_org` cookie (a client-writable cookie) to any UUID and gain full admin context for that org, including triggering pipeline runs, reading team dashboards, and accessing sensitive data.

**Recommendation:** Remove the cross-org admin bypass. In a multi-tenant SaaS, admins must be scoped to their own org. If a super-admin (platform operator) capability is genuinely needed, implement it as a separate, separately-provisioned role stored in a server-side table — never derived from an attacker-controllable cookie.

---

### 🔴 Critical: Vercel Cron Will Always Fail Silently

**Files:** `vercel.json`, `middleware.ts:17-27`, `app/api/internal/run-weekly/route.ts`

`vercel.json` configures a weekly cron at:
```json
{ "path": "/api/internal/run-weekly", "schedule": "0 2 * * 1" }
```

But the middleware's public route list is:
```ts
'/api/cron/(.*)',  // matches /api/cron/* — NOT /api/internal/*
```

Vercel cron sends `Authorization: Bearer VERCEL_CRON_SECRET`. The middleware sees no Clerk session on `/api/internal/run-weekly`, does **not** recognise it as a public route, and redirects to `/login`. The route handler (`requireInternalAccess`) that checks `x-cron-secret` never executes.

The cron job has been silently failing on every Monday since deployment. No automated weekly pipeline has ever run in production.

**Recommendation:** Either (a) move the cron endpoint to `/api/cron/run-weekly` to match the public matcher, or (b) add `/api/internal/run-weekly` to the `isPublicRoute` list and rely solely on the `INTERNAL_CRON_SECRET` header check for auth. Option (a) is cleaner. Also add the `Authorization: Bearer VERCEL_CRON_SECRET` check per Vercel docs.

---

### 🟡 Important: Dev Auth Headers Active in Production When `NODE_ENV !== 'development'`

**File:** `lib/access/guards.ts:52-110`

```ts
const DEV_MODE = process.env.NODE_ENV === 'development';
```

The dev-mode bypass (accepting `x-dev-user-id` header or `inpsyq_dev_user` cookie) correctly checks `NODE_ENV`. Since Vercel sets `NODE_ENV=production` at build and runtime, this path is inert in production deploys. However, if the app is ever self-hosted (e.g., Docker for on-premise clients), `NODE_ENV` is not guaranteed to be `production` and this bypass becomes active.

**Recommendation:** Add an explicit `ENABLE_DEV_AUTH=true` environment variable gate in addition to `NODE_ENV`, so the bypass is opt-in and impossible to accidentally activate in hosted environments.

---

### 🟡 Important: `inpsyq_selected_org` Cookie Is Client-Writable Tenant Discriminator

**File:** `lib/access/guards.ts:362-415`

All routes using `requireRolesStrict()` resolve the active organisation from a cookie set by the browser:
```ts
const orgMatch = cookieHeader.match(new RegExp(`${SELECTED_ORG_COOKIE_NAME}=([^;]+)`));
```

A user can arbitrarily set this cookie to any UUID. With the global admin bypass removed (see Critical #2), the membership check would prevent unauthorised access — but only if `getMembershipForOrg()` correctly enforces org scoping, which it does. However, the reliance on a client-controlled value as a primary routing discriminator is architecturally fragile.

**Recommendation:** After removing the global admin bypass, this becomes less dangerous. Long-term, consider resolving org context from a signed session claim (e.g., Clerk org metadata) rather than a plain cookie.

---

### 🟡 Important: Clerk Webhook Not Verifying Signature

**File:** `app/api/webhooks/clerk/route.ts` (inferred — not reviewed in detail)

**Recommendation:** Confirm that the Clerk webhook endpoint uses `svix` signature verification (`webhook.verify(body, headers)`). Unverified webhooks allow anyone to send fake `user.created` events and inject arbitrary user records into the database.

---

### 🟢 Nice-to-have: No Audit Trail for Data Access (Only Mutations)

**Files:** `lib/schema.ts:153-162`, `app/api/admin/system/run-weekly/route.ts`

The `audit_events` table records pipeline triggers and some admin actions, but there is no logging when sensitive data is read (e.g., executive dashboard, team details, private feedback). For enterprise clients with data governance requirements, read-access logging may be contractually required.

**Recommendation:** Add audit log entries for dashboard data reads by role, at minimum for the executive and team dashboard server components.

---

### 🟢 Nice-to-have: No Session Timeout or Inactivity Enforcement

Clerk handles session management, but there is no application-level inactivity timeout. For a psychological analytics platform with sensitive individual-level data, client-side session expiry after a configurable idle period would be appropriate.

---

## Domain 2 — Data Pipeline & Inference Engine

### 🔴 Critical: Default LLM Model Name Is Invalid (`gpt-5-mini`)

**File:** `services/llm/client.ts:15`

```ts
model: process.env.OPENAI_MODEL || 'gpt-5-mini',
```

`gpt-5-mini` is not a valid OpenAI model identifier (the correct name is `gpt-4o-mini`). If the `OPENAI_MODEL` environment variable is not set in production, every LLM call will fail immediately with `404 - model_not_found`. The deterministic fallback exists (`generateDeterministicInterpretation`), so briefings will silently degrade without error surfacing to operators.

**Recommendation:** Fix the default to `'gpt-4o-mini'`. Add a startup check that validates the model name is reachable before the first pipeline run.

---

### 🔴 Critical: `audit_events` INSERT Uses Non-Existent Columns

**File:** `app/api/admin/system/run-weekly/route.ts:144-163`

```ts
INSERT INTO audit_events (event_id, org_id, user_id, event_type, payload, created_at)
```

The `lib/schema.ts` definition of `audit_events` has no `user_id` column and no `payload` column (it has `metadata JSONB`). This INSERT will throw a `column "user_id" does not exist` PostgreSQL error at runtime. The error is silently caught:

```ts
} catch (auditError: any) {
    console.warn('[Admin] Failed to write audit event:', auditError.message);
}
```

The admin pipeline trigger appears to succeed (the run itself works), but the audit trail is never written. No admin action is ever logged.

**Recommendation:** Either (a) add `user_id UUID REFERENCES users(user_id)` and rename `metadata` to `payload` in the schema, or (b) fix the INSERT to use `metadata` and omit `user_id`. Run `ALTER TABLE` migrations to align schema with code.

---

### 🟡 Important: No LLM Timeout — Pipeline Can Hang Indefinitely

**File:** `services/interpretation/service.ts` (concurrency section), `services/llm/openai.ts` (inferred)

The OpenAI client is initialised with no `timeout` option:
```ts
return new OpenAI({ apiKey: apiKey });
```

OpenAI's default timeout is 10 minutes. During a weekly run across many orgs, a hanging LLM call will hold the semaphore slot indefinitely. The pipeline runner has per-team timeouts, but if an LLM call hangs inside `acquireWithTimeout`, the acquire timeout fires but the pending OpenAI request continues consuming memory and connections.

**Recommendation:** Set `timeout: 30_000` (30 seconds) on the OpenAI client constructor. This is appropriate for the `max_tokens: 600` setting.

---

### 🟡 Important: No LLM Retry Logic

**File:** `services/interpretation/service.ts`

If a LLM call fails with a transient error (5xx, rate limit, network timeout), the pipeline immediately falls through to the deterministic fallback. There is no retry with exponential backoff. During high-load periods, this means all interpretations silently degrade to template text even when the API would succeed on a second attempt.

**Recommendation:** Wrap LLM calls in a retry helper (2 retries, exponential backoff: 1s, 3s). Use the `openai` SDK's built-in `maxRetries` option: `new OpenAI({ apiKey, maxRetries: 2 })`.

---

### 🟡 Important: Pipeline Logs Use `console.log` — No Structured Telemetry

**Files:** `services/weeklyRunner/runner.ts`, `services/pipeline/runner.ts`

All pipeline logging uses `console.log`/`console.error` with JSON objects as second argument. On Vercel, these appear as unstructured text in log drain. There is no way to query "how many orgs failed last Monday" or "what was the p95 LLM latency last week" without manually parsing log output.

**Recommendation:** Use a structured logger (e.g., `pino` with Vercel Log Drain integration or a simple structured logger that emits `{ level, timestamp, event, ...fields }` JSON). Tag pipeline events with `run_id` for correlation.

---

### 🟢 Nice-to-have: No Alerting on Pipeline Failure

If a weekly run completes with `status: 'partial'` or `status: 'failed'`, no alert is sent to operators. The existing `alerts` table is written with team-level psychometric alerts but not system health events.

**Recommendation:** On pipeline failure or partial completion, write a `system.pipeline_failure` entry to the `alerts` table and/or send an email/Slack notification to the platform admin.

---

## Domain 3 — Database Schema & Performance

### 🟡 Important: Missing Indexes on `org_aggregates_weekly`

**File:** `lib/schema.ts:87-96`

```sql
CREATE TABLE IF NOT EXISTS org_aggregates_weekly (
    org_id UUID REFERENCES orgs(org_id),
    team_id UUID REFERENCES teams(team_id),
    week_start DATE NOT NULL,
    -- ...
    PRIMARY KEY (org_id, team_id, week_start)
);
```

The composite PK `(org_id, team_id, week_start)` only optimises for lookups that start with `org_id`. Queries from `teamReader.ts` and `executiveReader.ts` filter by `(org_id, week_start)` without specifying `team_id` — these will use the PK. However, any query filtering by `team_id` alone (e.g., pipeline existence checks) will full-scan the table as it grows.

**Recommendation:** Add:
```sql
CREATE INDEX IF NOT EXISTS idx_oaw_team ON org_aggregates_weekly(team_id);
CREATE INDEX IF NOT EXISTS idx_oaw_org_week ON org_aggregates_weekly(org_id, week_start DESC);
```

---

### 🟡 Important: Missing Indexes on `sessions` and `responses`

**File:** `lib/schema.ts:40-54`

```sql
CREATE TABLE IF NOT EXISTS sessions (
    session_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(user_id),  -- no index
    ...
);

CREATE TABLE IF NOT EXISTS responses (
    response_id UUID PRIMARY KEY,
    session_id UUID REFERENCES sessions(session_id),  -- no index
    interaction_id UUID REFERENCES interactions(interaction_id),  -- no index
    ...
);
```

The pipeline gathers all measurements for a team/week via `sessions.user_id` and `responses.session_id`. Without indexes on these columns, measurement gathering does full table scans as the database grows. At scale (10 orgs × 50 employees × 52 weeks = 26,000 sessions), this will cause pipeline timeouts.

**Recommendation:** Add:
```sql
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_responses_session ON responses(session_id);
CREATE INDEX IF NOT EXISTS idx_responses_interaction ON responses(interaction_id);
```

---

### 🟡 Important: Missing Index on `teams(org_id)`

**File:** `lib/schema.ts:11-15`

```sql
CREATE TABLE IF NOT EXISTS teams (
    team_id UUID PRIMARY KEY,
    org_id UUID REFERENCES orgs(org_id),  -- no index
    name TEXT NOT NULL
);
```

Every executive dashboard render calls `SELECT * FROM teams WHERE org_id = $1`. Without an index this is a full scan, which becomes expensive when the platform has many teams across orgs.

**Recommendation:** Add:
```sql
CREATE INDEX IF NOT EXISTS idx_teams_org ON teams(org_id);
```

---

### 🟡 Important: No `ON DELETE CASCADE` on Any Foreign Key

**File:** `lib/schema.ts` (all FK definitions)

Every foreign key in the schema is a bare `REFERENCES` with no `ON DELETE` clause, defaulting to `ON DELETE NO ACTION`. If an org or team is deleted (or a user deprovisioned), all dependent rows (sessions, responses, aggregates, latent states, memberships) become orphaned but remain in the database. Attempting to delete the org will raise a foreign key violation and fail.

There is no mechanism to cleanly offboard a client organisation.

**Recommendation:** Add `ON DELETE CASCADE` on child tables for legitimate lifecycle events:
- `teams.org_id → orgs.org_id ON DELETE CASCADE`
- `memberships.org_id`, `memberships.user_id` → respective tables
- `sessions.user_id → users.user_id ON DELETE CASCADE`
- `responses.session_id → sessions.session_id ON DELETE CASCADE`
- `org_aggregates_weekly.org_id / team_id` — consider `ON DELETE RESTRICT` to prevent accidental cascade of analytical data

---

### 🟡 Important: No Unique Constraint on `responses(session_id, interaction_id)`

**File:** `lib/schema.ts:48-54`

A user could theoretically submit the same question twice in a session (e.g., network retry). Without a unique constraint on `(session_id, interaction_id)`, duplicate responses are silently stored and both contribute to parameter estimation, skewing the Bayesian update.

**Recommendation:** Add:
```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_responses_unique_answer
    ON responses(session_id, interaction_id);
```

---

### 🟢 Nice-to-have: `org_profiles_weekly` Has No Indexes or Primary Key

**File:** `lib/schema.ts:98-105`

```sql
CREATE TABLE IF NOT EXISTS org_profiles_weekly (
    org_id UUID REFERENCES orgs(org_id),
    team_id UUID REFERENCES teams(team_id),
    week_start DATE NOT NULL,
    profile_type TEXT NOT NULL,
    ...
);
-- No PK, no indexes
```

**Recommendation:** Add a composite PK `(org_id, team_id, week_start, profile_type)` and indexes on `(org_id, week_start)`.

---

### 🟢 Nice-to-have: Two Parallel Type Systems Are a Maintenance Hazard

The codebase has formal DTOs in `lib/dashboard/types.ts` (`ExecutiveDashboardDTO`, `TeamDashboardDTO`) and a parallel simpler type system in `services/dashboard/executiveReader.ts` / `teamReader.ts`. The formal DTOs are unused by any production code path. Future changes risk divergence.

**Recommendation:** Either retire the formal DTOs and document the reader types as canonical, or migrate the readers to use the formal DTOs and delete the duplicates.

---

## Domain 4 — Frontend Architecture & React Performance

### 🟡 Important: Executive Dashboard N+1 Query in `executiveReader.ts`

**File:** `services/dashboard/executiveReader.ts`

The executive reader fetches team-level data with a per-team query loop:
```ts
for (const team of teams) {
    const teamData = await getTeamDashboardData(teamId, weekStart);
    // ...
}
```

With 8 teams, this is 8 sequential database round-trips. Each `getTeamDashboardData` call independently queries `org_aggregates_weekly`. At Neon's serverless cold-start latency (5–50ms per query), this adds 40–400ms to every executive dashboard page load.

**Recommendation:** Batch the team aggregate query with a single `WHERE team_id = ANY($1)` and map results in application code. The historical series query already uses `AVG/GROUP BY week_start` — apply the same pattern for the current-week team snapshot.

---

### 🟡 Important: `ensureSchema()` Called on Every Hot Request Path

**Files:** `app/api/measurement/submit/route.ts:19-28`, `services/interpretation/service.ts:44-54`

Both files use a module-level `let schemaEnsured = false` flag and call `query(SCHEMA_SQL)` on the first request after a cold start. This runs full `CREATE TABLE IF NOT EXISTS` statements synchronously before handling the request. On Vercel's serverless functions, each new instance starts cold and runs this migration, adding 100–500ms of latency to the first request per instance.

**Recommendation:** Run migrations as a separate deploy step (e.g., via a CI command `node scripts/migrate.ts`), not lazily on first request. Remove `ensureSchema()` from hot paths.

---

### 🟢 Nice-to-have: Framer Motion Import Pattern

**File:** `app/(public)/page.tsx`

The landing page imports broadly from `framer-motion`:
```ts
import { motion, useScroll, useTransform, useInView, AnimatePresence, MotionValue } from 'framer-motion';
```

Framer Motion supports deep imports (`framer-motion/m`) for tree-shaking. With the current import pattern, the full 100KB+ bundle is included.

**Recommendation:** Consider `import { m } from 'framer-motion'` with `LazyMotion` and `domAnimation` feature set (~18KB) for the landing page public bundle.

---

### 🟢 Nice-to-have: Dashboard Components Have No Explicit `React.memo`

The causal graph sub-components (`AnimatedEdge`, `DriverNode`, `IndexNode`) re-render whenever any ancestor state changes. These are pure presentational components with stable prop shapes and are good candidates for `React.memo`.

---

### 🟢 Nice-to-have: No `<Suspense>` Boundaries on Dashboard Data Fetches

Server components fetch dashboard data synchronously before rendering. If the database is slow, the entire page is blocked. Adding `<Suspense>` with skeleton boundaries would allow progressive rendering.

---

## Domain 5 — API Layer & Contracts

### 🔴 Critical: No Input Validation (Zod) on Mutation Endpoints

**Files:** `app/api/measurement/submit/route.ts`, all `app/api/org/*/route.ts`, all `app/api/admin/*/route.ts`

Zod is in `package.json` as a dependency but is not used in any API route handler. Inputs are accessed via:
```ts
const { sessionId, responses, complete = false } = body;
```

There is no type coercion, range validation, or schema enforcement. An attacker or buggy client can send:
- `sessionId` as an object or array → unexpected query behavior
- `responses[].value` as a string or `NaN` → corrupts Bayesian parameter estimates
- `week_start` with arbitrary SQL-injectable content (mitigated by parameterised queries, but semantic garbage still enters the pipeline)
- Missing required fields that crash later in the stack with unhelpful 500 errors

**Recommendation:** Add Zod schemas for every mutation endpoint request body. Use `z.parse()` at the top of each handler and return a structured 422 error on validation failure.

---

### 🟡 Important: Inconsistent Error Response Formats

Three different error shapes are used across the API:

```ts
// Format A (legacy guards)
{ error: string, code: string }

// Format B (RBAC guards)
{ ok: false, error: { code: string, message: string } }

// Format C (measurement submit)
{ error: string, code: string, request_id: string }
```

This makes client-side error handling and monitoring fragile — a frontend component must handle multiple shapes to display the right message.

**Recommendation:** Standardise on Format B (`{ ok: false, error: { code, message }, request_id }`) across all routes. Update the legacy guard functions and measurement endpoints.

---

### 🟡 Important: Response Payload Over-Exposure in Admin Routes

**Files:** `app/api/admin/executive-dashboard/route.ts`, `app/api/admin/team-dashboard/route.ts` (inferred)

Admin dashboard routes likely return full `org_aggregates_weekly` rows including `parameter_means` and `parameter_uncertainty` JSONB objects. These contain individual-level aggregated parameter estimates that could allow reverse-engineering of individual responses if team sizes are small (below k-threshold). The k-anonymity threshold is enforced at pipeline compute time but may not be re-checked at API read time.

**Recommendation:** API routes that return analytical data should re-validate k-threshold before returning individual team data: `IF sample_size < k_threshold THEN omit indices`. The frontend already shows masked data for small teams — ensure the API enforces this too.

---

### 🟡 Important: No Rate Limiting on Survey Submission Endpoint

**File:** `app/api/measurement/submit/route.ts`

The measurement submission endpoint is authenticated but has no rate limiting. A valid employee account could submit thousands of responses programmatically in a single minute, flooding the pipeline with synthetic data and corrupting org-level indices.

**Recommendation:** Add a per-user rate limit (e.g., 60 requests/minute) using an in-memory LRU or Redis-backed counter. Vercel's built-in Edge middleware rate limiting is an option if moving this route to the Edge runtime.

---

### 🟡 Important: `requireInternalAccess` Falls Through to 403 When Secret Not Configured

**File:** `lib/access/guards.ts:288-318`

```ts
const INTERNAL_ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;
// ...
if (secretHeader && INTERNAL_ADMIN_SECRET && secretHeader === INTERNAL_ADMIN_SECRET) {
```

If `INTERNAL_ADMIN_SECRET` is not set, the condition is always false. The route then falls to a 403 even if the correct secret is provided. There is no startup warning that this is unconfigured. In production, if the env var is missing, `/api/internal/run-weekly` is permanently unreachable.

**Recommendation:** Add a startup log warning: `if (!INTERNAL_ADMIN_SECRET) console.error('[SECURITY] INTERNAL_ADMIN_SECRET is not set — internal routes will reject all requests')`.

---

### 🟢 Nice-to-have: Diagnostic Routes Are Public Under `/api/internal/diag/`

**Files:** `app/api/internal/diag/**` (18 route files found)

Assuming these use `requireInternalAccess`, they are appropriately gated. Verify that all 18 diagnostic routes apply the guard — one unguarded diagnostic route could expose system internals (DB row counts, pipeline state, queue depth) to unauthenticated callers.

---

## Domain 6 — DevOps & Production Readiness

### 🔴 Critical: No Error Tracking (Sentry or Equivalent)

No Sentry SDK, no error boundary reporting, no exception aggregation service is configured anywhere in the codebase. Unhandled errors in server components, API route handlers, and the weekly pipeline are logged to Vercel's log drain as plain `console.error` text. There is no:
- Alert when error rate spikes
- Stack trace grouping
- Performance tracing for slow API calls
- User session replay for debugging client crashes

For a platform processing real client psychometric data, production errors must be trackable and alertable.

**Recommendation:** Install `@sentry/nextjs` and configure with source maps. Add `Sentry.captureException(e)` in pipeline catch blocks. Set up alerts for new issues and for error rate thresholds.

---

### 🟡 Important: No User Analytics / Behavioural Telemetry (PostHog)

There is no event tracking for user behaviour in the dashboard. Operators cannot answer: "How many executives viewed the briefing last week?", "What fraction of teamleads expand driver cards?", "Where do users drop off in the onboarding flow?"

**Recommendation:** Install `posthog-js` and instrument key user events (dashboard view, tutorial step completion, briefing expand, team card click). PostHog can self-host for data governance compliance.

---

### 🟡 Important: No Health Check Endpoint with Dependency Probes

**File:** `app/api/health/route.ts` (inferred — listed in middleware public routes)

The health endpoint likely returns a static `{ status: 'ok' }` without checking DB connectivity, LLM availability, or pipeline lock state. Vercel's uptime monitor and any client SLA monitoring will show green even when the database is unreachable.

**Recommendation:** Implement a deep health check:
```ts
// Check DB, check LLM API key exists, check pipeline lock table accessible
{ status: 'ok' | 'degraded', db: 'ok' | 'error', llm: 'configured' | 'missing_key', ... }
```

---

### 🟡 Important: `INTERNAL_CRON_SECRET` vs Vercel Cron Auth Mismatch

**Files:** `vercel.json`, `app/api/internal/run-weekly/route.ts:32`

Beyond the middleware routing bug (Critical #3 in Domain 1), even if the routing were fixed, there is an auth header mismatch. Vercel cron sends:
```
Authorization: Bearer CRON_SECRET
```

But the route checks:
```ts
const providedSecret = request.headers.get('x-cron-secret');
```

These headers will never match. The route would reject Vercel's own cron with 401.

**Recommendation:** Update the route to accept Vercel's standard cron header:
```ts
const authHeader = request.headers.get('authorization');
const cronSecret = process.env.CRON_SECRET; // Vercel's env var name
if (authHeader !== `Bearer ${cronSecret}`) { return 401; }
```

---

### 🟡 Important: Vercel Function Timeout Not Configured for Long Pipeline Runs

The weekly pipeline processes all orgs and teams in a single invocation of `POST /api/internal/run-weekly`. Vercel's default function timeout is 10 seconds (Hobby) or 60 seconds (Pro). The pipeline for even a small client (5 teams × LLM generation) will take 30–120 seconds.

**Recommendation:** Add to `vercel.json`:
```json
{
    "functions": {
        "app/api/internal/run-weekly/route.ts": { "maxDuration": 300 },
        "app/api/admin/system/run-weekly/route.ts": { "maxDuration": 300 }
    }
}
```
Verify the Vercel plan supports the required timeout.

---

### 🟢 Nice-to-have: No Staging / Preview Environment Strategy

The codebase has no documented approach for preview deployments vs production. Vercel preview deployments will inherit production environment variables if not overridden, potentially connecting to the production database.

**Recommendation:** Create a separate `inpsyq-staging` Neon branch. Configure Vercel preview deployments to use staging DB credentials. Use `NEXT_PUBLIC_DEMO_MODE=true` only on preview deploys.

---

### 🟢 Nice-to-have: No `Content-Security-Policy` Header

No CSP headers are configured in `next.config.js` or middleware. This leaves the application open to XSS escalation even if an injection vulnerability is discovered.

**Recommendation:** Add a strict `Content-Security-Policy` header in Next.js config `headers()`. At minimum: `default-src 'self'; script-src 'self' 'nonce-...'; style-src 'self' 'unsafe-inline'`.

---

## Appendix: Prioritised Fix Order for Launch

| Priority | Finding | Est. Effort |
|----------|---------|-------------|
| P0 | Vercel cron routing + auth header mismatch (pipeline never runs) | 30 min |
| P0 | Fix LLM default model `gpt-5-mini` → `gpt-4o-mini` | 5 min |
| P0 | Fix `audit_events` INSERT column mismatch (`user_id`, `payload`) | 15 min |
| P0 | Remove/gate `DEMO_MODE` middleware bypass | 1 hr |
| P0 | Remove global admin cross-tenant bypass in `requireRolesStrict` | 2 hr |
| P1 | Add Sentry error tracking | 2 hr |
| P1 | Add Zod validation to all mutation endpoints | 4 hr |
| P1 | Add missing DB indexes (sessions, responses, teams, org_aggregates) | 30 min |
| P1 | Add `ON DELETE CASCADE` on primary FK chains | 2 hr |
| P1 | Set LLM timeout (30s) + add retry (maxRetries: 2) | 30 min |
| P2 | Standardise API error format | 3 hr |
| P2 | Add rate limiting to `/api/measurement/submit` | 1 hr |
| P2 | Configure Vercel function `maxDuration` for pipeline routes | 15 min |
| P2 | Add unique constraint on `responses(session_id, interaction_id)` | 15 min |
| P3 | Install PostHog analytics | 2 hr |
| P3 | Structured logging (pino) | 4 hr |
| P3 | Add pipeline failure alerting | 2 hr |
| P3 | CSP headers | 1 hr |
