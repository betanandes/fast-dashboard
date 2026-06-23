import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { codigo } = await req.json();
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

    // Busca código e expiração do banco
    const { data: perfil } = await (supabase.from("usuarios") as any)
      .select("mfa_codigo, mfa_expiracao")
      .eq("id", user.id)
      .single();

    if (!perfil?.mfa_codigo) {
      return new Response(
        JSON.stringify({ erro: "Nenhum codigo pendente. Solicite um novo." }),
        {
          status: 400,
          headers: { ...CORS, "Content-Type": "application/json" },
        },
      );
    }

    // Verifica expiração
    const agora = new Date();
    const expiracao = new Date(perfil.mfa_expiracao);
    if (agora > expiracao) {
      // Limpa código expirado
      await (supabase.from("usuarios") as any)
        .update({ mfa_codigo: null, mfa_expiracao: null })
        .eq("id", user.id);

      return new Response(
        JSON.stringify({ erro: "Codigo expirado. Solicite um novo." }),
        {
          status: 400,
          headers: { ...CORS, "Content-Type": "application/json" },
        },
      );
    }

    // Verifica se o código bate
    if (perfil.mfa_codigo !== codigo.trim()) {
      return new Response(JSON.stringify({ erro: "Codigo incorreto." }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Código correto — limpa do banco
    await (supabase.from("usuarios") as any)
      .update({ mfa_codigo: null, mfa_expiracao: null })
      .eq("id", user.id);

    return new Response(JSON.stringify({ sucesso: true }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erro mfa-email-verify:", err);
    return new Response(JSON.stringify({ erro: "Erro interno" }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
