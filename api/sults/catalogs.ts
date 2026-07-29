import { buscarCatalogosSults, ErroSults, validarSessaoSupabase, type SultsServerEnv } from "../../server/sultsTickets";

interface Req { method?: string; headers: Record<string, string | string[] | undefined> }
interface Res { status: (codigo: number) => Res; json: (corpo: unknown) => void; setHeader: (nome: string, valor: string) => void }

export default async function handler(req: Req, res: Res) {
  if (req.method !== "GET") return res.status(405).json({ erro: "Método não permitido" });
  const auth = Array.isArray(req.headers.authorization) ? req.headers.authorization[0] : req.headers.authorization;
  const env = process.env as SultsServerEnv;
  if (!(await validarSessaoSupabase(auth, env))) return res.status(401).json({ erro: "Sessão inválida" });
  try {
    res.setHeader("Cache-Control", "private, max-age=300");
    return res.status(200).json(await buscarCatalogosSults(env));
  } catch (erro) {
    const status = erro instanceof ErroSults && erro.status >= 400 && erro.status < 500 ? erro.status : 502;
    return res.status(status).json({ erro: erro instanceof Error ? erro.message : String(erro) });
  }
}
