# Usmanian — Cursor Project Handbook

**AI agents: read this file first.** It replaces full-repo scans for most tasks.  
Companion brand cheat-sheet: `usmanian.md`. Brand source doc: `Usmanian_Brand_Guidelines.docx` (v1.0 / 2026).  
Update **this file** (and `usmanian.md` if brand/structure changes) whenever you change architecture, routes, tables, or conventions.

---

## 1. What this product is

**Usmanian** is a **private social network for Usman Public School System (UPSS)** students and alumni.

Core product values (do not erode these):

| Value | Meaning in code / product |
|-------|---------------------------|
| **CID-gated membership** | Signup requires student CID + class + campus; accounts start `pending` until admin approval |
| **Privacy by default** | RLS everywhere; only verified users see social data; friend requests are mutual consent |
| **School identity** | UPSS green/gold brand, official shield logo, trusted/warm/clear personality — not a generic startup social app |
| **Mobile-first campus app** | Bottom nav, bottom sheets, safe-area padding, 44px touch targets, `max-w-2xl` shell |
| **Real data only** | No mock feeds — everything loads from Supabase via `src/lib/api/*` |
| **Civic school features** | Vote for Principal + Report a Teacher (reports appear in the shared feed) |

Tagline from README: social for Usmanians only; valid CID; privacy secured; no forced friendships.

---

## 2. Stack (at a glance)

| Layer | Choice |
|-------|--------|
| UI | React 19 + Vite 6 + React Router 7 |
| Styling | Tailwind CSS v4 (`@theme` in `src/index.css` + `tailwind.config.js`) |
| Motion / icons | `motion` (framer), `lucide-react` |
| Backend | Supabase Auth + Postgres + Storage + Realtime |
| Hosting | Vercel (`vercel.json` SPA rewrite → `index.html`) |
| Dev | `npm run dev` → http://localhost:3000 (PowerShell: use `;` not `&&`) |
| Lint | `npm run lint` (= `tsc --noEmit`) · Build: `npm run build` |

Env: copy `.env.example` → `.env.local`. Client needs `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (or `VITE_SUPABASE_PUBLISHABLE_KEY`).  
Supabase project ref: `nwygelibbklfvgnfmtrd` → `https://nwygelibbklfvgnfmtrd.supabase.co`.

---

## 3. Architecture map (where to edit)

```
src/
  main.tsx              → React root
  App.tsx               → AuthProvider + BrowserRouter + routes
  index.css             → Brand tokens, @theme, spacing utilities, canvases
  context/AuthContext.tsx → Session ↔ profiles ↔ authStatus
  components/           → UI building blocks (shell, cards, sheets, composer)
  pages/                → One page per major route
  lib/supabase.ts       → Single Supabase client
  lib/api/              → All data access (no raw queries in pages when avoidable)
  lib/time.ts, share.ts, useKeyboardInset.ts
  types/database.ts     → DB row types + Database shape for client
  types/models.ts       → UI view models (PostView, FeedItem, etc.)
supabase/migrations/    → Schema, RLS, triggers, storage, feature migrations
docs/superpowers/       → Feature specs & plans (e.g. teacher-reports feed)
```

**Data flow:** Page → `lib/api/*` → Supabase (RLS) → map rows → `types/models` views → components.

**Auth gate:** `AuthContext` loads `profiles` after session. Status machine:

`loading` → `loggedOut` | `pendingApproval` | `loggedIn` (only when `verification_status === "approved"`)

`isAuthenticated` === `loggedIn`. Protected routes use `ProtectedRoute`; login/signup use `PublicOnlyRoute`.

---

## 4. Routes

| Path | Access | Page / notes |
|------|--------|----------------|
| `/login`, `/signup` | Public only | AuthCard flows |
| `/pending-approval` | Session, not approved | Waiting for admin |
| `/`, `/feed` | Protected + AppShell | Composer, mixed feed, vote & report modals |
| `/friends` | Protected | Search, requests (`/groups` redirects here) |
| `/activity` | Protected | Notifications |
| `/profile` | Protected | Edit profile, own posts, logout |
| `/admin` | Protected (admin role in UI) | Approve/reject pending profiles |
| `*` | → `/` | |

AppShell: `Header` + `main` (pt ≈ 56px + safe) + `BottomNav`; canvas `.app-canvas`; width `max-w-2xl`.

Promote admin in SQL:  
`update profiles set role = 'admin' where id = '<uuid>';`

---

## 5. Features ↔ files

