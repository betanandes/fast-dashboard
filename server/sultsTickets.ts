export interface SultsServerEnv {
  SULTS_API_BASE_URL?: string;
  SULTS_TICKET_PATH?: string;
  SULTS_API_TOKEN?: string;
  SULTS_AUTH_HEADER?: string;
  SULTS_AUTH_SCHEME?: string;
  SULTS_TIMEOUT_MS?: string;
  SULTS_PAGE_LIMIT?: string;
  SULTS_MAX_PAGES?: string;
  TICKET_CACHE_TTL_MS?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}

interface PaginaSults {
  data?: unknown[];
  totalPage?: number;
  size?: number;
}

let cache: { expiraEm: number; data: unknown[] } | null = null;

function numero(valor: string | undefined, padrao: number) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : padrao;
}

export async function validarSessaoSupabase(
  authorization: string | undefined,
  env: SultsServerEnv,
) {
  if (!authorization?.startsWith("Bearer ")) return false;
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) return false;
  const resposta = await fetch(`${env.VITE_SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: authorization,
      apikey: env.VITE_SUPABASE_ANON_KEY,
    },
  });
  return resposta.ok;
}

export async function buscarTodosChamados(env: SultsServerEnv, ignorarCache = false) {
  const token = env.SULTS_API_TOKEN?.trim();
  if (!token) throw new Error("SULTS_API_TOKEN não foi configurado no servidor.");

  const ttl = numero(env.TICKET_CACHE_TTL_MS, 600_000);
  if (!ignorarCache && cache && cache.expiraEm > Date.now()) {
    return { data: cache.data, cache: true };
  }

  const base = (env.SULTS_API_BASE_URL ?? "https://api.sults.com.br/api/v1").replace(/\/$/, "");
  const path = env.SULTS_TICKET_PATH ?? "/chamado/ticket";
  const limit = Math.min(100, Math.max(1, numero(env.SULTS_PAGE_LIMIT, 100)));
  const maxPages = Math.max(0, numero(env.SULTS_MAX_PAGES, 0));
  const timeout = Math.max(1_000, numero(env.SULTS_TIMEOUT_MS, 10_000));
  const header = env.SULTS_AUTH_HEADER ?? "Authorization";
  const scheme = env.SULTS_AUTH_SCHEME?.trim();
  const authorization = scheme ? `${scheme} ${token}` : token;
  const chamados: unknown[] = [];
  let pagina = 0;
  let totalPaginas: number | null = null;

  while (totalPaginas === null || pagina < totalPaginas) {
    const url = new URL(`${base}${path.startsWith("/") ? path : `/${path}`}`);
    url.searchParams.set("start", String(pagina));
    url.searchParams.set("limit", String(limit));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const resposta = await fetch(url, {
        headers: { [header]: authorization, "Content-Type": "application/json;charset=UTF-8" },
        signal: controller.signal,
      });
      const corpo = (await resposta.json().catch(() => null)) as PaginaSults | null;
      if (!resposta.ok) throw new Error(`SULTS retornou HTTP ${resposta.status}.`);
      const lote = corpo?.data ?? [];
      chamados.push(...lote);
      totalPaginas = Math.max(1, Number(corpo?.totalPage ?? (lote.length === limit ? pagina + 2 : pagina + 1)));
      pagina += 1;
      if (lote.length < limit) break;
    } finally {
      clearTimeout(timer);
    }
    if (maxPages > 0 && pagina >= maxPages) break;
  }

  cache = { data: chamados, expiraEm: Date.now() + ttl };
  return { data: chamados, cache: false };
}
