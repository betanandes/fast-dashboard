-- Expõe o schema à aplicação autenticada. As políticas RLS continuam sendo
-- responsáveis por limitar leitura e escrita conforme o perfil do usuário.

grant usage on schema public to authenticated;

grant select, insert, update, delete
on all tables in schema public
to authenticated;

grant usage, select
on all sequences in schema public
to authenticated;

alter default privileges for role postgres in schema public
grant select, insert, update, delete on tables to authenticated;

alter default privileges for role postgres in schema public
grant usage, select on sequences to authenticated;

-- Visitantes não autenticados não acessam os dados administrativos.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
