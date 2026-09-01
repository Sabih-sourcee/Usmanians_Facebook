-- Prevent duplicate Student ID signups from surfacing as opaque auth 500s.

create or replace function public.is_student_cid_available(p_cid text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.profiles
    where student_cid = nullif(trim(p_cid), '')
  );
$$;

revoke all on function public.is_student_cid_available(text) from public;
grant execute on function public.is_student_cid_available(text) to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cid text;
begin
  v_cid := nullif(trim(new.raw_user_meta_data ->> 'student_cid'), '');

  if v_cid is not null and exists (
    select 1 from public.profiles where student_cid = v_cid
  ) then
    raise exception 'This Student ID is already registered. Log in with your existing account or contact an administrator.'
      using errcode = '23505';
  end if;

  insert into public.profiles (
    id,
    full_name,
    student_cid,
    class_name,
    campus,
    verification_status,
    role
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    v_cid,
    nullif(trim(new.raw_user_meta_data ->> 'class_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'campus'), ''),
    'pending',
    'student'
  );

  return new;
exception
  when unique_violation then
    raise exception 'This Student ID is already registered. Log in with your existing account or contact an administrator.'
      using errcode = '23505';
end;
$$;
