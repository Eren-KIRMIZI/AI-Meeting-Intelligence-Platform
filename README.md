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
│  │  ├─ live/token.ts         POST /api/live/token (LiveKit, server-side)
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
   ├─ migrations/0004_decision_events.sql      decision status audit trail
   ├─ migrations/0005_live_meetings.sql        Nova Live sessions, transcript and chat
   ├─ migrations/0006_meeting_recordings.sql   recording archive + private bucket
   ├─ migrations/0007_notifications_realtime.sql notifications, RPC and Realtime
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

Tests use Vitest with jsdom, Testing Library and jest-dom. The suite covers pure helpers, metric builders, range-derived analytics, enum guards, the transcript analyzer, the live-meeting intelligence and Knowledge note, the demo data store and its meeting pipeline (analyze → commit), Nova Live persistence, recording formatting and archive storage, notification preference filtering and deep-link safety, the demo workspace event bus, action-driven notification delivery, the workflow run log, sidebar accessibility, the 404 page and a task-board interaction end to end.

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
4. `supabase/migrations/0004_decision_events.sql`
5. `supabase/migrations/0005_live_meetings.sql`
6. `supabase/migrations/0006_meeting_recordings.sql`
7. `supabase/migrations/0007_notifications_realtime.sql`
8. `supabase/seed.sql` — optional demo workspace. Requires at least one auth user; sign up once first.

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
- `decision_events` (added in `0004`) for the append-only decision status log
- `meeting_sessions`, `meeting_transcript_segments` and `meeting_chat_messages`
  (added in `0005`) for Nova Live rooms, plus the `nova_live` platform value
- `meeting_recordings` (added in `0006`) for archived recordings
- `notifications.link`, the `digest` type, `notify_workspace()` and Realtime
  publication (added in `0007`) for action-driven, live notifications
- `handle_new_user` trigger, `set_updated_at` triggers, indexes
- RLS helpers: `is_org_member`, `is_org_admin`, `shares_org_with`
- `bootstrap_workspace()` for first-run onboarding
- Private `meeting-assets` and `meeting-recordings` storage buckets with
  org-scoped policies

The second migration adds `transcript`, `analysis`, `analysis_error`, `analysis_confidence`, `analyzed_at` and `analysis_model` to `meetings`. Existing RLS already scopes those columns to active workspace members.

The third migration adds `workflow_runs`, scoped to workspace members for reads. Automation writes stay on the service role, so no authenticated insert or update policy is granted.

The fourth migration adds `decision_events`, an append-only audit trail for the decision log. Members can read and insert events for their own workspace; history is never updated or deleted.

The fifth migration extends the `meetings.platform` check with `nova_live` and adds the room-level tables: one `meeting_sessions` row per room, ordered `meeting_transcript_segments` and the room `meeting_chat_messages`. Members can read and insert rows for their own workspace. Demo mode keeps the same shapes in memory.

The sixth migration adds `meeting_recordings` and the private `meeting-recordings` bucket (500 MB per file, video/audio mime types only). Members can read and add recordings for their workspace; the uploader or a workspace admin can delete them. Playback requests a one-hour signed URL, so recording files are never public.

