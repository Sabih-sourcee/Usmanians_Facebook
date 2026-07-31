-- 11_push_subscriptions: Web Push device subscriptions + webhook enqueue
-- Actual notification types: post_like, post_comment, friend_request,
-- friend_accepted, verification_approved, verification_rejected

create extension if not exists "pgcrypto";

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh_key text not null,
  auth_key text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own"
  on public.push_subscriptions for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "push_subscriptions_insert_own" on public.push_subscriptions;
create policy "push_subscriptions_insert_own"
  on public.push_subscriptions for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "push_subscriptions_update_own" on public.push_subscriptions;
create policy "push_subscriptions_update_own"
  on public.push_subscriptions for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;
create policy "push_subscriptions_delete_own"
  on public.push_subscriptions for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, update, delete on public.push_subscriptions to authenticated;

-- Optional: enqueue push via pg_net when a notification row is inserted.
-- Requires: create extension pg_net; and vault secrets:
--   push_webhook_url, push_webhook_secret (or service_role_key)
-- If secrets are missing, the trigger no-ops with a warning (in-app Realtime still works).

create extension if not exists pg_net with schema extensions;

create or replace function public.enqueue_push_notification()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  fn_url text;
  hook_secret text;
  service_key text;
  auth_header text;
begin
  -- Self-actions are already skipped by notify_* triggers; mirror that here.
  if new.actor_id is not null and new.actor_id = new.user_id then
    return new;
  end if;

  begin
    select decrypted_secret into fn_url
    from vault.decrypted_secrets where name = 'push_webhook_url' limit 1;
  exception when others then
    fn_url := null;
  end;

  if coalesce(fn_url, '') = '' then
    fn_url := 'https://nwygelibbklfvgnfmtrd.supabase.co/functions/v1/send-push-notification';
  end if;

  begin
    select decrypted_secret into hook_secret
    from vault.decrypted_secrets where name = 'push_webhook_secret' limit 1;
  exception when others then
    hook_secret := null;
  end;

  begin
    select decrypted_secret into service_key
    from vault.decrypted_secrets where name = 'service_role_key' limit 1;
  exception when others then
    service_key := null;
  end;

  if coalesce(hook_secret, '') <> '' then
    auth_header := 'Bearer ' || hook_secret;
  elsif coalesce(service_key, '') <> '' then
    auth_header := 'Bearer ' || service_key;
  else
    -- Fallback to GUC set by apply script: alter database ... set app.settings.push_webhook_secret
    begin
      hook_secret := current_setting('app.settings.push_webhook_secret', true);
    exception when others then
      hook_secret := null;
    end;
    if coalesce(hook_secret, '') <> '' then
      auth_header := 'Bearer ' || hook_secret;
    else
      raise warning 'enqueue_push_notification: no push secret configured; skipping HTTP call';
      return new;
    end if;
  end if;

  perform net.http_post(
    url := fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', auth_header
    ),
    body := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', row_to_json(new)
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_enqueue_push_notification on public.notifications;
create trigger trg_enqueue_push_notification
  after insert on public.notifications
  for each row execute function public.enqueue_push_notification();

revoke all on function public.enqueue_push_notification() from public;
