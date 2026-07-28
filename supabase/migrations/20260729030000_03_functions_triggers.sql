-- 03_functions_triggers: automation for Usmanian

-- 1) Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, verification_status, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    'pending',
    'student'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) Prevent non-admins from changing verification_status
create or replace function public.prevent_self_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service role / postgres (no JWT uid) may change verification for admin tooling.
  -- Authenticated non-admins may not.
  if new.verification_status is distinct from old.verification_status then
    if auth.uid() is not null and not public.is_admin() then
      raise exception 'Only admins can change verification_status';
    end if;
  end if;
  if new.role is distinct from old.role then
    if auth.uid() is not null and not public.is_admin() then
      raise exception 'Only admins can change role';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_self_verification on public.profiles;
create trigger trg_prevent_self_verification
  before update on public.profiles
  for each row execute function public.prevent_self_verification();

-- 3) Notify on verification decision
create or replace function public.notify_verification_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.verification_status is distinct from old.verification_status
     and new.verification_status in ('approved', 'rejected') then
    insert into public.notifications (user_id, actor_id, type, reference_id)
    values (
      new.id,
      auth.uid(),
      case
        when new.verification_status = 'approved' then 'verification_approved'
        else 'verification_rejected'
      end,
      new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_verification on public.profiles;
create trigger trg_notify_verification
  after update of verification_status on public.profiles
  for each row execute function public.notify_verification_decision();

-- 4a) Notify on like
create or replace function public.notify_on_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_author uuid;
begin
  select author_id into post_author from public.posts where id = new.post_id;
  if post_author is not null and post_author <> new.user_id then
    insert into public.notifications (user_id, actor_id, type, reference_id)
    values (post_author, new.user_id, 'post_like', new.post_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_on_like on public.post_likes;
create trigger trg_notify_on_like
  after insert on public.post_likes
  for each row execute function public.notify_on_like();

-- 4b) Notify on comment
create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_author uuid;
begin
  select author_id into post_author from public.posts where id = new.post_id;
  if post_author is not null and post_author <> new.author_id then
    insert into public.notifications (user_id, actor_id, type, reference_id)
    values (post_author, new.author_id, 'post_comment', new.post_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_on_comment on public.post_comments;
create trigger trg_notify_on_comment
  after insert on public.post_comments
  for each row execute function public.notify_on_comment();

-- 5) Friend accept: mirror reverse row + notify requester
create or replace function public.handle_friend_accept()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    insert into public.friendships (user_id, friend_id, status)
    values (new.friend_id, new.user_id, 'accepted')
    on conflict (user_id, friend_id) do update
      set status = excluded.status;

    insert into public.notifications (user_id, actor_id, type, reference_id)
    values (new.user_id, new.friend_id, 'friend_accepted', new.friend_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_handle_friend_accept on public.friendships;
create trigger trg_handle_friend_accept
  after update of status on public.friendships
  for each row execute function public.handle_friend_accept();

-- 6) Enforce single vote (defense in depth)
create or replace function public.enforce_single_vote()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.principal_votes where voter_id = new.voter_id) then
    raise exception 'Each user may cast only one principal vote';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_single_vote on public.principal_votes;
create trigger trg_enforce_single_vote
  before insert on public.principal_votes
  for each row execute function public.enforce_single_vote();

-- 7) Aggregate results view — no voter identity
-- Default view owner rights (not security_invoker) so vote counts aggregate
-- across all rows without exposing voter_id. Only aggregate columns are selected.
create or replace view public.principal_vote_results as
select
  c.id as candidate_id,
  c.full_name,
  c.photo_url,
  count(v.id)::bigint as vote_count
from public.principal_candidates c
left join public.principal_votes v on v.candidate_id = c.id
group by c.id, c.full_name, c.photo_url;

revoke all on public.principal_vote_results from public;
grant select on public.principal_vote_results to authenticated;