| Feature | Primary files |
|---------|----------------|
| Auth / signup / pending | `AuthContext`, `LoginPage`, `SignupPage`, `PendingApprovalPage`, `AuthCard` |
| Home feed (posts + reports) | `HomeFeedPage`, `FeedCard`, `PostCard`, `TeacherReportCard`, `lib/api/posts.fetchFeed` |
| Compose post / notes | `PostComposer`, `lib/api/posts.createPost`, `lib/api/storage` |
| Likes / comments | `posts.ts` + `civic.ts` (report engagement), `CommentsSheet` |
| Friends | `FriendsPage`, `lib/api/friendships`, `lib/api/profiles.searchProfiles` |
| Activity | `ActivityPage`, `lib/api/notifications` |
| Profile | `ProfilePage`, `ProfileHeader`, `lib/api/profiles` |
| Admin approvals | `AdminApprovalsPage`, `setVerificationStatus` |
| Vote for Principal | `PinnedActionCard` + vote modal in `HomeFeedPage`, `lib/api/civic` |
| Report a Teacher | Report modal + `submitTeacherReport`; reports land in feed (migration 08) |
| Realtime refresh | Channels in pages (e.g. `HomeFeedPage` on `posts` + `teacher_reports` INSERT) |

Feed model (`types/models.ts`):

```ts
type FeedItem =
  | { kind: "post"; createdAt: string; post: PostView }
  | { kind: "teacher-report"; createdAt: string; report: TeacherReportView };
```

Teacher reports stay in `teacher_reports` (not copied into `posts`) so anonymous reporters never leak via `author_id`. Spec: `docs/superpowers/specs/2026-07-29-teacher-reports-feed-design.md`.

---

## 6. Database & storage

Migrations (apply in order under `supabase/migrations/`):

| File | Purpose |
|------|---------|
| `01_schema` | Core tables |
| `02_rls` | `is_verified` / `is_admin` + policies |
| `03_functions_triggers` | Signup profile hook, etc. |
| `04_storage_realtime` | Buckets + realtime publication |
| `05_profile_signup_fields` | Campus / signup fields |
| `06_seed_principal_candidates` | Vote candidates |
| `07_post_images_public` | Public post-images |
| `08_teacher_reports_feed` | Report likes/comments + feed RLS |
| `09_fix_vote_results_view_security` | Vote results view security |

**Tables:** `profiles`, `posts`, `post_likes`, `post_comments`, `friendships`, `notifications`, `teacher_reports`, `teacher_report_likes`, `teacher_report_comments`, `principal_candidates`, `principal_votes` (+ vote results view).

**Buckets:** `avatars` (public), `post-images` (public), `attachments` (private, signed URLs). Paths: `{user_id}/{filename}`.

**Realtime:** posts, likes, comments, notifications, teacher_reports (+ report engagement per migration 08).

**Signup:** Auth metadata (`full_name`, `student_cid`, `class_name`, `campus`) → trigger `handle_new_user` creates `profiles` with `verification_status = pending`.

**RLS mental model:** Social reads require `is_verified()`. Admins use `is_admin()`. Own-row writes for likes/profile updates. Anonymous teacher reports store `reporter_id = null`.

---

## 7. Brand & UI (non-negotiable)

Personality: **Trusted · Warm · Grounded · Clear** — no unnecessary decoration.

| Token | Hex | Tailwind / use |
|-------|-----|----------------|
| Primary Green | `#0B6E3D` | `primary` — headers, CTAs, active nav, links |
| Primary Dark | `#084D2A` | `primary-container` — pressed/hover |
| Gold (text-safe) | `#8A6200` | `secondary` — badges, verification labels |
| Gold (decorative) | `#D4A017` | `secondary-container` — large surfaces only, **never small text** |
| Error | `#C0392B` | `error` — report accent, destructive |
| Background | `#FAFAF8` | `.app-canvas` / `.auth-canvas` |
| Card surface | `#FFFFFF` | `surface-container-lowest` |
| Text | `#1A1A1A` / `#6B6B6B` | `on-surface` / `on-surface-variant` |
| Border | `#E5E5E0` | `outline-variant` |

- **Logo:** Official UPSS shield only — never recolor/redraw. Min 32px height.
- **Type:** Inter only. Sentence case UI. Body line-height ≥ 1.5. Touch ≥ 44×44. WCAG AA.
- **Product colour rules:** Vote → decorative gold; Report → error as *small* accent; Verified → shield/check + gold or green label.
- **Anti-patterns:** AI purple, cream+serif+terracotta, black startup CTAs, gold as body text, emoji icons, raw hex in components, swapping Inter for display fonts, decorative gradients on canvases.

