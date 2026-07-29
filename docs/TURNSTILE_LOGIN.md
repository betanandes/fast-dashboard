# Cloudflare Turnstile no login

O Cloudflare Turnstile possui plano gratuito com até 20 widgets, 10 hostnames
por widget e desafios ilimitados. Ele pode ser usado sem transferir o domínio
ou o DNS para a Cloudflare.

Documentação oficial:

- https://developers.cloudflare.com/turnstile/plans/
- https://developers.cloudflare.com/turnstile/get-started/
- https://supabase.com/docs/guides/auth/auth-captcha

## Ativação

1. Acesse o painel Cloudflare e crie um widget Turnstile do tipo **Managed**.
2. Cadastre os domínios de produção. Não use `localhost` no widget de produção.
3. Copie a `sitekey` pública para o `.env` da aplicação:

   ```env
   VITE_TURNSTILE_SITE_KEY=sua_sitekey
   ```

4. No Supabase, abra **Authentication → Bot and Abuse Protection → CAPTCHA
   protection**.
5. Selecione Cloudflare Turnstile, informe a chave secreta e salve.
6. Publique novamente a aplicação.

A chave secreta nunca deve receber o prefixo `VITE_` nem ser colocada no
frontend. O componente já está integrado ao login e à redefinição de senha;
sem `VITE_TURNSTILE_SITE_KEY`, ele permanece desativado.

## Teste local

Use apenas em desenvolvimento:

```env
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

No Supabase/ambiente de teste, a chave secreta correspondente é:

```text
1x0000000000000000000000000000000AA
```

Não misture chaves de teste e produção.
