import { buscarTodosChamados, validarSessaoSupabase, type SultsServerEnv } from "../../server/sultsTickets";

interface RequestLike {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
}

interface ResponseLike {
  status: (codigo: number) => ResponseLike;
  json: (corpo: unknown) => void;
  setHeader: (nome: string, valor: string) => void;
}

export default async function handler(req: RequestLike, res: ResponseLike) {
  if (req.method !== "GET") return res.status(405).json({ erro: "Método não permitido" });
  const auth = Array.isArray(req.headers.authorization) ? req.headers.authorization[0] : req.headers.authorization;
  const env = process.env as SultsServerEnv;
  if (!(await validarSessaoSupabase(auth, env))) return res.status(401).json({ erro: "Sessão inválida" });
  try {
    const refresh = req.query?.refresh === "true";
    const resultado = await buscarTodosChamados(env, refresh);
    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).json(resultado);
  } catch (erro) {
    return res.status(502).json({ erro: erro instanceof Error ? erro.message : String(erro) });
  }
}