Tokens live in `src/index.css` `@theme` and are mirrored in `tailwind.config.js`. Spacing via `@utility` (`p-md`, etc.) — **never** put named keys on `--spacing-*` in `@theme` (breaks `max-w-md`). `accent` aliases primary green for legacy classes.

Primary CTA pattern: `bg-primary` + `hover:bg-primary-container`.

---

## 8. How to change things without losing value

### Safe change patterns

1. **UI-only polish** — Edit components/pages; keep brand tokens; reuse `FeedCard` shell for feed items; keep mobile shell (Header / BottomNav / BottomSheet).
2. **New API behavior** — Add/extend functions in `src/lib/api/*`; map to view models in `types/models.ts`; keep pages thin.
3. **New DB capability** — New numbered migration in `supabase/migrations/`; update `types/database.ts`; add/adjust RLS with `is_verified` / `is_admin`; never ship client-only “security”.
4. **New route** — Register in `App.tsx`; wrap with `ProtectedRoute` + `AppShell` if authenticated; update `BottomNav` / Header titles if needed.
5. **New feed item type** — Extend `FeedItem` discriminant; shared visual shell; separate table if privacy/structure differs (same pattern as teacher reports).

### Do not break

- CID + admin approval gate (`pending` → admin → `approved`)
- RLS / verified-only social graph
- Friend request consent model
- Anonymous teacher-report privacy (`reporter_id` null, UI shows “Anonymous Student”)
- Brand tokens and Inter / shield rules
- Mobile-first AppShell and safe areas
- Real Supabase data path (no reintroducing mock feeds)
- One-vote-per-user principal voting (`principal_votes.voter_id` unique)

### When in doubt

- Prefer extending existing API modules over new parallel data layers.
- Prefer shared components (`FeedCard`, `BottomSheet`, `AuthCard`) over one-off layouts.
- Prefer brand tokens over new colours.
- Read the relevant `docs/superpowers/specs/*` before inventing a second design for an existing feature.
- After structural changes, update **this file** and `usmanian.md`.

---

## 9. Conventions checklist (agents)

- [ ] Named colour tokens only — no raw hex in TSX
- [ ] Decorative gold = large surfaces; text gold = `secondary`
- [ ] Data via `src/lib/api/*`, types in `database.ts` / `models.ts`
- [ ] Respect authStatus redirects (don’t show feed to pending users)
- [ ] Preserve anonymous reporter UX for teacher reports
- [ ] Mobile: bottom sheets, 44px targets, safe-area classes
- [ ] PowerShell: `npm run lint; npm run build` (not `&&`)
- [ ] Do not commit `.env.local` or secrets
- [ ] Do not weaken RLS “to make it work” — fix policies properly

---

## 10. Quick “where do I look?” index

| Task | Start here |
|------|------------|
| Fix login / signup / pending | `AuthContext.tsx`, auth pages, migration `03` |
| Feed empty / wrong order | `lib/api/posts.ts` → `fetchFeed` |
| Post create / image upload | `PostComposer`, `storage.ts`, buckets |
| Teacher report in feed | `civic.ts`, `TeacherReportCard`, migration `08`, design spec |
| Vote modal | `HomeFeedPage`, `civic.ts`, candidates seed `06` |
| Friends | `friendships.ts`, `FriendsPage` |
| Notifications | `notifications.ts`, `ActivityPage` + `Header` bell (Realtime on `notifications`) |
| Web Push / PWA | `public/sw.js`, `manifest.json`, `lib/push.ts`, `PushNotificationToggle`, Edge Function `send-push-notification` |
| Admin approve | `AdminApprovalsPage`, `profiles.setVerificationStatus` |
| Colours / spacing look wrong | `index.css`, `tailwind.config.js`, `usmanian.md` |
| RLS denied errors | `02_rls.sql` + later migrations touching that table |
| Deploy routing 404 | `vercel.json` SPA rewrite |

---

## 11. Related docs

| File | Role |
|------|------|
| `cursor.md` | **This handbook** — product, architecture, change rules |
| `usmanian.md` | Compact brand + stack reminder |
| `README.md` | Short human product blurb |
| `docs/superpowers/specs/*` | Feature design decisions |
| `docs/superpowers/plans/*` | Implementation plans |
| `.agents/skills/supabase*` | Supabase / Postgres best-practice skills |

---

*Last oriented from repo state: 2026-07-31. Keep this file current so agents spend tokens on the task, not rediscovery.*
