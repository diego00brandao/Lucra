-- LUCRA · fotos na nuvem (rodar uma vez no SQL Editor)
-- Pasta por clínica: <clinica_id>/<paciente>/<foto>.jpg. Só dono e profissional da clínica leem, enviam e apagam.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "fotos: ver da minha clinica" on storage.objects for select to authenticated
  using (bucket_id = 'fotos' and public.meu_papel(((storage.foldername(name))[1])::uuid) in ('dono','profissional'));
create policy "fotos: enviar para minha clinica" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and public.meu_papel(((storage.foldername(name))[1])::uuid) in ('dono','profissional'));
create policy "fotos: trocar da minha clinica" on storage.objects for update to authenticated
  using (bucket_id = 'fotos' and public.meu_papel(((storage.foldername(name))[1])::uuid) in ('dono','profissional'))
  with check (bucket_id = 'fotos' and public.meu_papel(((storage.foldername(name))[1])::uuid) in ('dono','profissional'));
-- Para quem já rodou a versão antiga (sem o "with check"), rode também:
-- drop policy "fotos: trocar da minha clinica" on storage.objects; e depois o create policy acima.
create policy "fotos: apagar da minha clinica" on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and public.meu_papel(((storage.foldername(name))[1])::uuid) in ('dono','profissional'));
