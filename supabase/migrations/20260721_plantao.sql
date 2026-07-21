-- Estrutura da escala e da automação semanal de plantão.
-- Pode ser executada isoladamente em um projeto que já possui o schema principal.

create table if not exists public.plantoes_ti (
  id                 uuid primary key default gen_random_uuid(),
  data               date not null unique,
  colaborador_nome   text not null,
  colaborador_email  text not null,
  telefone           text,
  observacao         text,
  created_at         timestamptz not null default now(),
  created_by         uuid references public.usuarios(id)
);

create table if not exists public.configuracoes_plantao (
  id             smallint primary key default 1 check (id = 1),
  email_destino  text not null default '',
  dia_envio      smallint not null default 5 check (dia_envio between 0 and 6),
  hora_envio     time not null default '09:00',
  ativo          boolean not null default false,
  updated_at     timestamptz not null default now(),
  updated_by     uuid references public.usuarios(id)
);

create table if not exists public.plantao_notificacoes (
  id              uuid primary key default gen_random_uuid(),
  plantao_id      uuid not null references public.plantoes_ti(id) on delete cascade,
  email_destino   text not null,
  enviado_em      timestamptz not null default now(),
  unique (plantao_id, email_destino)
);

insert into public.configuracoes_plantao (id)
values (1)
on conflict (id) do nothing;

alter table public.plantoes_ti enable row level security;
alter table public.configuracoes_plantao enable row level security;
alter table public.plantao_notificacoes enable row level security;

drop policy if exists "plantoes_select_autenticado" on public.plantoes_ti;
create policy "plantoes_select_autenticado" on public.plantoes_ti for select
  using (auth.role() = 'authenticated');

drop policy if exists "plantoes_gestao_admin" on public.plantoes_ti;
create policy "plantoes_gestao_admin" on public.plantoes_ti for all
  using (exists (select 1 from public.usuarios where id = auth.uid() and role in ('admin', 'gestor')))
  with check (exists (select 1 from public.usuarios where id = auth.uid() and role in ('admin', 'gestor')));

drop policy if exists "config_plantao_select_autenticado" on public.configuracoes_plantao;
create policy "config_plantao_select_autenticado" on public.configuracoes_plantao for select
  using (auth.role() = 'authenticated');

drop policy if exists "config_plantao_gestao_admin" on public.configuracoes_plantao;
create policy "config_plantao_gestao_admin" on public.configuracoes_plantao for all
  using (exists (select 1 from public.usuarios where id = auth.uid() and role in ('admin', 'gestor')))
  with check (exists (select 1 from public.usuarios where id = auth.uid() and role in ('admin', 'gestor')));

drop policy if exists "notificacoes_select_admin" on public.plantao_notificacoes;
create policy "notificacoes_select_admin" on public.plantao_notificacoes for select
  using (exists (select 1 from public.usuarios where id = auth.uid() and role in ('admin', 'gestor')));
