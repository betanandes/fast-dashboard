import { criarChamado, ErroSults, validarSessaoSupabase, type SultsServerEnv } from "../../server/sultsTickets";

interface Req { method?: string; headers: Record<string, string | string[] | undefined>; body?: Record<string, unknown> }
interface Res { status: (codigo: number) => Res; json: (corpo: unknown) => void }

export default async function handler(req: Req, res: Res) {
  if (req.method !== "POST") return res.status(405).json({ erro: "Método não permitido" });
  const auth = Array.isArray(req.headers.authorization) ? req.headers.authorization[0] : req.headers.authorization;
  const env = process.env as SultsServerEnv;
  if (!(await validarSessaoSupabase(auth, env))) return res.status(401).json({ erro: "Sessão inválida" });
  try {
    const payload = req.body ?? {};
    if (!payload.titulo || !payload.mensagem || !payload.solicitanteId || !payload.departamentoId || !payload.assuntoId) {
      return res.status(400).json({ erro: "Título, mensagem, solicitante, departamento e assunto são obrigatórios." });
    }
    return res.status(201).json(await criarChamado(env, payload));
  } catch (erro) {
    const status = erro instanceof ErroSults && erro.status >= 400 && erro.status < 500 ? erro.status : 502;
    return res.status(status).json({ erro: erro instanceof Error ? erro.message : String(erro) });
  }
}
