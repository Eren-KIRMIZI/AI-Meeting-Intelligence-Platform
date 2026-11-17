# Nova — AI Meeting Intelligence Platform

Nova turns meetings into execution: every conversation becomes a brief with decisions, owners, deadlines and follow-ups. This repository contains the full-stack foundation: a production-ready React frontend, a Supabase schema with row-level security, and Vercel serverless functions for privileged operations.

> **Demo mode is the default.** With no credentials configured the app runs entirely on clearly-labelled local demo data. Add Supabase keys to switch to live data without changing a single component.

---

## Stack

| Layer | Choice |
| --- | --- |
| UI | React 18, TypeScript, Vite 7, Tailwind CSS, Radix UI primitives |
| Routing | React Router 7 |
| State | Zustand (UI + persisted preferences), TanStack Query (server state) |
| Data | Supabase (Postgres, Auth, Storage) with RLS |
| Charts | Recharts |
| Serverless | Vercel Functions (`api/`), `@vercel/node` |
| Rate limiting | Upstash Redis (optional, fails open) |
| Toasts | Sonner |
| Icons | Lucide |

---

## Project structure

```
.
├─ frontend/
│  ├─ api/                     Vercel serverless functions
│  │  ├─ _lib/                 http + redis helpers (not routed)
│  │  ├─ health.ts             GET  /api/health
│  │  ├─ meetings/analyze.ts   POST /api/meetings/analyze
│  │  └─ team/invite.ts        POST /api/team/invite
│  ├─ src/
│  │  ├─ app/                  providers, router, root component
│  │  ├─ components/           layout, common, UI primitives
│  │  ├─ features/             one folder per module + auth
│  │  ├─ hooks/                query + mutation hooks
│  │  ├─ lib/                  env, supabase clients, utils, config
│  │  ├─ mocks/                demo seed data + mutable demo store
│  │  ├─ services/             live Supabase services with demo fallback
│  │  ├─ stores/               Zustand stores
│  │  ├─ styles/               global CSS + design tokens
│  │  └─ types/                shared domain types
│  ├─ .env.example
│  └─ vercel.json
└─ supabase/
   ├─ migrations/0001_init.sql                 schema, triggers, RLS, storage, bootstrap
   ├─ migrations/0002_meeting_intelligence.sql transcript + analysis columns
   ├─ migrations/0003_workflow_runs.sql        workflow execution history
   └─ seed.sql                                 idempotent demo workspace
```

Mock data never leaks into live mode: every service checks `isSupabaseConfigured` and falls back to `src/mocks/db.ts` only when credentials are absent.

---

## Quick start (demo mode)

Requirements: Node.js 20+.

```bash
cd frontend
npm install
npm run dev
```

Open the printed URL (default `http://localhost:5173`). Use **Continue with demo workspace** on the login screen. No credentials are needed.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check projects and build production assets |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Type-check the app only |
| `npm run test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:coverage` | Run the suite with a V8 coverage report |

### Testing & CI

Tests use Vitest with jsdom, Testing Library and jest-dom. The suite covers pure helpers, metric builders, range-derived analytics, enum guards, the transcript analyzer, the demo data store and its meeting pipeline (analyze → commit) and workflow run log, sidebar accessibility, the 404 page and a task-board interaction end to end.

```bash
cd frontend
npm run test
```

`src/test/setup.ts` provides the small browser API shims Radix and Recharts need. Tests never call Supabase or the network — demo mode keeps them deterministic.

GitHub Actions runs `lint → typecheck → test → build` on every push and pull request to `main` (`.github/workflows/ci.yml`).

---

## Live mode — Supabase

### 1. Create a project

Create a Supabase project, then copy the API URL and the **publishable (anon)** key.

### 2. Apply the schema

Open the SQL editor and run, in order:

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_meeting_intelligence.sql`
3. `supabase/migrations/0003_workflow_runs.sql`
4. `supabase/seed.sql` — optional demo workspace. Requires at least one auth user; sign up once first.

Or with the Supabase CLI:

```bash
supabase db push
psql "$DATABASE_URL" -f supabase/seed.sql
```

The migration creates:

- `profiles`, `organizations`, `organization_members`
- `projects`, `project_members`, `tasks`
- `meetings`, `meeting_participants`, `decisions`
- `activities`, `knowledge_documents`, `workflows`, `integrations`, `notifications`
- `workflow_runs` (added in `0003`) for workflow execution history
- `handle_new_user` trigger, `set_updated_at` triggers, indexes
- RLS helpers: `is_org_member`, `is_org_admin`, `shares_org_with`
- `bootstrap_workspace()` for first-run onboarding
- A private `meeting-assets` storage bucket with org-scoped policies

The second migration adds `transcript`, `analysis`, `analysis_error`, `analysis_confidence`, `analyzed_at` and `analysis_model` to `meetings`. Existing RLS already scopes those columns to active workspace members.

The third migration adds `workflow_runs`, scoped to workspace members for reads. Automation writes stay on the service role, so no authenticated insert or update policy is granted.

### 3. Configure environment

```bash
cd frontend
cp .env.example .env
```

Fill in the browser-safe values:

```dotenv
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-or-anon-key>
```

Restart the dev server. The app now reads and writes live data, and the login screen switches to email/password auth.

### 4. Server-only variables

These belong in Vercel project settings (or `.env` for `vercel dev`) and must never be exposed to the client:

```dotenv
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SECRET_KEY=<service-role-key>
UPSTASH_REDIS_REST_URL=<optional>
UPSTASH_REDIS_REST_TOKEN=<optional>
OPENAI_API_KEY=<optional, enables live transcript extraction>
OPENAI_MODEL=gpt-4o-mini
VITE_APP_URL=https://your-app.vercel.app
```

> Only variables prefixed with `VITE_` are bundled into the browser. Never prefix a secret with `VITE_`.

### 5. Auth settings

In Supabase → Authentication → URL configuration:

- Site URL: your deployed origin
- Redirect URLs: `http://localhost:5173/**`, `https://your-app.vercel.app/**`

