# Usmanian — Brand & Stack Cheat-Sheet

Private network for **Usman Public School System** students & alumni. React 19 + Vite 6 + React Router 7 + Tailwind CSS v4 + Supabase (Auth, Postgres, Storage, Realtime). Dev: `npm run dev` → http://localhost:3000.

**AI agents: read `cursor.md` first** (full handbook: product value, architecture, safe changes). This file is the compact brand/stack reminder. Brand source: `Usmanian_Brand_Guidelines.docx` (v1.0 / 2026).

---

## Brand (non-negotiable)

Personality: Trusted · Warm · Grounded · Clear (no unnecessary decoration).

| Token | Hex | Use |
|-------|-----|-----|
| Primary Green | `#0B6E3D` | Headers, primary buttons, active nav, links |
| Primary Dark | `#084D2A` | Pressed/hover for green (`primary-container`) |
| Accent Gold (text-safe) | `#8A6200` | Badges, verification labels, small icons (`secondary`) |
| Accent Gold (decorative) | `#D4A017` | Large surfaces only — banner bars, civic card tops (`secondary-container`) — **never small text** |
| Error | `#C0392B` | Report flows, destructive, validation |
| Background | `#FAFAF8` | App canvas — warm off-white |
| Surface / Card | `#FFFFFF` | Cards |
| Text Primary | `#1A1A1A` | Body & headings |
| Text Secondary | `#6B6B6B` | Timestamps, helper |
| Border | `#E5E5E0` | Dividers / card borders |

**Logo:** Official UPSS shield only — never recolor/redraw. Min 32px height. Clear space ≥ one star. On dark UI, put shield on a white/off-white plate.

**Type:** Inter — Display 24/700, Headline 18–20/600, Body 16/400, Label 14/500, Caption 12/500. Sentence case UI. Line-height ≥ 1.5 for body. Tag chips may be UPPERCASE + tracking.

**Product rules:**
- Vote for Principal → decorative gold treatment
- Report a Teacher → error as *small accent*, not dominant surface colour
- Verified Usmanian → shield/check + label in text-safe gold or primary green
- Colour never sole signal; touch ≥ 44×44; WCAG AA 4.5:1 body

**Anti-patterns:** lavender AI purple · cream+serif+terracotta · black “startup” CTAs · decorative gold as text · Inter swapped for trendy display fonts · emoji icons · hardcoded hex in components

---

## Stack / routes

Entry: `main.tsx` → `App.tsx` + `index.css`. Auth: `AuthContext` → Supabase Auth + `profiles`. **No mock data** — feed/friends/activity/profile load from Supabase via `src/lib/api/*`.

| Path | Access | Page |
|------|--------|------|
| `/login` `/signup` | PublicOnly | AuthCard |
| `/pending-approval` | Session + not approved | AuthCard pending |
| `/` `/feed` | Protected + AppShell | Composer, feed, vote, report |
| `/friends` (`/groups` → redirect) | Protected | Friend search / requests |
| `/activity` | Protected | Notifications |
| `/profile` | Protected | Edit profile, posts, notes, logout |
| `/admin` | Protected (admin role) | Approve/reject pending profiles |

AppShell: Header + main (`pt` 56px+safe) + BottomNav; `max-w-2xl`; `min-h-dvh`; `.app-canvas`. Mobile-first: bottom sheets, safe-area padding, 44px targets.

### Supabase

- Project: `nwygelibbklfvgnfmtrd` → https://nwygelibbklfvgnfmtrd.supabase.co
- Client: `src/lib/supabase.ts` (`VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`)
- Tables: `profiles`, `posts`, `post_likes`, `post_comments`, `friendships`, `notifications`, `teacher_reports`, `principal_candidates`, `principal_votes`
- Buckets: `avatars` (public), `post-images` (public), `attachments` (private, signed URLs) — path `{user_id}/{filename}`
- Realtime: `posts`, `post_likes`, `post_comments`, `notifications`
- Migrations: `supabase/migrations/` (01–07). Signup creates `profiles` via `handle_new_user` (`pending`).
- Auth statuses: `loading` → `loggedOut` | `pendingApproval` | `loggedIn` (approved only)
- Make admin: `update profiles set role = 'admin' where id = '<uuid>';`

---

## Tokens in code

Defined in `src/index.css` `@theme` + mirrored in `tailwind.config.js`. Spacing only via `@utility` (`p-md`, etc.) — **never** `--spacing-md` in `@theme` (breaks `max-w-md`).

`accent` aliases Primary Green for legacy class names.

---

## Conventions

1. Named colour tokens only — no raw hex in components
2. Decorative gold (`secondary-container`) = large surfaces; text gold = `secondary` `#8A6200`
3. Primary CTA = `bg-primary` + `hover:bg-primary-container`
4. Update this file when brand or structure changes

## Commands

`npm run dev` · `npm run build` · `npm run lint` — PowerShell uses `;` not `&&`.
