-- 13: Archive teacher reports + notes/points/shop/referrals/banners

-- ========== Part 1: Archive existing teacher reports ==========
update public.teacher_reports set status = 'archived' where status is distinct from 'archived';

alter table public.teacher_reports
  drop constraint if exists teacher_reports_status_check;

alter table public.teacher_reports
  add constraint teacher_reports_status_check check (status in ('open', 'archived'));

drop policy if exists "teacher_reports_select_verified" on public.teacher_reports;
create policy "teacher_reports_select_verified"
  on public.teacher_reports for select to authenticated
  using (public.is_verified() and (status = 'open' or public.is_admin()));

drop policy if exists "teacher_report_likes_select_verified" on public.teacher_report_likes;
create policy "teacher_report_likes_select_verified"
  on public.teacher_report_likes for select to authenticated
  using (
    public.is_verified()
    and exists (
      select 1 from public.teacher_reports tr
      where tr.id = report_id and (tr.status = 'open' or public.is_admin())
    )
  );

drop policy if exists "teacher_report_likes_insert_own_verified" on public.teacher_report_likes;
create policy "teacher_report_likes_insert_own_verified"
  on public.teacher_report_likes for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_verified()
    and exists (
      select 1 from public.teacher_reports tr
      where tr.id = report_id and tr.status = 'open'
    )
  );

drop policy if exists "teacher_report_comments_select_verified" on public.teacher_report_comments;
create policy "teacher_report_comments_select_verified"
  on public.teacher_report_comments for select to authenticated
  using (
    public.is_verified()
    and exists (
      select 1 from public.teacher_reports tr
      where tr.id = report_id and (tr.status = 'open' or public.is_admin())
    )
  );

drop policy if exists "teacher_report_comments_insert_own_verified" on public.teacher_report_comments;
create policy "teacher_report_comments_insert_own_verified"
  on public.teacher_report_comments for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and public.is_verified()
    and exists (
      select 1 from public.teacher_reports tr
      where tr.id = report_id and tr.status = 'open'
    )
  );

-- ========== Part 2A: Extended notes fields ==========
alter table public.posts
  add column if not exists grade_level text,
  add column if not exists topic_tag text,
  add column if not exists attestation_accepted boolean not null default false,
  add column if not exists note_campus text;

create index if not exists posts_notes_browse_idx
  on public.posts (type, subject, grade_level, note_campus, created_at desc)
  where type = 'shared_notes';

-- Upvote/downvote for notes
create table if not exists public.post_votes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  vote smallint not null check (vote in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.post_votes enable row level security;

create policy "post_votes_select_verified"
  on public.post_votes for select to authenticated
  using (public.is_verified());

create policy "post_votes_upsert_own"
  on public.post_votes for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_verified());

create policy "post_votes_update_own"
  on public.post_votes for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "post_votes_delete_own"
  on public.post_votes for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, update, delete on public.post_votes to authenticated;

