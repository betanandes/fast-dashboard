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
```

Aguarde: `Deployed Function importar-excel`

## Verificar

No painel Supabase: **Edge Functions** → deve aparecer `importar-excel`.
