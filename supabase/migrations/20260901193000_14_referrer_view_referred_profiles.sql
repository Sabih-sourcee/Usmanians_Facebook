-- Allow referrers to see basic profile info for users who signed up via their link
-- (including while still pending admin approval)

create policy "profiles_select_referred_by_me"
  on public.profiles for select to authenticated
  using (
    public.is_verified()
    and exists (
      select 1
      from public.referrals r
      where r.referred_id = profiles.id
        and r.referrer_id = (select auth.uid())
    )
  );
