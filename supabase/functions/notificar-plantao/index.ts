import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const JSON_HEADERS = { "Content-Type": "application/json" };
const TIMEZONE = "America/Sao_Paulo";
const DIA_MAP: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function horarioLocal() {
  const agora = new Date();
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(agora);
  const valor = (tipo: string) => partes.find((item) => item.type === tipo)?.value ?? "";
  return {
    diaSemana: DIA_MAP[valor("weekday")],
    data: `${valor("year")}-${valor("month")}-${valor("day")}`,
    hora: Number(valor("hour")),
  };
}

Deno.serve(async (req: Request) => {
  try {
    const segredo = Deno.env.get("CRON_SECRET");
    if (!segredo || req.headers.get("x-cron-secret") !== segredo) {
      return new Response(JSON.stringify({ erro: "Não autorizado" }), { status: 401, headers: JSON_HEADERS });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: config, error: erroConfig } = await supabase.from("configuracoes_plantao").select("*").eq("id", 1).single();
    if (erroConfig || !config) throw new Error(`Configuração não encontrada: ${erroConfig?.message}`);
    if (!config.ativo || !config.email_destino) return new Response(JSON.stringify({ ignorado: true, motivo: "Automação desativada" }), { headers: JSON_HEADERS });

    const local = horarioLocal();
    const horaConfigurada = Number(String(config.hora_envio).slice(0, 2));
    if (local.diaSemana !== config.dia_envio || local.hora !== horaConfigurada) {
      return new Response(JSON.stringify({ ignorado: true, motivo: "Fora do dia ou horário configurado" }), { headers: JSON_HEADERS });
    }

    const { data: plantao, error: erroPlantao } = await supabase.from("plantoes_ti").select("*").gte("data", local.data).order("data").limit(1).maybeSingle();
    if (erroPlantao || !plantao) throw new Error(`Próximo plantão não encontrado: ${erroPlantao?.message ?? "escala vazia"}`);

    const { data: existente } = await supabase.from("plantao_notificacoes").select("id").eq("plantao_id", plantao.id).eq("email_destino", config.email_destino).maybeSingle();
    if (existente) return new Response(JSON.stringify({ ignorado: true, motivo: "Notificação já enviada" }), { headers: JSON_HEADERS });

    const dataFormatada = new Date(`${plantao.data}T12:00:00-03:00`).toLocaleDateString("pt-BR", { timeZone: TIMEZONE, weekday: "long", day: "2-digit", month: "long", year: "numeric" });
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: Deno.env.get("RESEND_FROM_EMAIL") ?? "Fast TI <onboarding@resend.dev>",
        to: [config.email_destino],
        subject: `Plantão de sábado — ${plantao.colaborador_nome}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#1f2937"><p style="color:#c41e23;font-size:12px;font-weight:bold;text-transform:uppercase">Fast TI • Escala de plantão</p><h1 style="font-size:24px;margin:12px 0">Próximo plantão de sábado</h1><div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:14px;padding:22px;margin:24px 0"><h2 style="font-size:20px;margin:0 0 8px">${plantao.colaborador_nome}</h2><p style="margin:5px 0">📅 ${dataFormatada}</p><p style="margin:5px 0">✉️ ${plantao.colaborador_email}</p><p style="margin:5px 0">📞 ${plantao.telefone ?? "Não informado"}</p><p style="color:#6b7280;font-size:13px;margin:14px 0 0">${plantao.observacao ?? "Plantão remoto das 8h às 13h"}</p></div><p style="color:#9ca3af;font-size:12px">Mensagem automática configurada no Dashboard TI.</p></div>`,
      }),
    });
    if (!emailRes.ok) throw new Error(`Resend retornou HTTP ${emailRes.status}: ${await emailRes.text()}`);

    const { error: erroRegistro } = await supabase.from("plantao_notificacoes").insert({ plantao_id: plantao.id, email_destino: config.email_destino });
    if (erroRegistro) throw new Error(`E-mail enviado, mas não foi possível registrar: ${erroRegistro.message}`);
    return new Response(JSON.stringify({ sucesso: true, plantao: plantao.id, email: config.email_destino }), { headers: JSON_HEADERS });
  } catch (erro) {
    console.error("Erro notificar-plantao:", erro);
    return new Response(JSON.stringify({ erro: erro instanceof Error ? erro.message : String(erro) }), { status: 500, headers: JSON_HEADERS });
  }
});
