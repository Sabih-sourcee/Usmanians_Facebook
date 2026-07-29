# Teacher Reports Feed Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Show every submitted teacher report in every verified user's home feed with likes, comments, and share, using the same visual card system as posts.

**Architecture:** Keep reports in `teacher_reports`. Add engagement tables. Widen SELECT RLS to verified users. Merge posts + reports in `fetchFeed`. Share one feed-card shell between `PostCard` and `TeacherReportCard`.

**Tech Stack:** React, Vite, Supabase, Tailwind

## Global Constraints

- No admin approval UI
- Anonymous reporters never leak identity
- Report cards must match post card geometry and action layout
- Existing post behavior unchanged

---

### Task 1: Database migration

- [ ] Add `teacher_report_likes` and `teacher_report_comments`
- [ ] Replace report SELECT policy with verified-user read
- [ ] Add RLS + realtime for engagement tables

### Task 2: Types + report APIs

- [ ] Extend `database.ts` / `models.ts`
- [ ] Add report fetch/enrich/like/comment/submit-return in `civic.ts`
- [ ] Merge feed in `posts.ts` (`fetchFeed`)

### Task 3: UI components

- [ ] Shared `FeedCard` shell
- [ ] `TeacherReportCard`
- [ ] Generalize `CommentsSheet`
- [ ] Wire `HomeFeedPage` + realtime

### Task 4: Verify

- [ ] Typecheck + build
- [ ] Apply migration if Supabase CLI available
