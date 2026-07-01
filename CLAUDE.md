# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

CanvasBuddy is a Next.js student dashboard that reads a student's Canvas LMS data (grades, due dates, missing work) and provides an AI study assistant. There is **no test framework** in this repo — verification is done via `npm run build` and `npm run lint`.

## Commands

```bash
npm run dev      # Start dev server (Next.js)
npm run build    # Production build — the main correctness check (strict TS, no emit)
npm start        # Run production build
npm run lint     # ESLint (next/core-web-vitals + next/typescript)
npm run clean    # rm -rf .next — run this if you hit stale-cache errors like "Cannot find module './1331.js'"
```

Path alias: `@/*` maps to the repo root (e.g. `@/lib/auth`).

## Stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 (`@tailwindcss/postcss`) · Supabase (`@supabase/ssr`) · iron-session · `@anthropic-ai/sdk`. No ORM — Supabase queries are written inline.

## Architecture

### Two independent auth layers

These are **separate concerns** — don't conflate them:

1. **App account** — Supabase email/password auth. Sign-up confirmation and password-reset emails go through **Brevo** (`lib/brevo/*`), not Supabase SMTP. Confirmation links are minted with the Supabase **service role** (`lib/supabase/admin.ts`) and land at `app/auth/callback/route.ts`. `middleware.ts` → `lib/supabase/middleware.ts` refreshes the Supabase session cookie on every request.
2. **Canvas connection** — per-user Canvas base URL + access token, obtained either via a **PAT** (pasted in Settings) or **OAuth** ("Sign in with Canvas", `lib/canvas/oauth.ts`). Stored in the `user_canvas_credentials` Supabase table for logged-in users, with an **iron-session cookie** (`canvasbuddy_session`) as fallback for users without a Supabase account.

`lib/auth.ts` `getCanvasContext()` is the single entry point that resolves a usable `{ baseUrl, accessToken }`: it prefers DB credentials (refreshing expired OAuth tokens), then falls back to the iron-session. Every Canvas-backed API route starts by calling it and returning `canvasUnauthorizedResponse()` if null. On a Canvas 401, `clearSessionOnUnauthorized()` wipes both credential stores.

**The Canvas token never reaches the browser or Anthropic.** All Canvas fetches happen server-side; only derived text/JSON is returned to the client.

### Data fetching model

Pages under `app/*/page.tsx` are thin shells that render a `"use client"` content component. There is almost no SSR data fetching. Instead:

- `contexts/AppProvider.tsx` fetches **`GET /api/app-data` once** after auth is ready and shares the result through React context (`useApp()`). Home/Grades/Upcoming/Missing all derive their views client-side from this one payload (`lib/app-data.ts` `buildHomeData` / `buildGradesPageData` / `applyHorizonDays`), so changing the "upcoming horizon" re-filters locally without a refetch.
- `hooks/useAppGate.ts` drives the auth gate state machine; `components/AppGate.tsx` / `ClientRoot.tsx` wrap the tree.
- Client sends the browser timezone via the `X-Timezone` header; the server uses it for all date math (`lib/dates.ts`).

The server-side Canvas data layer lives in `lib/canvas/`: `client-core.ts` (raw paginated/JSON fetch + `CanvasApiError`), per-domain builders (`app-data.ts`, `grades-data.ts`, `missing-data.ts`, `upcoming-data.ts`, `home-data.ts`), and shared error handling in `lib/api/canvas-route.ts` (`handleCanvasRouteError` maps Canvas 401/429/etc. to consistent API responses).

### AI assistant (the AI page)

Flow: `POST /api/assistant` → rate limit (`lib/api/assistant-rate-limit.ts`, in-memory) → **topic guard** (`lib/anthropic/topic-guard.ts`) → **agent loop** (`lib/anthropic/canvas-agent.ts`).

