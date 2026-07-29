# Teacher Reports in the Feed

## Goal

Show every submitted teacher report immediately in every verified user's home feed. Report cards must feel native to the existing product, support likes, comments, and sharing, and preserve anonymous reporter privacy. No admin approval or moderation UI is included.

## User experience

- Submitting the existing “Report a Teacher” form creates a report as it does today.
- The new report is inserted into the submitting user's feed immediately after success.
- Other signed-in, verified users receive it through the existing realtime feed behavior.
- Normal posts and reports are interleaved in reverse chronological order.
- Existing reports are included after the feature is deployed.
- Anonymous reports display “Anonymous Student” and never expose a reporter profile.
- Non-anonymous reports display the submitting student's profile.

## Visual design

Posts and reports use one shared feed-card shell for:

- white surface
- border color and opacity
- `rounded-xl` radius
- clipping and overflow behavior
- header spacing
- body spacing
- divider and action-row spacing
- focus, hover, and toast treatment

The report variant uses the existing design tokens rather than introducing a new visual system:

- a small error-colored report icon and “Teacher Report” category label
- standard surface colors for the card body
- teacher name as the primary report heading
- category and optional class as compact metadata
- description in the same body typography as post content
- timestamp and anonymous/named reporter in the standard secondary text style
- the same Like, Comment, and Share action layout as posts

The red/error color is an accent for identification, not a full-card background.

## Data design

Teacher reports remain in `teacher_reports`; they are not copied into `posts`. This avoids duplicate content, preserves structured fields, and prevents an anonymous reporter's user ID from leaking through `posts.author_id`.

Add:

- `teacher_report_likes`
  - `report_id`
  - `user_id`
  - `created_at`
  - unique `(report_id, user_id)`
- `teacher_report_comments`
  - `id`
  - `report_id`
  - `author_id`
  - `content`
  - `created_at`

Add indexes for report IDs and comment ordering. Add both tables to Supabase realtime.

Update report read access so every verified user can select reports. Keep insert rules unchanged and keep updates admin-only. Anonymous rows continue to store `reporter_id = null`.

RLS for engagement mirrors post engagement:

- verified users may read report likes and comments
- users may create/delete only their own likes
- users may create only their own comments
- comment authors and admins may delete comments

## Application model

Introduce a discriminated feed model:

- `{ kind: "post", ... }`
- `{ kind: "teacher-report", ... }`

Both variants include a stable ID and ISO `createdAt` for sorting. Report view data includes:

- report ID
- reporter display data or anonymous marker
- teacher name
- class
- category
- description
- timestamp
- like count
- comment count
- whether the current user liked it

`fetchFeed` loads posts and reports in parallel, enriches their engagement counts, combines them, sorts by `createdAt`, and returns the newest 50 items.

## Components

- Extract the existing outer card and action row styling into shared feed-card primitives.
- Keep `PostCard` behavior unchanged while switching its outer layout to the shared primitives.
- Add `TeacherReportCard` using the same primitives.
- Generalize `CommentsSheet` to accept an entity kind (`post` or `teacher-report`) and call the matching API.
- Update `HomeFeedPage` to render the discriminated feed union and update counts for either item kind.

## Submission and realtime

After a successful report insert, return the created report view and prepend it to the local feed. This prevents a perceived delay for the submitting user.

Subscribe to `teacher_reports` inserts alongside post inserts. On a new report, refresh or merge the feed using the established feed loading path. Subscribe to report engagement tables only where necessary to avoid noisy whole-feed refreshes.

## Sharing

Sharing a report uses a concise text payload containing:

- “Teacher Report”
- teacher name
- category
- optional class
- description

Reporter identity is omitted from shared text, even for non-anonymous reports.

## Error and empty states

- If reports fail to load but posts succeed, show posts and surface a non-blocking feed warning.
- If engagement fails, restore the previous optimistic state and show the existing in-card toast style.
- The existing empty-feed state remains valid only when both posts and reports are empty.

## Scope exclusions

- Admin approval/rejection
- Report status controls
- Editing or deleting reports
- Notifications for reports
- Report moderation or abuse handling
- Separate report detail pages

## Acceptance criteria

1. A submitted report appears immediately in the submitter's feed.
2. The report appears in other verified users' feeds without approval.
3. Existing and new reports are interleaved chronologically with posts.
4. Anonymous reporter identity is not returned or rendered.
5. Report likes and comments work with optimistic updates and persist.
6. Report cards use the same card geometry, spacing, typography, and action layout as posts.
7. Normal post behavior remains unchanged.
8. Database RLS prevents users from mutating another user's engagement.
9. Type-check, production build, and relevant interaction tests pass.
