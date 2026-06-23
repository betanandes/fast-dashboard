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

    // Busca segredo existente
    const { data: perfil } = await (supabase.from("usuarios") as any)
      .select("nome, email, mfa_ativo, mfa_secret")
      .eq("id", user.id)
      .single();

    // Se ja tem segredo salvo, usa o existente — nao gera um novo
    let secretBase32 = perfil?.mfa_secret;

    if (!secretBase32) {
      // Primeira vez — gera e salva
      const secret = new OTPAuth.Secret({ size: 20 });
      secretBase32 = secret.base32;

      await (supabase.from("usuarios") as any)
        .update({ mfa_secret: secretBase32 })
        .eq("id", user.id);
    }

    const totp = new OTPAuth.TOTP({
      issuer: "Fast TI",
      label: perfil?.email ?? user.email ?? "usuario",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secretBase32),
    });

    return new Response(
      JSON.stringify({
        sucesso: true,
        secret: secretBase32,
        otpauth_uri: totp.toString(),
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
