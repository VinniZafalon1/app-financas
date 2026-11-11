-- Execute no SQL Editor depois de criar o bucket privado `profile-avatars`.
-- Cada usuário só pode ler e alterar arquivos dentro da própria pasta (auth.uid()).
drop policy if exists "Usuários leem a própria foto de perfil" on storage.objects;
drop policy if exists "Usuários enviam a própria foto de perfil" on storage.objects;
drop policy if exists "Usuários atualizam a própria foto de perfil" on storage.objects;
drop policy if exists "Usuários removem a própria foto de perfil" on storage.objects;

create policy "Usuários leem a própria foto de perfil"
  on storage.objects for select to authenticated
  using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "Usuários enviam a própria foto de perfil"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "Usuários atualizam a própria foto de perfil"
  on storage.objects for update to authenticated
  using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text))
  with check (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "Usuários removem a própria foto de perfil"
  on storage.objects for delete to authenticated
  using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));
