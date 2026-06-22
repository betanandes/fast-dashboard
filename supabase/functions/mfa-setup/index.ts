// Função para configurar o MFA (QR code)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as OTPAuth from "https://esm.sh/otpauth@9.3.6";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ erro: "Nao autorizado" }), {
        status: 401,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verifica o usuario logado
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (error || !user) {
      return new Response(JSON.stringify({ erro: "Usuario nao autenticado" }), {
        status: 401,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Busca dados do usuario
    const { data: perfil } = await (supabase.from("usuarios") as any)
      .select("nome, email, mfa_ativo")
      .eq("id", user.id)
      .single();

    // Se ja tem MFA ativo, nao gera novo
    // if (perfil?.mfa_ativo) {
    //   return new Response(
    //     JSON.stringify({ erro: "MFA ja esta ativo para este usuario" }),
    //     {
    //       status: 400,
    //       headers: { ...CORS, "Content-Type": "application/json" },
    //     },
    //   );
    // }

    // Gera segredo TOTP unico
    const secret = new OTPAuth.Secret({ size: 20 });
    const secretBase32 = secret.base32;

    // Salva o segredo no banco (ainda nao ativado)
    await (supabase.from("usuarios") as any)
      .update({ mfa_secret: secretBase32 })
      .eq("id", user.id);

    // Gera o TOTP com as informacoes da empresa
    const totp = new OTPAuth.TOTP({
      issuer: "Fast TI",
      label: perfil?.email ?? user.email ?? "usuario",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secretBase32),
    });

    // URI para gerar o QR code no frontend
    const otpAuthUri = totp.toString();

    return new Response(
      JSON.stringify({
        sucesso: true,
        secret: secretBase32,
        otpauth_uri: otpAuthUri,
      }),
      {
        headers: { ...CORS, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("Erro mfa-setup:", err);
    return new Response(JSON.stringify({ erro: "Erro interno" }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
