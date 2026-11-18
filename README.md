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
│  │  ├─ i18n/                 locale state, dictionaries and formatters
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
   ├─ migrations/0008_team_management.sql      roles, removals and project access
   ├─ migrations/0009_meeting_insights.sql     insight queue, review RPCs and Realtime
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
| `npm run test:e2e` | Run the Playwright browser suite |
| `npm run test:e2e:ui` | Open the Playwright UI runner |

### Testing & CI

Tests use Vitest with jsdom, Testing Library and jest-dom. The suite covers pure helpers, metric builders, range-derived analytics, enum guards, the transcript analyzer, the live-meeting intelligence and Knowledge note, the demo data store and its meeting pipeline (analyze → commit), Nova Live persistence, recording formatting and archive storage, notification preference filtering and deep-link safety, the demo workspace event bus, action-driven notification delivery, team role hierarchy rules, member removal and project-access sync, the insight review queue and its task/decision conversion, the workflow run log, sidebar accessibility, route metadata and document titles, the error boundaries, the 404 page, locale switching and locale-aware formatting, and a task-board interaction end to end.

```bash
cd frontend
npm run test
```

`src/test/setup.ts` provides the small browser API shims Radix and Recharts need. Tests never call Supabase or the network — demo mode keeps them deterministic.

The Playwright suite drives the real app in Chromium: every workspace route, keyboard skip navigation, 404 recovery, task creation, the insight review flow, filters and the mobile navigation drawer. Install the browser once, then run the suite:

```bash
cd frontend
npx playwright install chromium
npm run test:e2e
```

`e2e/a11y.spec.ts` runs an axe-core audit (`@axe-core/playwright`) against WCAG 2.0/2.1/2.2 A and AA rules on every route plus the insight detail dialog, the create-task dialog, the command palette, the notifications panel and the user menu. The suite fails on any violation, so accessibility regressions block CI just like a broken test.

Playwright starts its own Vite server on `127.0.0.1:4173`, so the dev server does not need to be running. CI runs the browser suite in a separate job and uploads the HTML report when it fails.

GitHub Actions runs `lint → typecheck → test → build` plus the Playwright job on every push and pull request to `main` (`.github/workflows/ci.yml`).

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
8. `supabase/migrations/0008_team_management.sql`
9. `supabase/migrations/0009_meeting_insights.sql`
10. `supabase/seed.sql` — optional demo workspace. Requires at least one auth user; sign up once first.

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
- `update_member_role()`, `remove_workspace_member()` and
  `set_member_projects()` (added in `0008`) for hierarchy-aware team management
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

The eighth migration makes team management explicit. Direct writes to `organization_members` are disabled and `project_members` writes are restricted to owners/admins. Three security-definer RPCs enforce the hierarchy: `update_member_role()` (owner fixed, no self-change, admins cannot manage admins or grant admin), `remove_workspace_member()` (no self-removal, no owner removal, revokes project memberships) and `set_member_projects()` (active members only, validates project ownership and keeps project owners in their own project). Role and project changes write an activity and notify the affected member with a `/team?member=<id>` deep link. `organization_members` and `project_members` are published to Realtime so every open tab refreshes.

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

## AI Intelligence

AI Intelligence is a reviewed queue, not a second meeting summary. Every signal keeps the meeting it came from, an owner, a confidence score and an optional source excerpt.

- **One queue, four kinds.** `summary`, `decision`, `action` and `risk` insights land in `/intelligence`. The page has KPI counts, kind and status filters, search across title, owner, meeting and project, and a detail panel opened through `/intelligence?insight=<id>` so notifications and links land on the exact signal.
- **Review actions.** Owners, admins and members can accept, dismiss or reopen a signal with an optional note. Viewers can read the queue but the write controls are hidden and the RPCs reject the change.
- **Convert to work.** An accepted signal can become a task (project, priority, due date, assignee) or a proposed decision (impact). The insight becomes `converted`, keeps a deep link to the new record, and the task or decision opens from the card or the detail panel.
- **Demo and live parity.** Both paths build candidates with `buildInsightCandidates` in `src/lib/insights.ts`. Demo mode applies the rules in `mocks/db.ts`; live mode sends the same candidates to the `0009` security-definer RPCs, which validate membership and enforce the viewer guard. Re-analysis preserves accepted, dismissed and converted signals and rebuilds only the generated open ones.
- **Notifications.** Accept/dismiss/reopen uses the `mentions` preference with a `/intelligence?insight=<id>` link. Converting to a task notifies the assignee, and converting to a decision notifies the workspace through the existing notification audiences.
- **Realtime.** `meeting_insights` is published to Supabase Realtime, so a review in one tab refreshes the queue in another. Demo mode uses the same workspace event bus as the rest of the app.

