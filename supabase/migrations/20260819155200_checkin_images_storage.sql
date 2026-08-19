-- Políticas do bucket checkin-images (rode se o upload falhar)
-- Storage → Policies, ou SQL Editor.

insert into storage.buckets (id, name, public)
values ('checkin-images', 'checkin-images', true)
on conflict (id) do update set public = true;

drop policy if exists "checkin_images_public_read" on storage.objects;
create policy "checkin_images_public_read"
  on storage.objects for select
  using (bucket_id = 'checkin-images');

drop policy if exists "checkin_images_auth_insert" on storage.objects;
create policy "checkin_images_auth_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'checkin-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "checkin_images_auth_update" on storage.objects;
create policy "checkin_images_auth_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'checkin-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "checkin_images_auth_delete" on storage.objects;
create policy "checkin_images_auth_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'checkin-images' and (storage.foldername(name))[1] = auth.uid()::text);
