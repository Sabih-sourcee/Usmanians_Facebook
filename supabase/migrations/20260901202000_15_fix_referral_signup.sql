-- Fix referral recording at signup: pending users cannot read referrer profiles
-- or insert into referrals under previous RLS. Use a secure RPC instead.

create or replace function public.record_referral_signup(p_referral_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  referrer uuid;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  if p_referral_code is null or trim(p_referral_code) = '' then
    return;
  end if;

  select id into referrer
  from public.profiles
  where upper(referral_code) = upper(trim(p_referral_code))
  limit 1;

  if referrer is null or referrer = uid then
    return;
  end if;

  insert into public.referrals (referrer_id, referred_id)
  values (referrer, uid)
  on conflict (referred_id) do nothing;
end;
$$;

grant execute on function public.record_referral_signup(text) to authenticated;

-- Defense in depth: allow users to insert their own referral row
drop policy if exists "referrals_insert_own_signup" on public.referrals;
create policy "referrals_insert_own_signup"
  on public.referrals for insert to authenticated
  with check (referred_id = (select auth.uid()));

grant insert on public.referrals to authenticated;

-- Backfill: refferal@gmail.com signed up via Sudonomous (2D04CF78) but was not recorded
insert into public.referrals (referrer_id, referred_id)
select '3c586587-1a62-4c4d-8115-de5f9803d8b8', 'b8e7bb5a-7272-4b30-b32a-a8bb02050ec7'
where exists (select 1 from public.profiles where id = '3c586587-1a62-4c4d-8115-de5f9803d8b8')
  and exists (select 1 from public.profiles where id = 'b8e7bb5a-7272-4b30-b32a-a8bb02050ec7')
  and not exists (
    select 1 from public.referrals where referred_id = 'b8e7bb5a-7272-4b30-b32a-a8bb02050ec7'
  );