The seventh migration adds `notifications.link` and the `digest` notification type, then creates the `notify_workspace()` security-definer RPC. The RPC resolves the audience (`workspace`, `meeting` or `assignee`), excludes the actor and inserts one row per recipient, so client code never writes notifications for other people. It also publishes `notifications`, `tasks`, `decisions`, `decision_events`, `meetings`, `meeting_recordings` and `knowledge_documents` to `supabase_realtime` with replica identity `full`.

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
LIVEKIT_URL=wss://<project>.livekit.cloud
LIVEKIT_API_KEY=<server-side only>
LIVEKIT_API_SECRET=<server-side only>
VITE_APP_URL=https://your-app.vercel.app
```

Optional Nova Live media. `VITE_LIVEKIT_URL` is browser-safe and only switches the room transport to LiveKit; the API key and secret stay on the server and are read exclusively by `POST /api/live/token`. Leave all four empty to keep the WebRTC mesh used by demo mode.

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

### `POST /api/live/token`

Requires `Authorization: Bearer <access-token>`. Mints a short-lived (2 hour) LiveKit join token for a Nova Live room.

```json
{ "room": "nova-abc123", "identity": "<user-or-peer-id>", "name": "Ayşe Yılmaz" }
```

Guards:

1. Validates the JWT with Supabase Auth.
2. Requires `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` and the server Supabase keys; returns `503` when unset.
3. Validates the room and identity formats and caps them at 80 characters.
4. Rate limits to 30 token requests per 10 minutes per user via Upstash (fails open when unset).
5. Returns only `{ token, url, room }` — never the API secret.

---

## Nova Live

Nova Live runs the meeting inside the workspace: video/audio, screen sharing, chat, live captions, a transcript-grounded copilot and a report that becomes tasks, decisions and a Knowledge note.

- **Isolated media layer.** `src/lib/live/media/` defines one `LiveMediaAdapter` contract. `mesh.ts` is a WebRTC mesh with `BroadcastChannel` signalling for demo mode; `livekit.ts` is the production SFU adapter. The room UI never imports either implementation directly.
- **Demo mode works with no credentials.** Rooms connect tabs in the same browser and the scripted `demo-dialogue.ts` feeds captions and the AI pipeline without a microphone. Every demo segment is labelled **Demo** in the transcript.
- **Live mode uses LiveKit Cloud.** Set the four `*_LIVEKIT*` variables; the client requests a token from `/api/live/token`, and no media server runs on Vercel. The mesh is not suitable for real cross-device calls because it needs TURN in restrictive networks.
- **Captions.** `use-live-captions.ts` wraps the Web Speech API (Chrome/Edge), records speaker, text, timestamp and confidence, and stops cleanly on permission errors. The demo dialogue remains available everywhere.
- **Recording.** `use-local-recording.ts` records the local camera/mic with `MediaRecorder`. The `.webm` stays in the browser until the user presses **Save to meeting** on the ended screen, which uploads it to private workspace storage and attaches it to the saved meeting. Demo mode keeps the file browser-local and labels it **This browser only**; live mode plays it back through signed URLs.
- **Consent first.** The pre-join screen explains transcription and optional recording and requires a KVKK/GDPR acknowledgement before anyone joins.
- **Persistence.** Ending a room saves a completed `nova_live` meeting with its analysis, transcript, chat and participants, then writes a Knowledge note. Follow-ups are created only after review through the existing `commitMeetingAnalysis` step.
- **Routes.** `/live` is the lobby inside the app shell; `/live/:roomId` runs full-screen. Start a room in one tab and open the invite link in another to test the mesh as two participants.

---

## Notifications & realtime

Notifications are produced by workspace actions, not by a scheduled job that guesses what happened. The bell in the header is a filtered, deep-linked inbox.

- **Action-driven.** Completing or updating a task, changing a decision status, saving or analyzing a meeting, creating follow-ups and archiving a recording all raise a notification through `dispatchWorkspaceNotification`. Demo mode mirrors this in `mocks/db.ts`, so the flow is testable without credentials.
- **Audiences.** Decision changes go to every active member except the actor; meeting events go to the meeting's participants; task events go to the assignee. The audience is resolved by the `notify_workspace()` RPC, so the client never writes rows for another user.
- **Preferences actually filter.** Each notification type maps to one switch in **Settings → Notifications** (`meetingBriefs`, `actionItems`, `decisionReviews`, `weeklyDigest`, `mentions`). The mapping lives in `src/lib/notifications.ts`, so the bell badge, the list and the settings page cannot drift. Switching a type off hides it from the menu and from the unread count immediately; the menu says how many items are hidden and links to the settings tab.
- **Deep links.** Every notification carries a `link` to the object that produced it, for example `/decisions?decision=d-03`, `/tasks?task=<id>` or `/meetings/<id>`. Links are validated in the UI and by a database check constraint: only single-slash internal paths are accepted, everything else falls back to the module landing page.
- **Live delivery.** `use-workspace-realtime.ts` subscribes to Supabase Realtime for `notifications`, `tasks`, `decisions`, `meetings`, `meeting_recordings` and `knowledge_documents`. Notification inserts show a toast and refresh the bell; other tables invalidate the matching TanStack Query keys. Notification and task channels are filtered by `user_id` / `organization_id`, and RLS still applies to every payload.
- **Demo delivery.** Without credentials the same hook subscribes to the `BroadcastChannel` bus in `src/lib/workspace-events.ts`. Open the app in two tabs: an action in one tab shows a toast, updates the bell and refreshes the list in the other. Only notifications carry their payload across tabs; other demo resources invalidate queries because each tab keeps its own in-memory store.
- **Settings deep link.** Settings tabs are URL-controlled (`/settings?tab=notifications`), so the bell footer and the empty-state hint land on the right panel.

---

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
- **Storage isolation.** The `meeting-assets` and `meeting-recordings` buckets are private and keyed by organization folder (`<org-uuid>/<file>`). Recordings are served through one-hour signed URLs and never through public links.
- **Server-side fan-out.** `notify_workspace()` is `security definer` with a pinned `search_path`, verifies the caller is an active member, validates the type and link, resolves the audience itself and excludes the actor. The existing `notifications_insert` policy stays admin-only, so members cannot forge notifications for each other.
- **Realtime respects RLS.** Published tables keep row-level security; notification subscriptions filter by the signed-in user and workspace, and replica identity `full` only changes how much of a row is echoed, not who may read it.
- **Input validation.** API routes validate email, role and UUID formats and cap request bodies.
- **Abuse control.** Optional Upstash rate limiting on invitations.

If you rotate keys, update Vercel environment variables and redeploy. Never commit real credentials.

---

## Design system

- 68px fixed icon sidebar (`#111315`) with 40×40 blue active tiles and right-side tooltips
- Fixed header with breadcrumb, centered search, notifications and avatar menu
- Notification bell with preference-filtered list, unread badge, safe deep links and a footer that opens the matching settings tab
- Mobile drawer navigation, accessible labels and keyboard support
- Dark surfaces, Manrope/Inter typography, restrained blue accent — no gradients or glow effects
- Modules: Overview, Projects, Tasks, Meetings, Nova Live, Decisions, Knowledge, Workflows, Intelligence, Analytics, Team, Settings
- Nova Live opens a pre-join check (devices, display name, consent), a full-screen room with captions, chat, copilot and people panels, then an ended-meeting summary with the report and the optional recording archive
- Meeting detail shows archived recordings with an inline player, size, duration and a download action
- Workflows expose an inline run log with status, trigger, step outcomes and duration
- Analytics recomputes KPIs, decision mix, workload and project health for 7, 14 or 30 day windows
- Decisions open a detail panel with accept, reject, supersede and reopen actions, a reason note and an append-only status history
- Knowledge opens a full-document reader with section parsing, search highlighting, related notes and source-meeting links

All interactive controls are wired: create dialogs, task status changes, filters, exports, settings persistence, command palette (`Ctrl/⌘ + K`) and toasts.