-- ========== Part 2B: Points ==========
create table if not exists public.user_points (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null,
  reason text not null,
  reference_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists point_transactions_user_created_idx
  on public.point_transactions (user_id, created_at desc);

create table if not exists public.daily_login_claims (
  user_id uuid not null references public.profiles (id) on delete cascade,
  claim_date date not null default current_date,
  primary key (user_id, claim_date)
);

create table if not exists public.daily_comment_awards (
  user_id uuid not null references public.profiles (id) on delete cascade,
  award_date date not null default current_date,
  count integer not null default 0,
  primary key (user_id, award_date)
);

alter table public.user_points enable row level security;
alter table public.point_transactions enable row level security;
alter table public.daily_login_claims enable row level security;
alter table public.daily_comment_awards enable row level security;

create policy "user_points_select_own_or_admin"
  on public.user_points for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy "point_transactions_select_own_or_admin"
  on public.point_transactions for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create or replace function public.award_points_internal(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_reference_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_amount = 0 then return; end if;
  insert into public.user_points (user_id, balance)
  values (p_user_id, greatest(p_amount, 0))
  on conflict (user_id) do update
    set balance = greatest(0, public.user_points.balance + p_amount),
        updated_at = now();
  insert into public.point_transactions (user_id, amount, reason, reference_id)
  values (p_user_id, p_amount, p_reason, p_reference_id);
end;
$$;

create or replace function public.claim_daily_login()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  pts constant integer := 5;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  insert into public.daily_login_claims (user_id, claim_date) values (uid, current_date)
  on conflict do nothing;
  if not found then return 0; end if;
  perform public.award_points_internal(uid, pts, 'daily_login', null);
  return pts;
end;
$$;

create or replace function public.award_note_post_points(p_post_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  pts constant integer := 15;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if not exists (
    select 1 from public.posts p
    where p.id = p_post_id and p.author_id = uid and p.type = 'shared_notes'
  ) then
    raise exception 'invalid note post';
  end if;
  perform public.award_points_internal(uid, pts, 'note_post', p_post_id);
  return pts;
end;
$$;

create or replace function public.award_comment_points()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  pts constant integer := 2;
  max_daily constant integer := 10;
  current_count integer;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  insert into public.daily_comment_awards (user_id, award_date, count)
  values (uid, current_date, 0)
  on conflict (user_id, award_date) do nothing;
  select count into current_count
  from public.daily_comment_awards
  where user_id = uid and award_date = current_date
  for update;
  if current_count >= max_daily then return 0; end if;
  update public.daily_comment_awards
  set count = count + 1
  where user_id = uid and award_date = current_date;
  perform public.award_points_internal(uid, pts, 'comment', null);
  return pts;
end;
$$;

grant execute on function public.claim_daily_login() to authenticated;
grant execute on function public.award_note_post_points(uuid) to authenticated;
grant execute on function public.award_comment_points() to authenticated;

-- ========== Part 2C: Shop ==========
create table if not exists public.shop_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('gamer_tech', 'educational')),
  point_cost integer not null check (point_cost > 0),
  stock_count integer not null default 0 check (stock_count >= 0),
  is_funded boolean not null default false,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.redemption_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  shop_item_id uuid not null references public.shop_items (id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'approved', 'fulfilled', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shop_items enable row level security;
alter table public.redemption_requests enable row level security;

create policy "shop_items_select_verified"
  on public.shop_items for select to authenticated
  using (public.is_verified());

create policy "shop_items_admin_write"
  on public.shop_items for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "redemption_requests_select_own_or_admin"
  on public.redemption_requests for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy "redemption_requests_insert_own"
  on public.redemption_requests for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_verified());

create policy "redemption_requests_update_admin"
  on public.redemption_requests for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.shop_items to authenticated;
grant select, insert on public.redemption_requests to authenticated;

-- ========== Part 2D: Referrals ==========
alter table public.profiles
  add column if not exists referral_code text unique;

create or replace function public.generate_referral_code()
returns text
language plpgsql
as $$
declare
  code text;
begin
  loop
    code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from public.profiles where referral_code = code);
  end loop;
  return code;
end;
$$;

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  referred_id uuid not null unique references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.referral_prizes (
  id uuid primary key default gen_random_uuid(),
  rank_min integer not null,
  rank_max integer not null,
  title text not null,
  description text,
  is_funded boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.referrals enable row level security;
alter table public.referral_prizes enable row level security;

create policy "referrals_select_verified"
  on public.referrals for select to authenticated
  using (public.is_verified());

create policy "referral_prizes_select_verified"
  on public.referral_prizes for select to authenticated
  using (public.is_verified());

create policy "referral_prizes_admin_write"
  on public.referral_prizes for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.referrals to authenticated;
grant select on public.referral_prizes to authenticated;

-- ========== Part 2E: Explainer videos ==========
create table if not exists public.explainer_video_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  video_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  points_awarded integer not null default 0,
  reviewed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.explainer_video_submissions enable row level security;

create policy "explainer_videos_select_own_or_admin"
  on public.explainer_video_submissions for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy "explainer_videos_insert_own"
  on public.explainer_video_submissions for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_verified());

create policy "explainer_videos_update_admin"
  on public.explainer_video_submissions for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert on public.explainer_video_submissions to authenticated;

create or replace function public.admin_award_explainer_video(
  p_submission_id uuid,
  p_points integer,
  p_approve boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  sub public.explainer_video_submissions%rowtype;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  select * into sub from public.explainer_video_submissions where id = p_submission_id for update;
  if not found then raise exception 'not found'; end if;
  if p_approve then
    update public.explainer_video_submissions
    set status = 'approved', points_awarded = p_points, reviewed_by = auth.uid(), updated_at = now()
    where id = p_submission_id;
    perform public.award_points_internal(sub.user_id, p_points, 'explainer_video', p_submission_id);
  else
    update public.explainer_video_submissions
    set status = 'rejected', reviewed_by = auth.uid(), updated_at = now()
    where id = p_submission_id;
  end if;
end;
$$;

grant execute on function public.admin_award_explainer_video(uuid, integer, boolean) to authenticated;

-- ========== Part 2F: Banners ==========
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  link_text text,
  link_url text,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.banners enable row level security;

create policy "banners_select_verified"
  on public.banners for select to authenticated
  using (public.is_verified());

create policy "banners_admin_write"
  on public.banners for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.banners to authenticated;

-- ========== Seed data ==========
insert into public.banners (text, link_text, link_url, is_active)
select 'Join our Referral Program', 'Learn more', '/referrals', true
where not exists (select 1 from public.banners where is_active = true);

insert into public.shop_items (name, category, point_cost, stock_count, is_funded, description) values
  ('ESP32 Development Board', 'gamer_tech', 500, 10, false, 'Wi-Fi + Bluetooth microcontroller for campus projects.'),
  ('Arduino Starter Kit', 'gamer_tech', 800, 5, false, 'Sensors, breadboard, and cables to get building.'),
  ('Mechanical Keyboard', 'gamer_tech', 2500, 3, false, 'Tactile switches for study and gaming.'),
  ('Minecraft Server Access (1 month)', 'gamer_tech', 400, 20, true, 'Private Usmanian server slot — funded and redeemable.'),
  ('UPSS Physics Course Voucher', 'educational', 1200, 8, false, 'Partner course credit for O-Level prep.'),
  ('School-branded Hoodie', 'educational', 600, 15, false, 'Official campus gear — pending sponsorship.')
on conflict do nothing;

insert into public.referral_prizes (rank_min, rank_max, title, description, is_funded) values
  (1, 1, 'Top Referrer Prize', 'Premium study kit for the #1 referrer this term.', false),
  (2, 2, 'Runner-up Prize', 'Book bundle for 2nd place.', false),
  (3, 3, 'Third Place Prize', 'School accessories pack for 3rd place.', false)
on conflict do nothing;

-- Sample notes require an approved profile; seed only when at least one exists
do $$
declare
  author_id uuid;
begin
  select id into author_id from public.profiles where verification_status = 'approved' limit 1;
  if author_id is null then return; end if;

  insert into public.posts (
    author_id, type, content, subject, grade_level, topic_tag, note_campus,
    attestation_accepted, attachment_name
  )
  select author_id, 'shared_notes', 'Chapter 3 summary notes for quick revision before the test.',
    'Mathematics', 'O-Level', 'Algebra', 'Main Campus', true, 'algebra-ch3.pdf'
  where not exists (
    select 1 from public.posts where author_id = author_id and subject = 'Mathematics' and topic_tag = 'Algebra'
  );

  insert into public.posts (
    author_id, type, content, subject, grade_level, topic_tag, note_campus,
    attestation_accepted, attachment_name
  )
  select author_id, 'shared_notes', 'Organic chemistry reaction sheet — my own handwritten summary.',
    'Chemistry', 'A-Level', 'Organic', 'North Campus', true, 'organic-reactions.pdf'
  where not exists (
    select 1 from public.posts where author_id = author_id and subject = 'Chemistry' and topic_tag = 'Organic'
  );

  insert into public.user_points (user_id, balance)
  values (author_id, 120)
  on conflict (user_id) do update set balance = greatest(public.user_points.balance, 120);

  update public.profiles set referral_code = public.generate_referral_code()
  where id = author_id and referral_code is null;
end $$;

create or replace function public.redeem_shop_item(p_item_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  item public.shop_items%rowtype;
  bal integer;
  req_id uuid;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  select * into item from public.shop_items where id = p_item_id for update;
  if not found then raise exception 'item not found'; end if;
  if not item.is_funded then raise exception 'item not funded'; end if;
  if item.stock_count <= 0 then raise exception 'out of stock'; end if;

  select coalesce(balance, 0) into bal from public.user_points where user_id = uid;
  if bal < item.point_cost then raise exception 'insufficient points'; end if;

  perform public.award_points_internal(uid, -item.point_cost, 'shop_redemption', item.id);
  update public.shop_items set stock_count = stock_count - 1 where id = p_item_id;
  insert into public.redemption_requests (user_id, shop_item_id, status)
  values (uid, p_item_id, 'pending')
  returning id into req_id;
  return req_id;
end;
$$;

grant execute on function public.redeem_shop_item(uuid) to authenticated;