---

## Notifications & realtime

Notifications are produced by workspace actions, not by a scheduled job that guesses what happened. The bell in the header is a filtered, deep-linked inbox.

- **Action-driven.** Completing or updating a task, changing a decision status, saving or analyzing a meeting, creating follow-ups and archiving a recording all raise a notification through `dispatchWorkspaceNotification`. Demo mode mirrors this in `mocks/db.ts`, so the flow is testable without credentials.
- **Audiences.** Decision changes go to every active member except the actor; meeting events go to the meeting's participants; task events go to the assignee. The audience is resolved by the `notify_workspace()` RPC, so the client never writes rows for another user.
- **Preferences actually filter.** Each notification type maps to one switch in **Settings → Notifications** (`meetingBriefs`, `actionItems`, `decisionReviews`, `weeklyDigest`, `mentions`). The mapping lives in `src/lib/notifications.ts`, so the bell badge, the list and the settings page cannot drift. Switching a type off hides it from the menu and from the unread count immediately; the menu says how many items are hidden and links to the settings tab.
- **Deep links.** Every notification carries a `link` to the object that produced it, for example `/decisions?decision=d-03`, `/tasks?task=<id>` or `/meetings/<id>`. Links are validated in the UI and by a database check constraint: only single-slash internal paths are accepted, everything else falls back to the module landing page.
- **Live delivery.** `use-workspace-realtime.ts` subscribes to Supabase Realtime for `notifications`, `tasks`, `decisions`, `meetings`, `meeting_recordings`, `meeting_insights`, `knowledge_documents`, `organization_members` and `project_members`. Notification inserts show a toast and refresh the bell; other tables invalidate the matching TanStack Query keys. Notification and task channels are filtered by `user_id` / `organization_id`, and RLS still applies to every payload.
- **Demo delivery.** Without credentials the same hook subscribes to the `BroadcastChannel` bus in `src/lib/workspace-events.ts`. Open the app in two tabs: an action in one tab shows a toast, updates the bell and refreshes the list in the other. Only notifications carry their payload across tabs; other demo resources invalidate queries because each tab keeps its own in-memory store.
- **Settings deep link.** Settings tabs are URL-controlled (`/settings?tab=notifications`), so the bell footer and the empty-state hint land on the right panel.

---

## Team management & roles

The Team directory is a working permission surface. Clicking a member card opens a detail panel at `/team?member=<id>`, so team notifications deep-link straight to the person who changed.

- **Member detail.** Shows role, status, workload, member-since, open assignments and project access. The same panel is read-only for viewers and members.
- **Roles.** Only owners and admins can change roles. The owner role is fixed; admins can assign `member` and `viewer`, while only the owner can promote or demote an admin. Nobody can change their own role. Every change writes an activity and notifies the member through the `mentions` preference.
- **Removal.** Removing a member revokes their project memberships but keeps task history. Pending invitations are revoked from the same panel. Owners cannot be removed, admins cannot remove other admins and nobody can remove themselves.
- **Project access.** Owners and admins assign projects from the detail panel. Access is limited to accepted members, project owners always stay in their own project, and the project's member list is updated in the same action.
- **Demo and live parity.** Demo mode enforces the same rules in `mocks/db.ts`; live mode calls the `0008` security-definer RPCs. Both paths write activities, notifications and workspace events, so another tab refreshes without a manual reload.
- **Invite gating.** The invite action is only rendered for owners and admins; the API route re-checks the caller's active role before sending anything.

---

## Internationalization

- English is the source language and the default; Turkish is available from **Settings → Profile → Interface language**.
- The layer is intentionally small (`src/i18n/`): English strings are the keys, `messages/tr.ts` maps them to Turkish, and a missing entry falls back to readable English instead of a raw key.
- `I18nProvider` reads the persisted locale from `usePreferencesStore`, keeps `<html lang>` in sync and exposes `t`, `plural` and locale-aware `Intl` formatters for dates, times, numbers, relative time, due dates and greetings.
- The preference is stored under `nova-preferences`, so the choice survives reloads. Components rendered without the provider (isolated unit tests) always fall back to English.
- UI copy is translated; workspace data such as meeting titles, project names and AI answers stay in their original language. CSV export headers and values remain English for portability, and workflow trigger/step values stay in English as canonical storage keys while their labels are translated.
- `e2e/a11y.spec.ts` runs in the default English locale, so the axe gate covers the shipped default experience.

