-- Permite que administradores consultem a equipe sem abrir os perfis para
-- usuários comuns. A função security definer evita recursão nas políticas RLS.
create or replace function public.usuario_atual_e_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.usuarios
     where id = auth.uid()
       and role = 'admin'
  );
$$;

revoke all on function public.usuario_atual_e_admin()
  from public, anon;
grant execute on function public.usuario_atual_e_admin()
  to authenticated, service_role;

drop policy if exists "usuarios_select_own" on public.usuarios;
create policy "usuarios_select_own_or_admin"
  on public.usuarios
  for select
  using (auth.uid() = id or public.usuario_atual_e_admin());
