import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

function gerarSenhaTemporaria() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const trecho = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 12);
  return `Csc!${trecho}9`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ erro: "Método não permitido." }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ erro: "Autenticação obrigatória." }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = authHeader.replace(/^Bearer\s+/i, "");
    const {
      data: { user: solicitante },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !solicitante) {
      return json({ erro: "Sessão inválida ou expirada." }, 401);
    }

    const { data: perfil } = await supabase
      .from("usuarios")
      .select("role")
      .eq("id", solicitante.id)
      .single();

    if (perfil?.role !== "admin") {
      return json({ erro: "Somente administradores podem cadastrar colaboradores." }, 403);
    }

    const corpo = await req.json();
    const nome = String(corpo.nome ?? "").trim();
    const email = String(corpo.email ?? "").trim().toLowerCase();
    const role = String(corpo.role ?? "visualizador");

    if (nome.length < 2) return json({ erro: "Informe o nome do colaborador." }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ erro: "Informe um e-mail válido." }, 400);
    }
    if (!["admin", "gestor", "visualizador"].includes(role)) {
      return json({ erro: "Perfil de acesso inválido." }, 400);
    }

    const senhaTemporaria = gerarSenhaTemporaria();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: senhaTemporaria,
      email_confirm: true,
      user_metadata: { nome },
    });

    if (error || !data.user) {
      const duplicado = /already|registered|exists/i.test(error?.message ?? "");
      return json(
        { erro: duplicado ? "Já existe um usuário com este e-mail." : error?.message ?? "Não foi possível criar o usuário." },
        duplicado ? 409 : 400,
      );
    }

    const { error: perfilError } = await supabase.from("usuarios").upsert({
      id: data.user.id,
      nome,
      email,
      role,
      primeiro_acesso: true,
    });

    if (perfilError) {
      await supabase.auth.admin.deleteUser(data.user.id);
      throw perfilError;
    }

    return json({
      sucesso: true,
      usuario: {
        id: data.user.id,
        nome,
        email,
        role,
        primeiro_acesso: true,
        created_at: data.user.created_at,
      },
      senha_temporaria: senhaTemporaria,
    }, 201);
  } catch (error) {
    console.error("usuarios-admin:", error);
    return json({ erro: "Erro interno ao cadastrar colaborador." }, 500);
  }
});