Invitations use `auth.admin.inviteUserByEmail` with a redirect to `/login`.

---

## API

### `GET /api/health`

Readiness probe. Reports mode and dependency status without exposing values.

```json
{
  "status": "ok",
  "service": "nova-api",
  "mode": "live",
  "checks": { "supabase": { "ok": true }, "redis": { "ok": true } },
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

### `POST /api/team/invite`

Requires `Authorization: Bearer <access-token>`.

```json
{ "email": "new.member@company.com", "role": "member", "organizationId": "<uuid>" }
```

Guards:

1. Validates the JWT with Supabase Auth.
2. Confirms the caller is an **active owner/admin** of the organization.
3. Rejects duplicates and invalid roles (`admin | member | viewer`).
4. Rate limits to 10 invitations per hour per inviter via Upstash (fails open when unset).
5. Invites via the admin API, then stores an `invited` membership.

Use `vercel dev` locally when testing API routes; plain `vite` serves the frontend only.

### `POST /api/meetings/analyze`

Requires `Authorization: Bearer <access-token>`. Turns a transcript into the same analysis shape the demo analyzer produces.

```json
{
  "meetingId": "<uuid>",
  "organizationId": "<uuid>",
  "transcript": "Ayşe: We agreed to ship the checklist.\nEmre: I will draft it by Tuesday."
}
```

Guards:

1. Validates the JWT with Supabase Auth.
2. Confirms the caller is an **active owner/admin/member** of the organization.
3. Verifies the meeting belongs to that organization.
4. Requires `OPENAI_API_KEY` on the server; returns `503` when it is absent.
5. Rate limits to 20 analyses per hour per user via Upstash (fails open when unset).
6. Caps the transcript at 20,000 characters and validates the provider JSON before returning it.

Response: `{ "ok": true, "analysis": { summary, keyPoints, risks, topics, confidence, transcript, actions, decisions, analyzedAt, model, steps } }`.

The browser never calls a provider directly. In demo mode the deterministic analyzer in `src/lib/meeting-intelligence.ts` runs locally and the endpoint is not called at all.

---

## Deployment — Vercel

1. Import the repository.
2. Set **Root Directory** to `frontend`.
3. Framework preset: Vite. Build: `npm run build`. Output: `dist`.
4. Add the environment variables above (production + preview).
5. Deploy.

`frontend/vercel.json` rewrites non-API routes to `index.html` (SPA routing) and sets `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` and `Permissions-Policy` headers.

---

## Security model

- **RLS everywhere.** Every tenant table is scoped through `organization_members`; helpers are `security definer` with a pinned `search_path`.
- **Least privilege.** Invites and admin operations run only in serverless functions with the service-role key; the browser uses the publishable key.
- **No secret leakage.** `.env` is git-ignored; `.env.example` lists names with empty values; only `VITE_*` variables reach the client.
- **Storage isolation.** The `meeting-assets` bucket is private and keyed by organization folder (`<org-uuid>/<file>`).
- **Input validation.** API routes validate email, role and UUID formats and cap request bodies.
- **Abuse control.** Optional Upstash rate limiting on invitations.

If you rotate keys, update Vercel environment variables and redeploy. Never commit real credentials.

---

## Design system

- 68px fixed icon sidebar (`#111315`) with 40×40 blue active tiles and right-side tooltips
- Fixed header with breadcrumb, centered search, notifications and avatar menu
- Mobile drawer navigation, accessible labels and keyboard support
- Dark surfaces, Manrope/Inter typography, restrained blue accent — no gradients or glow effects
- Modules: Overview, Projects, Tasks, Meetings, Decisions, Knowledge, Workflows, Intelligence, Analytics, Team, Settings
- Workflows expose an inline run log with status, trigger, step outcomes and duration
- Analytics recomputes KPIs, decision mix, workload and project health for 7, 14 or 30 day windows

All interactive controls are wired: create dialogs, task status changes, filters, exports, settings persistence, command palette (`Ctrl/⌘ + K`) and toasts.
