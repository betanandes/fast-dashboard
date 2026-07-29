-- Suporte ao fluxo de senha temporária e primeiro acesso.
alter table public.usuarios
  add column if not exists primeiro_acesso boolean not null default true;

-- Usuários comuns podem concluir o próprio primeiro acesso e ajustar o nome,
-- mas não podem promover o próprio perfil administrativo.
revoke update on public.usuarios from authenticated;
grant update (nome, primeiro_acesso) on public.usuarios to authenticated;

drop policy if exists "usuarios_update_own" on public.usuarios;
create policy "usuarios_update_own"
  on public.usuarios
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
