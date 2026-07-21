create table if not exists public.provedores_ti (
  id uuid primary key default gen_random_uuid(),
  loja text not null unique,
  cidade text not null,
  uf text not null,
  provedor_principal text not null,
  provedor_backup text not null default '',
  velocidade text not null,
  tecnologia text not null check (tecnologia in ('Fibra', 'Rádio', 'Cabo')),
  status text not null check (status in ('Operacional', 'Instável', 'Indisponível')),
  telefone_suporte text not null default '',
  vencimento_contrato text not null default '',
  created_at timestamptz not null default now()
);

alter table public.provedores_ti enable row level security;

drop policy if exists "provedores_select" on public.provedores_ti;
create policy "provedores_select" on public.provedores_ti
  for select using (auth.role() = 'authenticated');

drop policy if exists "provedores_gestao" on public.provedores_ti;
create policy "provedores_gestao" on public.provedores_ti
  for all
  using (exists (select 1 from public.usuarios where id = auth.uid() and role in ('admin', 'gestor')))
  with check (exists (select 1 from public.usuarios where id = auth.uid() and role in ('admin', 'gestor')));
