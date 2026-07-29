-- Mantém todas as referências de fornecedor ligadas ao cadastro mestre.
-- Os campos textuais permanecem por compatibilidade com a interface e relatórios,
-- mas as chaves estrangeiras passam a ser a fonte de identidade.

create or replace function public.obter_ou_criar_fornecedor_id(nome text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  nome_normalizado text := nullif(trim(nome), '');
  fornecedor_id uuid;
begin
  if nome_normalizado is null then
    return null;
  end if;

  select id
    into fornecedor_id
    from public.fornecedores
   where lower(nome_fantasia) = lower(nome_normalizado)
   limit 1;

  if fornecedor_id is null then
    begin
      insert into public.fornecedores (razao_social, nome_fantasia)
      values (nome_normalizado, nome_normalizado)
      returning id into fornecedor_id;
    exception
      when unique_violation then
        select id
          into fornecedor_id
          from public.fornecedores
         where lower(nome_fantasia) = lower(nome_normalizado)
         limit 1;
    end;
  end if;

  return fornecedor_id;
end;
$$;

create or replace function public.sincronizar_pagamento_fornecedor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.fornecedor_id is null then
    new.fornecedor_id := public.obter_ou_criar_fornecedor_id(new.fornecedor);
  else
    select nome_fantasia
      into new.fornecedor
      from public.fornecedores
     where id = new.fornecedor_id;
  end if;

  return new;
end;
$$;

drop trigger if exists pagamentos_sincronizar_fornecedor on public.pagamentos;
create trigger pagamentos_sincronizar_fornecedor
before insert or update of fornecedor, fornecedor_id on public.pagamentos
for each row execute function public.sincronizar_pagamento_fornecedor();

update public.pagamentos
   set fornecedor_id = public.obter_ou_criar_fornecedor_id(fornecedor)
 where fornecedor_id is null;

alter table public.pagamentos
  alter column fornecedor_id set not null;

create or replace function public.sincronizar_provedor_fornecedores()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.fornecedor_principal_id is null then
    new.fornecedor_principal_id :=
      public.obter_ou_criar_fornecedor_id(new.provedor_principal);
  else
    select nome_fantasia
      into new.provedor_principal
      from public.fornecedores
     where id = new.fornecedor_principal_id;
  end if;

  if nullif(trim(new.provedor_backup), '') is null
     and new.fornecedor_backup_id is null then
    new.provedor_backup := '';
  elsif new.fornecedor_backup_id is null then
    new.fornecedor_backup_id :=
      public.obter_ou_criar_fornecedor_id(new.provedor_backup);
  else
    select nome_fantasia
      into new.provedor_backup
      from public.fornecedores
     where id = new.fornecedor_backup_id;
  end if;

  return new;
end;
$$;

drop trigger if exists provedores_sincronizar_fornecedores on public.provedores_ti;
create trigger provedores_sincronizar_fornecedores
before insert or update of provedor_principal, provedor_backup,
  fornecedor_principal_id, fornecedor_backup_id
on public.provedores_ti
for each row execute function public.sincronizar_provedor_fornecedores();

update public.provedores_ti
   set fornecedor_principal_id =
         public.obter_ou_criar_fornecedor_id(provedor_principal),
       fornecedor_backup_id =
         public.obter_ou_criar_fornecedor_id(provedor_backup)
 where fornecedor_principal_id is null
    or (fornecedor_backup_id is null and nullif(trim(provedor_backup), '') is not null);

alter table public.provedores_ti
  alter column fornecedor_principal_id set not null;

revoke all on function public.obter_ou_criar_fornecedor_id(text)
  from public, anon, authenticated;
