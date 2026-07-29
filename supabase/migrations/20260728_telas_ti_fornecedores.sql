-- Tabelas das telas de TI e cadastro mestre de fornecedores.
-- Seguro para execução repetida no SQL Editor do Supabase.
create extension if not exists "pgcrypto";

create table if not exists public.fornecedores (
  id uuid primary key default gen_random_uuid(),
  razao_social text not null,
  nome_fantasia text not null,
  cnpj text,
  email text,
  telefone text,
  contato text,
  site text,
  observacao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists fornecedores_cnpj_unique
  on public.fornecedores (regexp_replace(cnpj, '\D', '', 'g'))
  where cnpj is not null and cnpj <> '';
create unique index if not exists fornecedores_nome_unique
  on public.fornecedores (lower(nome_fantasia));

-- Aproveita os nomes já importados em pagamentos como cadastros iniciais.
insert into public.fornecedores (razao_social, nome_fantasia)
select distinct trim(p.fornecedor), trim(p.fornecedor)
from public.pagamentos p
where nullif(trim(p.fornecedor), '') is not null
on conflict do nothing;

alter table public.pagamentos add column if not exists fornecedor_id uuid references public.fornecedores(id) on delete restrict;
update public.pagamentos p set fornecedor_id = f.id
from public.fornecedores f
where p.fornecedor_id is null and lower(trim(p.fornecedor)) = lower(trim(f.nome_fantasia));
create index if not exists idx_pagamentos_fornecedor_id on public.pagamentos(fornecedor_id);

create table if not exists public.licencas_ti (
  id uuid primary key default gen_random_uuid(),
  colaborador text not null, departamento text not null, codigo_sap text not null,
  app_control text not null unique, perfil text not null check (perfil in ('Profissional','Limitada')),
  crm boolean not null default false, logistica boolean not null default false,
  financeiro boolean not null default false, status text not null check (status in ('Ativo','Pendente','Inativo')),
  fornecedor_id uuid references public.fornecedores(id) on delete restrict,
  created_at timestamptz not null default now()
);
alter table public.licencas_ti add column if not exists fornecedor_id uuid references public.fornecedores(id) on delete restrict;

create table if not exists public.softwares_ti (
  id uuid primary key default gen_random_uuid(), nome text not null unique, aplicacao text not null,
  acesso text not null default '', valor_mensal numeric(12,2) not null default 0,
  valor_anual numeric(12,2) not null default 0, satisfaz text not null check (satisfaz in ('Sim','Em análise','Não')),
  link text not null default '', responsavel text not null,
  fornecedor_id uuid references public.fornecedores(id) on delete restrict,
  created_at timestamptz not null default now()
);
alter table public.softwares_ti add column if not exists fornecedor_id uuid references public.fornecedores(id) on delete restrict;

create table if not exists public.provedores_ti (
  id uuid primary key default gen_random_uuid(), loja text not null unique, cidade text not null, uf text not null,
  provedor_principal text not null, provedor_backup text not null default '', velocidade text not null,
  tecnologia text not null check (tecnologia in ('Fibra','Rádio','Cabo')),
  status text not null check (status in ('Operacional','Instável','Indisponível')),
  telefone_suporte text not null default '', vencimento_contrato text not null default '',
  fornecedor_principal_id uuid references public.fornecedores(id) on delete restrict,
  fornecedor_backup_id uuid references public.fornecedores(id) on delete restrict,
  created_at timestamptz not null default now()
);
alter table public.provedores_ti add column if not exists fornecedor_principal_id uuid references public.fornecedores(id) on delete restrict;
alter table public.provedores_ti add column if not exists fornecedor_backup_id uuid references public.fornecedores(id) on delete restrict;

create table if not exists public.chamados_ti (
  id bigint primary key, titulo text not null, situacao integer not null, tipo integer,
  aberto timestamptz, ultima_alteracao timestamptz, solicitante_nome text,
  responsavel_nome text, departamento_nome text, assunto_nome text,
  payload jsonb not null default '{}'::jsonb, sincronizado_em timestamptz not null default now()
);
create index if not exists idx_chamados_ti_aberto on public.chamados_ti(aberto desc);
create index if not exists idx_chamados_ti_situacao on public.chamados_ti(situacao);

create table if not exists public.plantoes_ti (
  id uuid primary key default gen_random_uuid(), data date not null unique,
  colaborador_nome text not null, colaborador_email text not null, telefone text,
  observacao text, created_at timestamptz not null default now(),
  created_by uuid references public.usuarios(id)
);

alter table public.fornecedores enable row level security;
alter table public.licencas_ti enable row level security;
alter table public.softwares_ti enable row level security;
alter table public.provedores_ti enable row level security;
alter table public.chamados_ti enable row level security;
alter table public.plantoes_ti enable row level security;

do $$
declare tabela text;
begin
  foreach tabela in array array['fornecedores','licencas_ti','softwares_ti','provedores_ti','chamados_ti','plantoes_ti']
  loop
    execute format('drop policy if exists %I on public.%I', tabela || '_select', tabela);
    execute format('create policy %I on public.%I for select using (auth.role() = ''authenticated'')', tabela || '_select', tabela);
    execute format('drop policy if exists %I on public.%I', tabela || '_gestao', tabela);
    execute format(
      'create policy %I on public.%I for all using (exists (select 1 from public.usuarios where id=auth.uid() and role in (''admin'',''gestor''))) with check (exists (select 1 from public.usuarios where id=auth.uid() and role in (''admin'',''gestor'')))',
      tabela || '_gestao', tabela
    );
  end loop;
end $$;

-- A view passa a usar o cadastro mestre sem quebrar telas legadas.
create or replace view public.top_fornecedores as
select coalesce(f.nome_fantasia, p.fornecedor) fornecedor,
       count(*) total_lancamentos, sum(p.valor) total_valor,
       round(sum(p.valor) / nullif(sum(sum(p.valor)) over (), 0) * 100, 1) percentual
from public.pagamentos p
left join public.fornecedores f on f.id = p.fornecedor_id
group by coalesce(f.nome_fantasia, p.fornecedor)
order by total_valor desc;
