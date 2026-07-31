-- 12_push_webhook_config: store hook secret for enqueue trigger (vault unavailable)
create table if not exists public.push_webhook_config (
  id int primary key default 1 check (id = 1),
  webhook_url text not null,
  webhook_secret text not null,
  updated_at timestamptz not null default now()
);

alter table public.push_webhook_config enable row level security;
-- No policies for authenticated/anon — only security definer / service role

revoke all on table public.push_webhook_config from public, anon, authenticated;

create or replace function public.enqueue_push_notification()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  fn_url text;
  hook_secret text;
  auth_header text;
begin
  if new.actor_id is not null and new.actor_id = new.user_id then
    return new;
  end if;

  select webhook_url, webhook_secret
    into fn_url, hook_secret
  from public.push_webhook_config
  where id = 1;

  if coalesce(fn_url, '') = '' then
    fn_url := 'https://nwygelibbklfvgnfmtrd.supabase.co/functions/v1/send-push-notification';
  end if;

  if coalesce(hook_secret, '') = '' then
    raise warning 'enqueue_push_notification: push_webhook_config missing; skipping';
    return new;
  end if;

  auth_header := 'Bearer ' || hook_secret;

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
