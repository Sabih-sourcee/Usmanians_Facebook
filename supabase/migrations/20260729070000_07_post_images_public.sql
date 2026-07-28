-- Make post-images publicly readable for feed <img> tags
update storage.buckets set public = true where id = 'post-images';

drop policy if exists "post_images_verified_read" on storage.objects;
drop policy if exists "post_images_public_read" on storage.objects;
create policy "post_images_public_read"
  on storage.objects for select to public
  using (bucket_id = 'post-images');
