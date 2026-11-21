-- LUCRA · agendamento online e pesquisa de satisfação (rodar uma vez no SQL Editor)
-- O paciente não faz login: ele só enxerga os horários livres e manda um pedido.
-- Nome, agenda e dados da clínica continuam fechados.

-- 1. Tabelas
create table public.vitrine (
  clinica_id uuid primary key references public.clinicas(id) on delete cascade,
  codigo text not null unique,
  ativo boolean not null default false,
  titulo text not null default '',
  aviso text not null default '',
  servicos jsonb not null default '[]'::jsonb,
  livres jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);
create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  nome text not null,
  tel text not null,
  servico_id text not null default '',
  servico text not null default '',
  data date not null,
  hora text not null,
  obs text not null default '',
  status text not null default 'novo' check (status in ('novo','aceito','recusado')),
  criado_em timestamptz not null default now()
);
create index pedidos_cid on public.pedidos(clinica_id, status);
create table public.pesquisas (
  token uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  cliente_id text not null default '',
  ag_id text not null default '',
  nota int check (nota between 0 and 10),
  comentario text not null default '',
  criado_em timestamptz not null default now(),
  respondido_em timestamptz
);
create index pesquisas_cid on public.pesquisas(clinica_id);

alter table public.vitrine   enable row level security;
alter table public.pedidos   enable row level security;
alter table public.pesquisas enable row level security;
create policy "equipe ve vitrine"  on public.vitrine   for select to authenticated using (public.meu_papel(clinica_id) is not null);
create policy "equipe ve pedidos"  on public.pedidos   for select to authenticated using (public.meu_papel(clinica_id) is not null);
create policy "dono ve pesquisas"  on public.pesquisas for select to authenticated using (public.meu_papel(clinica_id) = 'dono');
revoke all on public.vitrine, public.pedidos, public.pesquisas from anon, authenticated;
grant select on public.vitrine, public.pedidos, public.pesquisas to authenticated;

-- 2. Ações da clínica (cada uma confere quem está pedindo)
create or replace function public.configurar_vitrine(p_cid uuid, p_ativo boolean, p_titulo text, p_aviso text, p_servicos jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare v_cod text;
begin
  if meu_papel(p_cid) is distinct from 'dono' then raise exception 'so_dono'; end if;
  insert into vitrine (clinica_id, codigo) values (p_cid, substr(md5(gen_random_uuid()::text), 1, 8)) on conflict (clinica_id) do nothing;
  update vitrine set ativo = coalesce(p_ativo,false), titulo = left(coalesce(p_titulo,''),80), aviso = left(coalesce(p_aviso,''),300),
    servicos = coalesce(p_servicos,'[]'::jsonb), atualizado_em = now() where clinica_id = p_cid returning codigo into v_cod;
  return v_cod;
end $$;

create or replace function public.atualizar_livres(p_cid uuid, p_livres jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if meu_papel(p_cid) is null then raise exception 'sem_acesso'; end if;
  update vitrine set livres = coalesce(p_livres,'{}'::jsonb), atualizado_em = now() where clinica_id = p_cid;
end $$;

create or replace function public.responder_pedido(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('aceito','recusado') then raise exception 'status_invalido'; end if;
  update pedidos p set status = p_status where p.id = p_id and meu_papel(p.clinica_id) is not null;
end $$;

create or replace function public.criar_pesquisa(p_cid uuid, p_cliente text, p_ag text) returns uuid
language plpgsql security definer set search_path = public as $$
declare t uuid;
begin
  if meu_papel(p_cid) is null then raise exception 'sem_acesso'; end if;
  insert into pesquisas (clinica_id, cliente_id, ag_id) values (p_cid, left(coalesce(p_cliente,''),40), left(coalesce(p_ag,''),40)) returning token into t;
  return t;
end $$;

-- 3. O que o paciente pode fazer sem login
create or replace function public.ver_vitrine(p_codigo text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('titulo', case when v.titulo <> '' then v.titulo else c.nome end, 'area', c.area, 'aviso', v.aviso,
    'servicos', v.servicos, 'livres', v.livres)
  from vitrine v join clinicas c on c.id = v.clinica_id where v.codigo = p_codigo and v.ativo
$$;

create or replace function public.pedir_horario(p_codigo text, p_nome text, p_tel text, p_servico text, p_data date, p_hora text, p_obs text) returns text
language plpgsql security definer set search_path = public as $$
declare v record; lst jsonb; n int; dig text := regexp_replace(coalesce(p_tel,''), '\D', '', 'g'); k text := to_char(p_data, 'YYYY-MM-DD'); sv text;
begin
  select * into v from vitrine where codigo = p_codigo and ativo;
  if v.clinica_id is null then raise exception 'indisponivel'; end if;
  if length(trim(coalesce(p_nome,''))) < 2 or length(dig) < 10 or length(dig) > 13 then raise exception 'dados'; end if;
  if p_data < current_date or p_data > current_date + 62 then raise exception 'ocupado'; end if;
  select s->>'nome' into sv from jsonb_array_elements(v.servicos) s where s->>'id' = p_servico limit 1;
  if sv is null then raise exception 'servico'; end if;
  lst := v.livres -> k;
  if lst is null or not (lst ? p_hora) then raise exception 'ocupado'; end if;
  select count(*) into n from pedidos where clinica_id = v.clinica_id and status = 'novo';
  if n >= 40 then raise exception 'muitos'; end if;
  select count(*) into n from pedidos where clinica_id = v.clinica_id and status = 'novo' and regexp_replace(tel, '\D', '', 'g') = dig;
  if n >= 3 then raise exception 'muitos'; end if;
  insert into pedidos (clinica_id, nome, tel, servico_id, servico, data, hora, obs)
    values (v.clinica_id, left(trim(p_nome), 80), left(dig, 13), left(p_servico, 40), sv, p_data, p_hora, left(coalesce(p_obs,''), 300));
  update vitrine set livres = jsonb_set(livres, array[k], (select coalesce(jsonb_agg(x), '[]'::jsonb) from jsonb_array_elements_text(lst) x where x <> p_hora))
    where clinica_id = v.clinica_id;
  return 'ok';
end $$;

create or replace function public.ver_pesquisa(p_token uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('clinica', c.nome, 'area', c.area, 'respondida', p.respondido_em is not null)
  from pesquisas p join clinicas c on c.id = p.clinica_id where p.token = p_token
$$;

create or replace function public.responder_pesquisa(p_token uuid, p_nota int, p_comentario text) returns text
language plpgsql security definer set search_path = public as $$
begin
  if p_nota is null or p_nota < 0 or p_nota > 10 then raise exception 'nota'; end if;
  update pesquisas set nota = p_nota, comentario = left(coalesce(p_comentario,''), 500), respondido_em = now()
    where token = p_token and respondido_em is null and criado_em > now() - interval '60 days';
  if not found then raise exception 'invalida'; end if;
  return 'ok';
end $$;

-- 4. Permissões das funções
revoke execute on function public.configurar_vitrine(uuid, boolean, text, text, jsonb), public.atualizar_livres(uuid, jsonb),
  public.responder_pedido(uuid, text), public.criar_pesquisa(uuid, text, text) from public, anon;
grant execute on function public.configurar_vitrine(uuid, boolean, text, text, jsonb), public.atualizar_livres(uuid, jsonb),
  public.responder_pedido(uuid, text), public.criar_pesquisa(uuid, text, text) to authenticated;
grant execute on function public.ver_vitrine(text), public.pedir_horario(text, text, text, text, date, text, text),
  public.ver_pesquisa(uuid), public.responder_pesquisa(uuid, int, text) to anon, authenticated;
