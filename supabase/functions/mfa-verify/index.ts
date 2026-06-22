//Valida o código TOTP enviado pelo usuário e ativa o MFA se for a primeira vez

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

    const { codigo, ativar } = await req.json();
    if (!codigo) {
      return new Response(JSON.stringify({ erro: "Codigo obrigatorio" }), {
        status: 400,
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

    // Busca o segredo do usuario
    const { data: perfil } = await (supabase.from("usuarios") as any)
      .select("mfa_secret, mfa_ativo")
      .eq("id", user.id)
      .single();

    if (!perfil?.mfa_secret) {
      return new Response(
        JSON.stringify({ erro: "MFA nao configurado para este usuario" }),
        {
          status: 400,
          headers: { ...CORS, "Content-Type": "application/json" },
        },
      );
    }

    // Valida o codigo TOTP
    const totp = new OTPAuth.TOTP({
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(perfil.mfa_secret),
    });

    // window: 1 aceita 1 periodo antes/depois (30s de tolerancia)
    const delta = totp.validate({
      token: codigo.replace(/\s/g, ""),
      window: 1,
    });
    const valido = delta !== null;

    if (!valido) {
      return new Response(
        JSON.stringify({ sucesso: false, erro: "Codigo invalido ou expirado" }),
        {
          status: 400,
          headers: { ...CORS, "Content-Type": "application/json" },
        },
      );
    }

    // Se for para ativar o MFA (primeiro uso), marca como ativo
    if (ativar && !perfil.mfa_ativo) {
      await (supabase.from("usuarios") as any)
        .update({ mfa_ativo: true })
        .eq("id", user.id);
    }

    return new Response(JSON.stringify({ sucesso: true }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erro mfa-verify:", err);
    return new Response(JSON.stringify({ erro: "Erro interno" }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
