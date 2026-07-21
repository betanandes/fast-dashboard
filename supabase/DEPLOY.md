# Deploy da Edge Function no Supabase

## Pré-requisito — Supabase CLI

```bash
# Instalar (Windows PowerShell como admin)
winget install Supabase.CLI

# Verificar instalação
supabase --version
```

## Fazer login e linkar o projeto

```bash
supabase login
supabase link --project-ref ncjqusrdybfzbvwpshfw
```

## Deploy

```bash
supabase functions deploy importar-excel
supabase functions deploy notificar-plantao --no-verify-jwt
```

Aguarde: `Deployed Function importar-excel`

## Verificar

No painel Supabase: **Edge Functions** → deve aparecer `importar-excel`.

## Automação semanal do plantão

Antes do deploy, execute no **SQL Editor** apenas o arquivo
`supabase/migrations/20260721_plantao.sql`. Ele foi preparado para projetos que
já possuem o schema principal instalado.

Configure os segredos usados pela função:

```bash
supabase secrets set RESEND_API_KEY="sua_chave_resend"
supabase secrets set RESEND_FROM_EMAIL="Fast TI <ti@seudominio.com.br>"
supabase secrets set CRON_SECRET="gere-um-segredo-longo-e-aleatorio"
```

No Supabase Dashboard, abra **Integrations → Cron** e crie uma tarefa executada
a cada hora (`0 * * * *`) para chamar a função `notificar-plantao`. Envie o
header `x-cron-secret` com o mesmo valor de `CRON_SECRET`.

A função compara o dia e horário atuais no fuso `America/Sao_Paulo` com os
valores da tela **Configurações**, busca o próximo sábado em `plantoes_ti` e
registra o envio em `plantao_notificacoes` para impedir duplicidades.

## CRUD dos cadastros de TI

Execute no **SQL Editor** o arquivo:

```text
supabase/migrations/20260722_cadastros_ti.sql
```

Ele cria as tabelas de licenças, softwares e máquinas. Usuários autenticados
podem consultar; somente perfis `admin` e `gestor` podem alterar ou excluir.

Para habilitar o CRUD de provedores, execute também:

```text
supabase/migrations/20260723_provedores_ti.sql
```

Se o console mostrar `404` para `licencas_ti`, `softwares_ti`, `maquinas_ti`,
`provedores_ti`, `plantoes_ti` ou `configuracoes_plantao`, as migrations acima
ainda não foram aplicadas no projeto Supabase usado pelo `.env`.

## Painel de chamados SULTS

Em desenvolvimento, as variáveis `SULTS_*` do `.env` são lidas pelo proxy do
Vite. Depois de preencher `SULTS_API_TOKEN`, reinicie `npm run dev`.

O proxy consolida consultas simultâneas, preserva o último cache válido e
aplica espera progressiva quando a SULTS responde com HTTP 429. Os valores
opcionais estão documentados no `.env.example`.

Na Vercel, cadastre as mesmas variáveis em **Settings → Environment Variables**,
incluindo `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. A função
`api/sults/tickets.ts` valida a sessão Supabase antes de usar o token e nunca o
envia ao navegador.
