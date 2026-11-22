-- LUCRA · 7 dias de teste grátis para quem cria conta. Uma instrução por linha e pode rodar de novo.
alter table public.clinicas add column if not exists teste_ate timestamptz;
alter table public.clinicas alter column teste_ate set default (now() + interval '7 days');
