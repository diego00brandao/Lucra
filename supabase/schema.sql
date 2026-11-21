-- LUCRA · banco de dados (rodar uma vez no SQL Editor do Supabase)

-- 1. Tabelas
create table public.clinicas (
  id uuid primary key default gen_random_uuid(),
  nome text not null default '',
  area text not null check (area in ('estetica','odonto','psico')),
  criada_em timestamptz not null default now()
);
create table public.membros (
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  papel text not null check (papel in ('dono','profissional','recepcao')),
  nome text not null default '',
  email text not null default '',
  criado_em timestamptz not null default now(),
  primary key (clinica_id, user_id)
);
create index membros_user on public.membros(user_id);
create table public.convites (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  email text not null,
  papel text not null check (papel in ('profissional','recepcao')),
  criado_em timestamptz not null default now(),
  unique (clinica_id, email)
);
-- dados do dia a dia (agenda, caixa, clientes...) e dados de saúde separados
create table public.dados (
  clinica_id uuid primary key references public.clinicas(id) on delete cascade,
  estado jsonb not null default '{}'::jsonb,
  versao bigint not null default 0,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid
);
create table public.clinico (
  clinica_id uuid primary key references public.clinicas(id) on delete cascade,
  estado jsonb not null default '{}'::jsonb,
  versao bigint not null default 0,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid
);

-- 2. Trava: ninguém lê nada sem regra
alter table public.clinicas enable row level security;
alter table public.membros  enable row level security;
alter table public.convites enable row level security;
alter table public.dados    enable row level security;
alter table public.clinico  enable row level security;

-- papel de quem está logado numa clínica (null = não é da clínica)
create or replace function public.meu_papel(cid uuid) returns text
language sql stable security definer set search_path = public as $$
  select papel from public.membros where clinica_id = cid and user_id = auth.uid()
$$;

-- 3. Quem vê o quê
create policy "ver minha clinica" on public.clinicas for select to authenticated using (public.meu_papel(id) is not null);
create policy "dono renomeia"     on public.clinicas for update to authenticated using (public.meu_papel(id) = 'dono') with check (public.meu_papel(id) = 'dono');
create policy "ver equipe"        on public.membros  for select to authenticated using (public.meu_papel(clinica_id) is not null);
create policy "dono ve convites"  on public.convites for select to authenticated using (public.meu_papel(clinica_id) = 'dono');
create policy "equipe le dados"   on public.dados    for select to authenticated using (public.meu_papel(clinica_id) is not null);
create policy "saude so dono e profissional" on public.clinico for select to authenticated using (public.meu_papel(clinica_id) in ('dono','profissional'));

-- 4. Ações (cada uma confere quem está pedindo)
create or replace function public.criar_clinica(p_nome text, p_area text, p_pessoa text) returns uuid
language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  if auth.uid() is null then raise exception 'sem_login'; end if;
  if exists (select 1 from membros where user_id = auth.uid()) then raise exception 'ja_tem_clinica'; end if;
  insert into clinicas (nome, area) values (coalesce(p_nome,''), p_area) returning id into cid;
  insert into membros (clinica_id, user_id, papel, nome, email) values (cid, auth.uid(), 'dono', coalesce(p_pessoa,''), coalesce(auth.jwt()->>'email',''));
  insert into dados (clinica_id) values (cid);
  insert into clinico (clinica_id) values (cid);
  return cid;
end $$;

-- salva com controle de versão: se outra pessoa salvou antes, devolve 'conflito' e o app junta as mudanças
create or replace function public.salvar(p_cid uuid, p_parte text, p_estado jsonb, p_versao bigint) returns bigint
language plpgsql security definer set search_path = public as $$
declare papel text := meu_papel(p_cid); nova bigint;
begin
  if papel is null then raise exception 'sem_acesso'; end if;
  if p_parte = 'dados' then
    update dados set estado = p_estado, versao = versao + 1, atualizado_em = now(), atualizado_por = auth.uid()
      where clinica_id = p_cid and versao = p_versao returning versao into nova;
  elsif p_parte = 'clinico' then
    if papel not in ('dono','profissional') then raise exception 'sem_acesso'; end if;
    update clinico set estado = p_estado, versao = versao + 1, atualizado_em = now(), atualizado_por = auth.uid()
      where clinica_id = p_cid and versao = p_versao returning versao into nova;
  else raise exception 'parte_invalida'; end if;
  if nova is null then raise exception 'conflito'; end if;
  return nova;
end $$;

create or replace function public.convidar(p_cid uuid, p_email text, p_papel text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if meu_papel(p_cid) is distinct from 'dono' then raise exception 'so_dono'; end if;
  insert into convites (clinica_id, email, papel) values (p_cid, lower(trim(p_email)), p_papel)
    on conflict (clinica_id, email) do update set papel = excluded.papel;
end $$;

create or replace function public.cancelar_convite(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from convites c where c.id = p_id and meu_papel(c.clinica_id) = 'dono';
end $$;

-- quem foi convidado entra na clínica ao fazer login (só com e-mail confirmado)
create or replace function public.aceitar_convites() returns uuid
language plpgsql security definer set search_path = public as $$
declare v_email text; c record; cid uuid;
begin
  if auth.uid() is null then return null; end if;
  select lower(email) into v_email from auth.users where id = auth.uid() and email_confirmed_at is not null;
  if v_email is null then return null; end if;
  if exists (select 1 from membros where user_id = auth.uid()) then return null; end if;
  select * into c from convites where email = v_email order by criado_em limit 1;
  if c.id is null then return null; end if;
  insert into membros (clinica_id, user_id, papel, email) values (c.clinica_id, auth.uid(), c.papel, v_email);
  delete from convites where email = v_email;
  return c.clinica_id;
end $$;

create or replace function public.mudar_papel(p_cid uuid, p_user uuid, p_papel text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if meu_papel(p_cid) is distinct from 'dono' then raise exception 'so_dono'; end if;
  if p_user = auth.uid() then raise exception 'nao_pode_mudar_a_si'; end if;
  if p_papel not in ('profissional','recepcao') then raise exception 'papel_invalido'; end if;
  update membros set papel = p_papel where clinica_id = p_cid and user_id = p_user;
end $$;

create or replace function public.remover_membro(p_cid uuid, p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if meu_papel(p_cid) is distinct from 'dono' then raise exception 'so_dono'; end if;
  if p_user = auth.uid() then raise exception 'nao_pode_remover_a_si'; end if;
  delete from membros where clinica_id = p_cid and user_id = p_user;
end $$;

create or replace function public.meu_nome(p_cid uuid, p_nome text) returns void
language sql security definer set search_path = public as $$
  update membros set nome = coalesce(p_nome,'') where clinica_id = p_cid and user_id = auth.uid()
$$;

-- 5. Permissões: só usuários logados, só o necessário
revoke all on all tables in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon;
grant usage on schema public to authenticated;
grant select on public.clinicas, public.membros, public.convites, public.dados, public.clinico to authenticated;
grant update (nome) on public.clinicas to authenticated;
grant execute on function public.meu_papel(uuid), public.criar_clinica(text,text,text), public.salvar(uuid,text,jsonb,bigint),
  public.convidar(uuid,text,text), public.cancelar_convite(uuid), public.aceitar_convites(),
  public.mudar_papel(uuid,uuid,text), public.remover_membro(uuid,uuid), public.meu_nome(uuid,text) to authenticated;
