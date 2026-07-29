import { validarSessaoSupabase, type SultsServerEnv } from "../../server/sultsTickets";

interface Anexo { filename: string; content: string }
interface Req { method?: string; headers: Record<string, string | string[] | undefined>; body?: { para?: string; assunto?: string; mensagem?: string; anexos?: Anexo[] } }
interface Res { status: (codigo: number) => Res; json: (corpo: unknown) => void }

export default async function handler(req: Req, res: Res) {
  if (req.method !== "POST") return res.status(405).json({ erro: "Método não permitido" });
  const auth = Array.isArray(req.headers.authorization) ? req.headers.authorization[0] : req.headers.authorization;
  if (!(await validarSessaoSupabase(auth, process.env as SultsServerEnv))) return res.status(401).json({ erro: "Sessão inválida" });
  const { para, assunto, mensagem, anexos = [] } = req.body ?? {};
  if (!para || !assunto || !mensagem) return res.status(400).json({ erro: "Destinatário, assunto e mensagem são obrigatórios." });
  if (!process.env.RESEND_API_KEY) return res.status(503).json({ erro: "RESEND_API_KEY não foi configurada no servidor." });
  if (anexos.some((item) => item.content.length > 10_000_000)) return res.status(413).json({ erro: "O anexo excede o limite permitido." });
  const html = mensagem.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "").replace(/\son\w+="[^"]*"/gi, "");
  const resposta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL ?? "Fast TI <onboarding@resend.dev>", to: [para], subject: assunto, html, attachments: anexos }),
  });
  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) return res.status(502).json({ erro: `Resend retornou HTTP ${resposta.status}.`, detalhe: corpo });
  return res.status(200).json({ sucesso: true });
}
