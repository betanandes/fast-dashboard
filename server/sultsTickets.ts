export interface SultsServerEnv {
  SULTS_API_BASE_URL?: string;
  SULTS_TICKET_PATH?: string;
  SULTS_API_TOKEN?: string;
  SULTS_AUTH_HEADER?: string;
  SULTS_AUTH_SCHEME?: string;
  SULTS_TIMEOUT_MS?: string;
  SULTS_PAGE_LIMIT?: string;
  SULTS_MAX_PAGES?: string;
  SULTS_REQUEST_DELAY_MS?: string;
  SULTS_RETRY_MAX?: string;
  SULTS_RETRY_BASE_MS?: string;
  TICKET_CACHE_TTL_MS?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}

interface PaginaSults {
  data?: unknown[];
  totalPage?: number;
  size?: number;
}

interface ResultadoChamados {
  data: unknown[];
  cache: boolean;
  stale?: boolean;
  aviso?: string;
}

export interface FiltroPeriodoChamados {
  abertoStart?: string;
  abertoEnd?: string;
}

const caches = new Map<string, { expiraEm: number; data: unknown[] }>();
const consultasEmAndamento = new Map<string, Promise<unknown[]>>();

function numero(valor: string | undefined, padrao: number) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : padrao;
}

function aguardar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function esperaRetryAfter(valor: string | null) {
  if (!valor) return null;
  const segundos = Number(valor);
  if (Number.isFinite(segundos)) return Math.max(0, segundos * 1_000);
  const data = Date.parse(valor);
  return Number.isNaN(data) ? null : Math.max(0, data - Date.now());
}

export async function validarSessaoSupabase(authorization: string | undefined, env: SultsServerEnv) {
  if (!authorization?.startsWith("Bearer ")) return false;
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) return false;
  const resposta = await fetch(`${env.VITE_SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: authorization, apikey: env.VITE_SUPABASE_ANON_KEY },
  });
  return resposta.ok;
}

async function requisitarPagina(url: URL, headers: Record<string, string>, timeout: number, env: SultsServerEnv) {
  const tentativas = Math.max(0, numero(env.SULTS_RETRY_MAX, 3));
  const esperaBase = Math.max(250, numero(env.SULTS_RETRY_BASE_MS, 1_000));

  for (let tentativa = 0; tentativa <= tentativas; tentativa += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const resposta = await fetch(url, { headers, signal: controller.signal });
      if (resposta.status === 429 && tentativa < tentativas) {
        const esperaServidor = esperaRetryAfter(resposta.headers.get("retry-after"));
        await aguardar(Math.min(10_000, esperaServidor ?? esperaBase * 2 ** tentativa));
        continue;
      }
      const corpo = (await resposta.json().catch(() => null)) as PaginaSults | null;
      if (resposta.status === 429) throw new Error("A SULTS limitou temporariamente as consultas. Aguarde alguns instantes antes de atualizar novamente.");
      if (!resposta.ok) throw new Error(`SULTS retornou HTTP ${resposta.status}.`);
      return corpo;
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error("Não foi possível consultar a SULTS após novas tentativas.");
}

async function consultarSults(env: SultsServerEnv, filtros: FiltroPeriodoChamados) {
  const token = env.SULTS_API_TOKEN?.trim();
  if (!token) throw new Error("SULTS_API_TOKEN não foi configurado no servidor.");
  const base = (env.SULTS_API_BASE_URL ?? "https://api.sults.com.br/api/v1").replace(/\/$/, "");
  const path = env.SULTS_TICKET_PATH ?? "/chamado/ticket";
  const limit = Math.min(100, Math.max(1, numero(env.SULTS_PAGE_LIMIT, 100)));
  const maxPages = Math.max(0, numero(env.SULTS_MAX_PAGES, 0));
  const timeout = Math.max(1_000, numero(env.SULTS_TIMEOUT_MS, 10_000));
  const intervalo = Math.max(0, numero(env.SULTS_REQUEST_DELAY_MS, 350));
  const header = env.SULTS_AUTH_HEADER ?? "Authorization";
  const scheme = env.SULTS_AUTH_SCHEME?.trim();
  const authorization = scheme ? `${scheme} ${token}` : token;
  const headers = { [header]: authorization, "Content-Type": "application/json;charset=UTF-8" };
  const chamados: unknown[] = [];
  let pagina = 0;
  let totalPaginas: number | null = null;

  while (totalPaginas === null || pagina < totalPaginas) {
    const url = new URL(`${base}${path.startsWith("/") ? path : `/${path}`}`);
    url.searchParams.set("start", String(pagina));
    url.searchParams.set("limit", String(limit));
    if (filtros.abertoStart) url.searchParams.set("abertoStart", filtros.abertoStart);
    if (filtros.abertoEnd) url.searchParams.set("abertoEnd", filtros.abertoEnd);
    const corpo = await requisitarPagina(url, headers, timeout, env);
    const lote = corpo?.data ?? [];
    chamados.push(...lote);
    totalPaginas = Math.max(1, Number(corpo?.totalPage ?? (lote.length === limit ? pagina + 2 : pagina + 1)));
    pagina += 1;
    if (lote.length < limit || (maxPages > 0 && pagina >= maxPages)) break;
    if (intervalo) await aguardar(intervalo);
  }
  return chamados;
}

export async function buscarTodosChamados(env: SultsServerEnv, ignorarCache = false, filtros: FiltroPeriodoChamados = {}): Promise<ResultadoChamados> {
  const ttl = numero(env.TICKET_CACHE_TTL_MS, 600_000);
  const chave = `${filtros.abertoStart ?? "todos"}|${filtros.abertoEnd ?? "todos"}`;
  const cache = caches.get(chave);
  if (!ignorarCache && cache && cache.expiraEm > Date.now()) return { data: cache.data, cache: true };

  if (!consultasEmAndamento.has(chave)) consultasEmAndamento.set(chave, consultarSults(env, filtros));
  const consulta = consultasEmAndamento.get(chave)!;
  try {
    const data = await consulta;
    caches.set(chave, { data, expiraEm: Date.now() + ttl });
    return { data, cache: false };
  } catch (erro) {
    if (cache?.data.length) return { data: cache.data, cache: true, stale: true, aviso: erro instanceof Error ? erro.message : String(erro) };
    throw erro;
  } finally {
    if (consultasEmAndamento.get(chave) === consulta) consultasEmAndamento.delete(chave);
  }
}
