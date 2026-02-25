# System Instructions & Project Context: inPsyq

Welcome to the inPsyq project. You are Claude Code, operating as the lead logic and architecture engineer. You are working in a hybrid workflow with Antigravity (Visual UI Agent), but **you are responsible for the complex logic, mathematical integrations, and state management across ALL steps**, including frontend interactive logic.

## Project Overview: inPsyq

inPsyq is an advanced, enterprise-grade analytical platform that provides "Social Sentiment, Data-Driven Depth, and Psychological Insights." It features complex data visualizations (Causal Graphs, Risk Spaces, Latent Fields), LLM-backed briefings, and distinct dashboards for different user roles (Teamlead vs. Executive).

The system relies on high-fidelity narrative structures. (Note: "neuro-sales" means optimizing the UI and landing page like a neuro-marketing professional would. The narrative must adapt to and perfectly showcase the full potential and capability of the system). It is highly stateful, processing multi-week temporal data and causal drivers.

## Division of Labor (Updated)

Your role is to handle **all complex logic and wiring**. Antigravity will handle *pure* visual aesthetics (colors, CSS styling, basic layouts).

- **You (Claude Code):** Backend APIs, Database Schemas, Data Pipelines, LLM Integration Logic, Complex Frontend State Management, Complex UI Logic (e.g., how the Causal Graph data is processed and fed to the UI, tutorial state tracking, dashboard data filtering).
- **Antigravity:** CSS tweaking, pure visual polishing, micro-animations, and final aesthetic review.

## Current Project Milestones (IN EXACT EXECUTION ORDER)

We are executing these 4 steps in this strict sequential order. **You are responsible for the logic and architecture of ALL 4 steps.**

**1. Dashboard Logic (Teamlead/Executive):** Taking the Demo Dashboards as reference and building the real dashboards for clients with exact functionalities of the demo dashboards + perfectioning of the LLM-integration.
**2. Admin Dashboard:** Building the Admin Dashboard perfectly adapted to the system's needs.
**3. Backend wiring + pipeline scaling** perfectioning processes for great amounts of clients.
**4. Landing Page & Tutorials:** Full spec below — read the "Phase 4 Requirements" section before starting.

---

## Phase 4 v2 Requirements: Landing Page & Tutorials

> ⚠️ Do **not** modify any file under `components/demo/`. Demo components are frozen.
> ⚠️ This is a **complete rebuild** of Phase 4. Discard all v1 content for the landing page and tutorial engine.

---

### Landing Page — Complete Rewrite

**6 sections in order.** Headers must be narrative (not generic labels):

| # | Section ID | Narrative Direction |
|---|---|---|
| 1 | Hero | Opening statement that immediately conveys the product's depth |
| 2 | Problem | What org leaders fly blind on — and why current tools fail |
| 3 | How It Works | Signal → model → insight → action — the 72-hour intelligence loop |
| 4 | Science | The psychometric and mathematical engine — what makes it different |
| 5 | Role Demos | 4 role cards (Executive, Teamlead, Employee, Admin) → link to tutorials |
| 6 | Pricing | Closing CTA — contact/demo booking |

**Rules:**

- All copy written fresh in **both DE and EN** in `lib/landing/content.ts`
- DE/EN toggle pill in the nav bar — **no auto-detect**, no URL change, default EN
- No live dashboard iframes or embeds — static visuals only (styled mockup tiles or screenshot blocks)
- Narrative must reflect the platform's actual depth: psychometric precision, causal attribution, LLM briefings, multi-role intelligence, enterprise RBAC. Not a generic HR tool.

---

### Tutorial System — Rebuilt from Scratch

#### Executive + Teamlead: Guided Tour Popover on Live Demo Dashboard

**Mechanic:** A `TourEngine` component renders floating popover cards anchored to `data-tutorial-*` elements on the actual demo dashboard. Dashboard renders fully underneath. Spotlight/dimming mask highlights the target element.

**Popover card must:**

- Never cover the highlighted element
- Use smart positioning (try right → bottom → left → top based on viewport space)
- Scroll the page to bring the target element into view before showing
- Show: step counter, headline, longer explanatory body text (3–5 sentences), Back/Next, Skip

**Executive track — target elements + content per step:**

