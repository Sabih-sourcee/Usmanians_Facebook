-- 02_rls: helpers + row level security for Usmanian

-- Helpers (security definer, locked down)
create or replace function public.is_verified()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.verification_status = 'approved'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

revoke all on function public.is_verified() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.is_verified() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.friendships enable row level security;
alter table public.notifications enable row level security;
alter table public.teacher_reports enable row level security;
alter table public.principal_candidates enable row level security;
alter table public.principal_votes enable row level security;

-- ========== profiles ==========
create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles_select_approved_if_verified"
  on public.profiles for select to authenticated
  using (
    public.is_verified()
    and verification_status = 'approved'
  );

create policy "profiles_select_admin_all"
  on public.profiles for select to authenticated
  using (public.is_admin());

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "profiles_update_admin"
  on public.profiles for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ========== posts ==========
create policy "posts_select_verified"
  on public.posts for select to authenticated
  using (public.is_verified());

create policy "posts_insert_own_verified"
  on public.posts for insert to authenticated
  with check (
    public.is_verified()
    and author_id = (select auth.uid())
  );

create policy "posts_update_own"
  on public.posts for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

create policy "posts_delete_own"
  on public.posts for delete to authenticated
  using (author_id = (select auth.uid()));

create policy "posts_delete_admin"
  on public.posts for delete to authenticated
  using (public.is_admin());

-- ========== post_likes ==========
create policy "post_likes_select_verified"
  on public.post_likes for select to authenticated
  using (public.is_verified());

create policy "post_likes_insert_own_verified"
  on public.post_likes for insert to authenticated
  with check (
    public.is_verified()
    and user_id = (select auth.uid())
  );

create policy "post_likes_delete_own"
  on public.post_likes for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "post_likes_delete_admin"
  on public.post_likes for delete to authenticated
  using (public.is_admin());

-- ========== post_comments ==========
create policy "post_comments_select_verified"
  on public.post_comments for select to authenticated
  using (public.is_verified());

create policy "post_comments_insert_own_verified"
  on public.post_comments for insert to authenticated
  with check (
    public.is_verified()
    and author_id = (select auth.uid())
  );

create policy "post_comments_update_own"
  on public.post_comments for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

create policy "post_comments_delete_own"
  on public.post_comments for delete to authenticated
  using (author_id = (select auth.uid()));

create policy "post_comments_delete_admin"
  on public.post_comments for delete to authenticated
  using (public.is_admin());

-- ========== friendships ==========
create policy "friendships_select_participants"
  on public.friendships for select to authenticated
  using (
    user_id = (select auth.uid())
    or friend_id = (select auth.uid())
  );

create policy "friendships_insert_as_requester"
  on public.friendships for insert to authenticated
  with check (
    public.is_verified()
    and user_id = (select auth.uid())
  );

create policy "friendships_update_participants"
  on public.friendships for update to authenticated
  using (
    user_id = (select auth.uid())
    or friend_id = (select auth.uid())
  )
  with check (
    user_id = (select auth.uid())
    or friend_id = (select auth.uid())
  );

create policy "friendships_delete_participants"
  on public.friendships for delete to authenticated
  using (
    user_id = (select auth.uid())
    or friend_id = (select auth.uid())
  );

-- ========== notifications ==========
-- No public insert — triggers only (security definer)
create policy "notifications_select_own"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));

create policy "notifications_update_own"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ========== teacher_reports ==========
create policy "teacher_reports_select_reporter_or_admin"
  on public.teacher_reports for select to authenticated
  using (
    public.is_admin()
    or (reporter_id is not null and reporter_id = (select auth.uid()))
  );

create policy "teacher_reports_insert_verified"
  on public.teacher_reports for insert to authenticated
  with check (
    public.is_verified()
    and (
      (is_anonymous = true and reporter_id is null)
      or (is_anonymous = false and reporter_id = (select auth.uid()))
    )
  );

create policy "teacher_reports_update_admin"
  on public.teacher_reports for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ========== principal_candidates ==========
create policy "principal_candidates_select_verified"
  on public.principal_candidates for select to authenticated
  using (public.is_verified());

create policy "principal_candidates_insert_admin"
  on public.principal_candidates for insert to authenticated
  with check (public.is_admin());

create policy "principal_candidates_update_admin"
  on public.principal_candidates for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "principal_candidates_delete_admin"
  on public.principal_candidates for delete to authenticated
  using (public.is_admin());

-- ========== principal_votes ==========
-- No update/delete policies — votes immutable
create policy "principal_votes_select_own"
  on public.principal_votes for select to authenticated
  using (voter_id = (select auth.uid()));

create policy "principal_votes_select_admin"
  on public.principal_votes for select to authenticated
  using (public.is_admin());

create policy "principal_votes_insert_own_verified"
  on public.principal_votes for insert to authenticated
  with check (
    public.is_verified()
    and voter_id = (select auth.uid())
  );

-- Expose tables to Data API roles
grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