---

## Performance

- The shell, auth guard and login screen load eagerly; every workspace page is a `React.lazy` route chunk that arrives on first visit.
- `AppLayout` owns a single `Suspense` boundary with `PageSkeleton`, so navigation keeps the sidebar and header mounted while the next page streams in. Nova Live has its own full-screen fallback.
- Charts, dialogs and the mock dataset are split into their own chunks. The production build emits page chunks of 5–26 kB; the entry bundle stays around 343 kB (≈100 kB gzip) with no Vite 500 kB warning.

---

## Resilience & accessibility

- A route-level `ErrorBoundary` wraps the page outlet, so a render error keeps the sidebar, header and navigation usable. Failed route chunks are recognised and offer a reload instead of a retry loop; an app-level boundary covers the shell as a last resort.
- Navigating moves focus to the `<main>` landmark and resets scroll, while the first load leaves focus untouched.
- A skip link jumps straight to `#main-content`, and every route sets a meaningful document title (`Tasks — Nova`, `Meeting detail — Nova`, …). Detail routes resolve their breadcrumb to the owning module instead of falling back to Overview.
- Unknown paths are labelled "Not found" in both the breadcrumb and the tab title.
- **WCAG 2.2 AA is enforced in CI.** `e2e/a11y.spec.ts` audits all 14 workspace routes and the main overlays with axe and fails on any violation.
- Solid primary buttons, badges and toast actions use `--primary-strong` so white text clears 4.5:1, while `--primary` stays for links and icons on dark surfaces. Muted captions use the full `--muted-foreground` token instead of a reduced opacity.
- Scrollable transcript and notification regions are keyboard focusable, every `Progress` bar has an accessible name, charts inside `aria-hidden` wrappers opt out of the Recharts accessibility layer, and the meeting timeline filter is a labelled toggle group (`aria-pressed`) instead of tabs without panels.

---

## Deployment

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
- **Team hierarchy.** Membership writes go through `security definer` RPCs with a pinned `search_path`; direct authenticated writes to `organization_members` are disabled and `project_members` writes are limited to owners/admins. The RPCs reject owner demotion/removal, self-changes, admin-on-admin changes and assigning the owner role, so the UI rules are also enforced server-side.
- **Insight review.** `meeting_insights` is select-only for authenticated clients. Accepting, dismissing, converting and syncing all run through `0009` security-definer RPCs that verify active membership, reject viewers, keep converted links consistent and write the activity and notification in the same transaction.
- **Input validation.** API routes validate email, role and UUID formats and cap request bodies.
- **Abuse control.** Optional Upstash rate limiting on invitations.

If you rotate keys, update Vercel environment variables and redeploy. Never commit real credentials.

---

## Design system

- 68px fixed icon sidebar (`#111315`) with 40×40 blue active tiles and right-side tooltips
- Fixed header with breadcrumb, centered search, notifications and avatar menu
- Notification bell with preference-filtered list, unread badge, safe deep links and a footer that opens the matching settings tab
- Mobile drawer navigation, accessible labels and keyboard support
- Language switcher in Settings with native language names, `aria-pressed` state and a persisted choice
- Dark surfaces, Manrope/Inter typography, restrained blue accent — no gradients or glow effects
- Modules: Overview, Projects, Tasks, Meetings, Nova Live, Decisions, Knowledge, Workflows, Intelligence, Analytics, Team, Settings
- Nova Live opens a pre-join check (devices, display name, consent), a full-screen room with captions, chat, copilot and people panels, then an ended-meeting summary with the report and the optional recording archive
- Meeting detail shows archived recordings with an inline player, size, duration and a download action
- Workflows expose an inline run log with status, trigger, step outcomes and duration
- Analytics recomputes KPIs, decision mix, workload and project health for 7, 14 or 30 day windows
- Decisions open a detail panel with accept, reject, supersede and reopen actions, a reason note and an append-only status history
- Knowledge opens a full-document reader with section parsing, search highlighting, related notes and source-meeting links
- Team cards open a management panel for role changes, project access, open assignments and member removal, gated by the caller's role

All interactive controls are wired: create dialogs, task status changes, filters, exports, settings persistence, command palette (`Ctrl/⌘ + K`) and toasts.