- **Topic guard** keeps the assistant scoped to schoolwork. It's a cheap-first cascade: regex allow/deny lists, then a Haiku classifier only when regex is inconclusive. Edit the pattern lists there to tune what's considered on-topic.
- **Agent loop** (`runCanvasAgent`) runs an Anthropic tool-use loop (default model `claude-sonnet-4-6`). Tools are defined in `lib/canvas/agent/tools.ts` and executed by `lib/canvas/agent/executor.ts`.
- **Executor guardrails** are central to safety/cost — preserve them when editing: every course-scoped tool checks `assertCourseAllowed` against the active-course allowlist (populated by `list_active_courses`); there's a per-question **tool-call budget** (`CANVAS_AGENT_MAX_TOOL_CALLS`, default 20) and **agent-turn cap** (`CANVAS_AGENT_MAX_TURNS`, default 8); tool results are HTML-stripped (`lib/html.ts`) and truncated (`CANVAS_AGENT_MAX_RESULT_CHARS`, default 8000). `source-filter.ts` keeps only sources the final answer actually cites.

When adding a Canvas agent tool you must touch **all** of: the schema in `tools.ts`, the `CANVAS_AGENT_TOOL_NAMES` set, input validation in `validateToolInput`, and a `case` in `executeCanvasTool`'s switch.

### Persistence

Supabase tables, each row-level-security scoped to the user: `user_canvas_credentials`, `user_gpa_preferences`, `user_app_preferences` (home widget layout + upcoming horizon). DB access helpers are `lib/*-db.ts`; defaults live in the matching non-`-db` file (e.g. `lib/gpa-preferences.ts`) and are used whenever the table is missing or a read fails — **preference reads are written to degrade gracefully, never to throw**, so the app works before migrations are run.

Migrations in `supabase/migrations/` are **applied manually** in the Supabase SQL editor (run 001, 003, 004; 002 grants fixes RLS permission errors). There is no migration runner.

## Conventions

- **GPA / grades / dates are computed in pure modules** (`lib/gpa.ts`, `lib/canvas/grades.ts`, `lib/dates.ts`) shared by both the API routes and the agent's `get_grades_summary`. Keep grade/GPA logic there, not in routes or components, so the dashboard and the AI agent stay consistent.
- **UI follows the "Ledger" precision design system — the canonical spec is root `DESIGN.md`** (read it before UI/UX work; the older `design-system/canvasbuddy/*.md` files are stale). Flat surfaces, 1px hairline borders (no shadows except true overlays), one selectable accent. Use the shared classes in `app/globals.css` (`.cb-card`, `.cb-btn-primary`, `.cb-btn-secondary`, `.cb-input`, `.cb-chip`, `.cb-section-label`, `.cb-metric`). **Read the semantic CSS vars (`--ink`, `--muted`, `--surface`, `--accent`, `--accent-soft`, `--danger-ink`, …); never hardcode hex** — that's how the accent picker re-skins the whole app.
- **Theming:** the app is **light-only**; the accent (ink/forest/oxblood) is the sole user-selectable dimension, driven by `data-accent` on `<html>`. It's set pre-paint by an inline no-flash script in `app/layout.tsx` (which also pins `data-theme="light"`) and managed by `contexts/ThemeProvider.tsx` (`useTheme`), persisted to `localStorage`. Pick it in Settings → Appearance (`components/settings/AppearanceSettings.tsx`).
- Fonts: Source Serif 4 (headings) / Source Sans 3 (body + UI) / Source Code Pro (numerics via `.cb-metric`), wired via `--font-heading` / `--font-body` / `--font-mono` in `app/layout.tsx`. Icons: Lucide only, no emoji icons. All clickables get `cursor-pointer` + visible `:focus-visible`.

## Environment

Copy `.env.example` → `.env.local`. Required for sign-up + AI: `SESSION_SECRET` (≥32 chars), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only), `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `ANTHROPIC_API_KEY`. OAuth ("Sign in with Canvas") additionally needs `CANVAS_BASE_URL`, `CANVAS_CLIENT_ID`, `CANVAS_CLIENT_SECRET`, `CANVAS_REDIRECT_URI`. Set `NEXT_PUBLIC_SITE_URL` in production so confirmation emails use the right domain. `.env.local` is not deployed — set the same vars in the host. Check readiness at `GET /api/auth/signup/status`.
