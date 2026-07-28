-- 04_storage_realtime
-- Upload path convention (required for ownership policies):
--   {bucket}/{user_id}/{filename}
-- Example: avatars/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/me.jpg

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'avatars',
    'avatars',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'post-images',
    'post-images',
    false,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'attachments',
    'attachments',
    false,
    26214400,
    array[
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Drop prior policies if re-applied
drop policy if exists "avatars_public_read" on storage.objects;
drop policy if exists "avatars_owner_insert" on storage.objects;
drop policy if exists "avatars_owner_update" on storage.objects;
drop policy if exists "avatars_owner_delete" on storage.objects;
drop policy if exists "post_images_verified_read" on storage.objects;
drop policy if exists "post_images_owner_insert" on storage.objects;
drop policy if exists "post_images_owner_update" on storage.objects;
drop policy if exists "post_images_owner_delete" on storage.objects;
drop policy if exists "attachments_verified_read" on storage.objects;
drop policy if exists "attachments_owner_insert" on storage.objects;
drop policy if exists "attachments_owner_update" on storage.objects;
drop policy if exists "attachments_owner_delete" on storage.objects;

-- avatars: public read; write/update/delete = folder owner
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_owner_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "avatars_owner_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "avatars_owner_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- post-images: verified read; owner + verified write/delete
create policy "post_images_verified_read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'post-images'
    and public.is_verified()
  );

create policy "post_images_owner_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'post-images'
    and public.is_verified()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "post_images_owner_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'post-images'
    and public.is_verified()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'post-images'
    and public.is_verified()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "post_images_owner_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'post-images'
    and public.is_verified()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- attachments: same pattern
create policy "attachments_verified_read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'attachments'
    and public.is_verified()
  );

create policy "attachments_owner_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'attachments'
    and public.is_verified()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "attachments_owner_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'attachments'
    and public.is_verified()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'attachments'
    and public.is_verified()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "attachments_owner_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'attachments'
    and public.is_verified()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Realtime: posts, likes, comments, notifications only
-- (not teacher_reports / principal_votes)
do $$
begin
  alter publication supabase_realtime add table public.posts;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.post_likes;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.post_comments;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;
