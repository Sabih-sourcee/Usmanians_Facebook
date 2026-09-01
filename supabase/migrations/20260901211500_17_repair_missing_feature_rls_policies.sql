-- Repair migration: the Part 2 feature tables from migration 13 (post_votes,
-- user_points, point_transactions, shop_items, redemption_requests, referrals,
-- referral_prizes, explainer_video_submissions, banners) currently have RLS
-- enabled with ZERO policies live on the database (confirmed via advisors),
-- and daily_login_claims / daily_comment_awards have RLS disabled entirely.
-- Net effect: every authenticated client-side read of these tables silently
-- returns 0 rows (e.g. /referrals always shows "0 referrals" even when rows
-- exist), while the two RLS-disabled tables are wide open over the REST API.
-- This migration is idempotent and safe to re-run.

alter table public.daily_login_claims enable row level security;
alter table public.daily_comment_awards enable row level security;

-- ---------- post_votes ----------
drop policy if exists "post_votes_select_verified" on public.post_votes;
create policy "post_votes_select_verified"
  on public.post_votes for select to authenticated
  using (public.is_verified());

drop policy if exists "post_votes_upsert_own" on public.post_votes;
create policy "post_votes_upsert_own"
  on public.post_votes for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_verified());

drop policy if exists "post_votes_update_own" on public.post_votes;
create policy "post_votes_update_own"
  on public.post_votes for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "post_votes_delete_own" on public.post_votes;
create policy "post_votes_delete_own"
  on public.post_votes for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, update, delete on public.post_votes to authenticated;

-- ---------- user_points / point_transactions ----------
drop policy if exists "user_points_select_own_or_admin" on public.user_points;
create policy "user_points_select_own_or_admin"
  on public.user_points for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "point_transactions_select_own_or_admin" on public.point_transactions;
create policy "point_transactions_select_own_or_admin"
  on public.point_transactions for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

grant select on public.user_points to authenticated;
grant select on public.point_transactions to authenticated;

-- ---------- shop_items / redemption_requests ----------
drop policy if exists "shop_items_select_verified" on public.shop_items;
create policy "shop_items_select_verified"
  on public.shop_items for select to authenticated
  using (public.is_verified());

drop policy if exists "shop_items_admin_write" on public.shop_items;
create policy "shop_items_admin_write"
  on public.shop_items for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "redemption_requests_select_own_or_admin" on public.redemption_requests;
create policy "redemption_requests_select_own_or_admin"
  on public.redemption_requests for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "redemption_requests_insert_own" on public.redemption_requests;
create policy "redemption_requests_insert_own"
  on public.redemption_requests for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_verified());

drop policy if exists "redemption_requests_update_admin" on public.redemption_requests;
create policy "redemption_requests_update_admin"
  on public.redemption_requests for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.shop_items to authenticated;
grant select, insert on public.redemption_requests to authenticated;

-- ---------- referrals / referral_prizes ----------
drop policy if exists "referrals_select_verified" on public.referrals;
create policy "referrals_select_verified"
  on public.referrals for select to authenticated
  using (public.is_verified());

drop policy if exists "referral_prizes_select_verified" on public.referral_prizes;
create policy "referral_prizes_select_verified"
  on public.referral_prizes for select to authenticated
  using (public.is_verified());

drop policy if exists "referral_prizes_admin_write" on public.referral_prizes;
create policy "referral_prizes_admin_write"
  on public.referral_prizes for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.referrals to authenticated;
grant select on public.referral_prizes to authenticated;

-- referrals_insert_own_signup (defense in depth) was added in migration 15;
-- re-assert it here in case it was also lost.
drop policy if exists "referrals_insert_own_signup" on public.referrals;
create policy "referrals_insert_own_signup"
  on public.referrals for insert to authenticated
  with check (referred_id = (select auth.uid()));

grant insert on public.referrals to authenticated;

-- ---------- explainer_video_submissions ----------
drop policy if exists "explainer_videos_select_own_or_admin" on public.explainer_video_submissions;
create policy "explainer_videos_select_own_or_admin"
  on public.explainer_video_submissions for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "explainer_videos_insert_own" on public.explainer_video_submissions;
create policy "explainer_videos_insert_own"
  on public.explainer_video_submissions for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_verified());

drop policy if exists "explainer_videos_update_admin" on public.explainer_video_submissions;
create policy "explainer_videos_update_admin"
  on public.explainer_video_submissions for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert on public.explainer_video_submissions to authenticated;

-- ---------- banners ----------
drop policy if exists "banners_select_verified" on public.banners;
create policy "banners_select_verified"
  on public.banners for select to authenticated
  using (public.is_verified());

drop policy if exists "banners_admin_write" on public.banners;
create policy "banners_admin_write"
  on public.banners for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.banners to authenticated;
