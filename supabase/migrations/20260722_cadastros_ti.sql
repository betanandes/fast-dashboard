create table if not exists public.licencas_ti (
  id uuid primary key default gen_random_uuid(), colaborador text not null, departamento text not null,
  codigo_sap text not null, app_control text not null unique, perfil text not null check (perfil in ('Profissional','Limitada')),
  crm boolean not null default false, logistica boolean not null default false, financeiro boolean not null default false,
  status text not null check (status in ('Ativo','Pendente','Inativo')), created_at timestamptz not null default now()
);
create table if not exists public.softwares_ti (
  id uuid primary key default gen_random_uuid(), nome text not null unique, aplicacao text not null, acesso text not null default '',
  valor_mensal numeric(12,2) not null default 0, valor_anual numeric(12,2) not null default 0,
  satisfaz text not null check (satisfaz in ('Sim','Em análise','Não')), link text not null default '', responsavel text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.maquinas_ti (
  id uuid primary key default gen_random_uuid(), maquina text not null, serie text not null unique, modelo text not null,
  unidade text not null, contato text not null default '', cnpj text not null default '', cidade text not null,
  ip text not null default '—', status text not null check (status in ('Online','Atenção','Offline')),
  observacao text not null default '', created_at timestamptz not null default now()
);

alter table public.licencas_ti enable row level security;
alter table public.softwares_ti enable row level security;
alter table public.maquinas_ti enable row level security;

drop policy if exists "licencas_select" on public.licencas_ti;
create policy "licencas_select" on public.licencas_ti for select using (auth.role() = 'authenticated');
drop policy if exists "licencas_gestao" on public.licencas_ti;
create policy "licencas_gestao" on public.licencas_ti for all using (exists (select 1 from public.usuarios where id=auth.uid() and role in ('admin','gestor'))) with check (exists (select 1 from public.usuarios where id=auth.uid() and role in ('admin','gestor')));
drop policy if exists "softwares_select" on public.softwares_ti;
create policy "softwares_select" on public.softwares_ti for select using (auth.role() = 'authenticated');
drop policy if exists "softwares_gestao" on public.softwares_ti;
create policy "softwares_gestao" on public.softwares_ti for all using (exists (select 1 from public.usuarios where id=auth.uid() and role in ('admin','gestor'))) with check (exists (select 1 from public.usuarios where id=auth.uid() and role in ('admin','gestor')));
drop policy if exists "maquinas_select" on public.maquinas_ti;
create policy "maquinas_select" on public.maquinas_ti for select using (auth.role() = 'authenticated');
drop policy if exists "maquinas_gestao" on public.maquinas_ti;
create policy "maquinas_gestao" on public.maquinas_ti for all using (exists (select 1 from public.usuarios where id=auth.uid() and role in ('admin','gestor'))) with check (exists (select 1 from public.usuarios where id=auth.uid() and role in ('admin','gestor')));
