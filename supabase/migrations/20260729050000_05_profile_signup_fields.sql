-- 05_profile_signup_fields: campus column + richer signup profile insert

alter table public.profiles
  add column if not exists campus text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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
    nullif(new.raw_user_meta_data ->> 'student_cid', ''),
    nullif(new.raw_user_meta_data ->> 'class_name', ''),
    nullif(new.raw_user_meta_data ->> 'campus', ''),
    'pending',
    'student'
  );
  return new;
end;
$$;
