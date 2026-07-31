-- 10_notification_triggers_realtime
-- Ensure likes / comments / friend-request / friend-accept create notifications,
-- and that Realtime can deliver them to the recipient's client.
-- Schema (actual): post_likes, post_comments, friendships, notifications.user_id

-- ---------- notify on post like ----------
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

-- ---------- notify on post comment ----------
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

-- ---------- notify addressee on friend request ----------
-- friendships.user_id = requester, friendships.friend_id = addressee
create or replace function public.notify_on_friend_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'pending' then
    insert into public.notifications (user_id, actor_id, type, reference_id)
    values (new.friend_id, new.user_id, 'friend_request', new.user_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_on_friend_request on public.friendships;
create trigger trg_notify_on_friend_request
  after insert on public.friendships
  for each row execute function public.notify_on_friend_request();

-- ---------- friend accept: mirror row + notify original requester ----------
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

-- ---------- Realtime publication (idempotent) ----------
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
end $$;

-- Filters on user_id (non-PK) need full replica identity for reliable delivery
alter table public.notifications replica identity full;

-- Keep execute locked down for SECURITY DEFINER notify helpers
revoke all on function public.notify_on_like() from public;
revoke all on function public.notify_on_comment() from public;
revoke all on function public.notify_on_friend_request() from public;
revoke all on function public.handle_friend_accept() from public;
