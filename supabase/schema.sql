-- ============================================================
-- FAST SISTEMAS CONSTRUTIVOS — Dashboard TI
-- Schema do banco de dados
-- Execute no Supabase: SQL Editor → New query → Cole e rode
-- ============================================================

-- Extensão para UUIDs automáticos
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- TABELA: usuarios
-- Perfis vinculados ao Supabase Auth (auth.users)
-- ------------------------------------------------------------
create table if not exists public.usuarios (
  id    uuid primary key references auth.users(id) on delete cascade,
  nome  text not null,
  email text not null unique,
  role  text not null default 'visualizador'
        check (role in ('admin', 'gestor', 'visualizador')),
  created_at timestamptz not null default now()
);

-- Cria o perfil automaticamente quando um usuário se cadastra
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.usuarios (id, nome, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    'visualizador'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- TABELA: importacoes
-- Rastreia cada lote de upload de Excel
-- ------------------------------------------------------------
create table if not exists public.importacoes (
  id              uuid primary key default gen_random_uuid(),
  arquivo         text not null,
  mes_referencia  text not null,
  total_linhas    int  not null default 0,
  total_valor     numeric(12,2) not null default 0,
  importado_por   uuid references public.usuarios(id),
  created_at      timestamptz not null default now()
);

-- ------------------------------------------------------------
-- TABELA: pagamentos
-- Lançamentos vindos da planilha Excel
-- ------------------------------------------------------------
create table if not exists public.pagamentos (
  id              uuid primary key default gen_random_uuid(),
  data_lancamento date,
  data_vencimento date,
  data_documento  date,
  mes_referencia  text not null,
  categoria       text not null,
  fornecedor      text not null,
  numero_nf       text,
  valor           numeric(12,2) not null,
  filial          text,
  status          text not null default 'a_vencer'
                  check (status in ('vencido', 'a_vencer', 'pago')),
  importacao_id   uuid references public.importacoes(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- Índices para as queries mais comuns do dashboard
create index if not exists idx_pagamentos_vencimento   on public.pagamentos(data_vencimento);
create index if not exists idx_pagamentos_status        on public.pagamentos(status);
create index if not exists idx_pagamentos_mes           on public.pagamentos(mes_referencia);
create index if not exists idx_pagamentos_fornecedor    on public.pagamentos(fornecedor);
create index if not exists idx_pagamentos_importacao    on public.pagamentos(importacao_id);

-- ------------------------------------------------------------
-- FUNCTION: atualiza status dos pagamentos automaticamente
-- Roda via cron ou pode ser chamada manualmente
-- ------------------------------------------------------------
create or replace function public.atualizar_status_pagamentos()
returns void language plpgsql as $$
begin
  -- Marca como vencido: data passou e não está pago
  update public.pagamentos
  set status = 'vencido'
  where data_vencimento < current_date
    and status = 'a_vencer';

  -- Marca como a_vencer: data futura (caso seja reprocessado)
  update public.pagamentos
  set status = 'a_vencer'
  where data_vencimento >= current_date
    and status = 'vencido';
end;
$$;

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- Todos os usuários autenticados leem; só admin/gestor gravam
-- ------------------------------------------------------------
alter table public.usuarios    enable row level security;
alter table public.pagamentos  enable row level security;
alter table public.importacoes enable row level security;

-- Usuários: cada um vê apenas o próprio perfil
create policy "usuarios_select_own"
  on public.usuarios for select
  using (auth.uid() = id);

create policy "usuarios_update_own"
  on public.usuarios for update
  using (auth.uid() = id);

-- Pagamentos: qualquer autenticado lê
create policy "pagamentos_select_autenticado"
  on public.pagamentos for select
  using (auth.role() = 'authenticated');

-- Pagamentos: só admin e gestor inserem/atualizam
create policy "pagamentos_insert_gestor"
  on public.pagamentos for insert
  with check (
    exists (
      select 1 from public.usuarios
      where id = auth.uid()
        and role in ('admin', 'gestor')
    )
  );

create policy "pagamentos_update_gestor"
  on public.pagamentos for update
  using (
    exists (
      select 1 from public.usuarios
      where id = auth.uid()
        and role in ('admin', 'gestor')
    )
  );

-- Importações: qualquer autenticado lê; gestor/admin cria
create policy "importacoes_select_autenticado"
  on public.importacoes for select
  using (auth.role() = 'authenticated');

create policy "importacoes_insert_gestor"
  on public.importacoes for insert
  with check (
    exists (
      select 1 from public.usuarios
      where id = auth.uid()
        and role in ('admin', 'gestor')
    )
  );

-- ------------------------------------------------------------
-- VIEWS úteis para o dashboard (não precisam de RLS própria)
-- ------------------------------------------------------------

-- Resumo por mês
create or replace view public.resumo_por_mes as
select
  mes_referencia,
  count(*)                          as total_lancamentos,
  sum(valor)                        as total_valor,
  sum(case when status = 'vencido' then valor else 0 end) as valor_vencido,
  sum(case when status = 'pago'    then valor else 0 end) as valor_pago,
  sum(case when status = 'a_vencer' then valor else 0 end) as valor_a_vencer
from public.pagamentos
group by mes_referencia;

-- Top fornecedores
create or replace view public.top_fornecedores as
select
  fornecedor,
  count(*)   as total_lancamentos,
  sum(valor) as total_valor,
  round(sum(valor) / sum(sum(valor)) over () * 100, 1) as percentual
from public.pagamentos
group by fornecedor
order by total_valor desc;

-- Vencimentos próximos (próximos 30 dias)
create or replace view public.vencimentos_proximos as
select *
from public.pagamentos
where data_vencimento between current_date and current_date + interval '30 days'
  and status = 'a_vencer'
order by data_vencimento;
