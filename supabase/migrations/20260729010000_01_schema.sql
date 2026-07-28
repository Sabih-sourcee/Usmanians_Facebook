-- 01_schema: Usmanian core tables
-- Project: nwygelibbklfvgnfmtrd

create extension if not exists "pgcrypto";

-- profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  cover_url text,
  class_name text,
  student_cid text unique,
  role text not null default 'student'
    check (role in ('student', 'teacher', 'admin')),
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'approved', 'rejected')),
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- posts
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  type text not null default 'standard'
    check (type in ('standard', 'shared_notes')),
  content text not null default '',
  image_url text,
  attachment_url text,
  attachment_name text,
  subject text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_author_id_idx on public.posts (author_id);
create index posts_created_at_desc_idx on public.posts (created_at desc);

-- post_likes
create table public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- post_comments
create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index post_comments_post_id_idx on public.post_comments (post_id);

-- friendships
create table public.friendships (
  user_id uuid not null references public.profiles (id) on delete cascade,
  friend_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

-- notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  type text not null,
  reference_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications (user_id);
create index notifications_created_at_desc_idx on public.notifications (created_at desc);

-- teacher_reports
create table public.teacher_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles (id) on delete set null,
  is_anonymous boolean not null default false,
  teacher_name text not null,
  class_name text,
  category text,
  description text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- principal_candidates
create table public.principal_candidates (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  photo_url text,
  bio text,
  class_name text,
  created_at timestamptz not null default now()
);

-- principal_votes
create table public.principal_votes (
  id uuid primary key default gen_random_uuid(),
  voter_id uuid not null unique references public.profiles (id) on delete cascade,
  candidate_id uuid not null references public.principal_candidates (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index principal_votes_candidate_id_idx on public.principal_votes (candidate_id);

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

create trigger teacher_reports_set_updated_at
  before update on public.teacher_reports
  for each row execute function public.set_updated_at();