1. `[data-tutorial="executive-header"]` — org context, what the LIVE/DEMO badge means
2. `[data-tutorial="executive-kpis"]` — the 4 indices, how to read them, what high strain means
3. KPI click interaction — explain that clicking a card changes the chart dimension
4. `[data-tutorial="executive-chart"]` — reading trends, the confidence band, what the shaded area means
5. `[data-tutorial="executive-portfolio"]` — team status columns, what Critical/At Risk means
6. `[data-tutorial="executive-drivers"]` — systemic vs team-local drivers, how they're identified
7. `[data-tutorial="executive-watchlist"]` — severity computation, when to escalate
8. `[data-tutorial="executive-briefing"]` — how LLM briefings are generated, how to use them in board prep

**Teamlead track — target elements + content per step:**

1. `[data-tutorial="team-header"]` — the breadcrumb context, back to executive view
2. `[data-tutorial="team-kpis"]` — team-scoped indices vs org-level
3. `[data-tutorial="team-chart"]` — reading the team trend, week-over-week changes
4. `[data-tutorial="team-drivers"]` — internal driver cards, expanding detail panels
5. `[data-tutorial="team-actions"]` — need states N0–N3, why some actions are gated
6. `[data-tutorial="team-briefing"]` — how to use the briefing for 1-on-1s and retrospectives

**Add any missing `data-tutorial-*` attributes** to the dashboard components as needed.

---

#### Employee + Admin: Slide-Based Presentation (no live dashboard)

**Mechanic:** `SlideShow` component. Full-screen cards, one at a time. No underlying UI. Each slide has: large icon, headline, body text (3–5 sentences, can include bullet list or callout block), Back/Next/Skip.

**Employee slides:**

1. Why the pulse check exists — the organizational intelligence loop
2. The 10 questions — what each psychological dimension measures
3. Anonymity — k-anonymity explained; what is and isn't visible to leadership
4. From answer to insight — the pipeline from your response to the team briefing
5. Your participation matters — consistency and why weekly cadence is essential

**Admin slides:**

1. Your role as platform operator — what you own
2. Onboarding an organization — roster import, team setup, invite flow
3. The weekly pipeline — what it does automatically, how to trigger manually and dry-run
4. System health — reading lock status, alert feed, data quality metrics
5. Data governance — coverage thresholds, retention policy, k-anonymity enforcement

---

### First-Login Behavior

- `TutorialEntryPoint` detects `tutorial_seen[track] === false` on dashboard mount → auto-opens the tour
- User clicks through all steps OR clicks "Skip" — either action marks the track seen via `PATCH /api/user/tutorial-status`
- "?" button **always visible** in dashboard header (not just on first login) — re-opens tour at step 1
- In demo mode (no auth): "?" button still visible, links to `/tutorial/{track}` public page. No DB write.

---

## Step-by-Step Execution Plan (How we will work)

To ensure we don't break the system, we will proceed methodically using a **Branch -> Audit -> Implement -> Verify** loop.

### Phase 1: Context Gathering & Auditing

Instead of changing code immediately, your first task for any step is to map the current state.

- **User Command:** `Audit the existing architecture for Phase [X] and map out the data flow and current logic bottlenecks. Do not modify files yet. Output a markdown plan.`
- **Your Action:** Index the relevant backend/frontend files, analyze the math/logic, and write a summary.

### Phase 2: Implementation (Module by Module)

We will implement logic one specific domain at a time.

- **User Command:** `Implement the data pipeline logic for [Specific Component] according to the audit.`
- **Your Action:** Write the robust logic, wire the APIs, manage the state, and ensure optimal performance.

### Phase 3: Handoff to Antigravity (If Visuals Needed)

- **User Command:** `Leave a summary in ui-handoff.md detailing the data hooks and state variables you exposed for this feature.`

- **Your Action:** Document the React hooks/state APIs you built so Antigravity can style them later.

## Verification Protocol

- **Your Testing Autonomy:** You decide exactly **what** and **how** to test your logic after every coding session. Use tests, APIs, or scripts as you see fit to ensure the system doesn't break.
- **Visuals:** Antigravity and the USER will manually verify visual changes.

## Core Directives

- **Precision:** inPsyq requires exact mathematical and logical precision. Do not take shortcuts with data mappings.
- **Reference existing work:** Always look at the existing "Demo" components before building the "Real" components to ensure functional parity.
- **No pure CSS tinkering:** If a task is purely about making something "look prettier" (e.g., adding a glow effect), defer to Antigravity. If it's about making the interactive data *work correctly*, you do it.
