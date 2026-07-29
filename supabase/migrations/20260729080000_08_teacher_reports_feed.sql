-- 08_teacher_reports_feed: public feed visibility + likes/comments for reports

-- Engagement tables
create table public.teacher_report_likes (
  report_id uuid not null references public.teacher_reports (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);

create table public.teacher_report_comments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.teacher_reports (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index teacher_report_comments_report_id_idx
  on public.teacher_report_comments (report_id);

create index teacher_report_comments_created_at_idx
  on public.teacher_report_comments (created_at);

create index teacher_reports_created_at_desc_idx
  on public.teacher_reports (created_at desc);

-- RLS
alter table public.teacher_report_likes enable row level security;
alter table public.teacher_report_comments enable row level security;

-- Every verified user can read reports in the campus feed
drop policy if exists "teacher_reports_select_reporter_or_admin" on public.teacher_reports;

create policy "teacher_reports_select_verified"
  on public.teacher_reports for select to authenticated
  using (public.is_verified());

-- Likes
create policy "teacher_report_likes_select_verified"
  on public.teacher_report_likes for select to authenticated
  using (public.is_verified());

create policy "teacher_report_likes_insert_own_verified"
  on public.teacher_report_likes for insert to authenticated
  with check (
    public.is_verified()
    and user_id = (select auth.uid())
  );

create policy "teacher_report_likes_delete_own"
  on public.teacher_report_likes for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "teacher_report_likes_delete_admin"
  on public.teacher_report_likes for delete to authenticated
  using (public.is_admin());

-- Comments
create policy "teacher_report_comments_select_verified"
  on public.teacher_report_comments for select to authenticated
  using (public.is_verified());

create policy "teacher_report_comments_insert_own_verified"
  on public.teacher_report_comments for insert to authenticated
  with check (
    public.is_verified()
    and author_id = (select auth.uid())
  );

create policy "teacher_report_comments_update_own"
  on public.teacher_report_comments for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

create policy "teacher_report_comments_delete_own"
  on public.teacher_report_comments for delete to authenticated
  using (author_id = (select auth.uid()));

create policy "teacher_report_comments_delete_admin"
  on public.teacher_report_comments for delete to authenticated
  using (public.is_admin());

grant select, insert, update, delete on public.teacher_report_likes to authenticated;
grant select, insert, update, delete on public.teacher_report_comments to authenticated;

-- Realtime
do $$
begin
  alter publication supabase_realtime add table public.teacher_reports;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.teacher_report_likes;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.teacher_report_comments;
exception when duplicate_object then null;
end $$;
