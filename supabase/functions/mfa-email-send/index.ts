import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Gera código de 6 dígitos
function gerarCodigo(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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

    // Gera código e define expiração (10 minutos)
    const codigo = gerarCodigo();
    const expiracao = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Salva código no banco
    await (supabase.from("usuarios") as any)
      .update({
        mfa_codigo: codigo,
        mfa_expiracao: expiracao,
      })
      .eq("id", user.id);

    // Envia e-mail via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY")!;
    const emailDestino = user.email!;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Fast TI <onboarding@resend.dev>",
        to: [emailDestino],
        subject: "Seu código de acesso — Fast TI",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="background: #2563EB; width: 48px; height: 48px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <span style="color: white; font-size: 24px;">🔐</span>
              </div>
              <h1 style="color: #1E3A5F; font-size: 22px; margin: 0;">Fast Sistemas Construtivos</h1>
              <p style="color: #6B7280; font-size: 14px; margin-top: 4px;">Dashboard TI — Verificação de acesso</p>
            </div>

            <p style="color: #374151; font-size: 15px;">Olá,</p>
            <p style="color: #374151; font-size: 15px;">
              Seu código de verificação para acessar o Dashboard TI é:
            </p>

            <div style="background: #F3F4F6; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
              <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #1E3A5F; font-family: monospace;">
                ${codigo}
              </span>
            </div>

            <p style="color: #6B7280; font-size: 13px; text-align: center;">
              ⏱ Este código expira em <strong>10 minutos</strong>.
            </p>

            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />

            <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
              Se você não solicitou este código, ignore este e-mail.<br/>
              Dúvidas? Entre em contato com o TI.
            </p>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.json();
      console.error("Erro Resend:", errBody);
      return new Response(JSON.stringify({ erro: "Erro ao enviar e-mail" }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ sucesso: true, email: emailDestino }),
      {
        headers: { ...CORS, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("Erro mfa-email-send:", err);
    return new Response(JSON.stringify({ erro: "Erro interno" }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
