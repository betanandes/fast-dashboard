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
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  SULTS_CATALOG_MAX_PAGES?: string;
}

interface PaginaSults {
  data?: unknown[];
  totalPage?: number;
  size?: number;
}

export class ErroSults extends Error {
  readonly status: number;

  constructor(status: number, mensagem: string) {
    super(mensagem);
    this.name = "ErroSults";
    this.status = status;
  }
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
let cacheCatalogos: { expiraEm: number; data: unknown } | null = null;
let catalogosEmAndamento: Promise<unknown> | null = null;

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
      const corpo = (await resposta.json().catch(() => null)) as (PaginaSults & { message?: string; mensagem?: string; error?: string }) | null;
      if (resposta.status === 429) throw new Error("A SULTS limitou temporariamente as consultas. Aguarde alguns instantes antes de atualizar novamente.");
      if (!resposta.ok) {
        const detalhe = corpo?.message ?? corpo?.mensagem ?? corpo?.error;
        throw new ErroSults(resposta.status, `SULTS retornou HTTP ${resposta.status}${detalhe ? `: ${detalhe}` : "."}`);
      }
      return corpo;
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error("Não foi possível consultar a SULTS após novas tentativas.");
}

async function consultarSults(env: SultsServerEnv, filtros: FiltroPeriodoChamados, aceitarParcial = false) {
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
    let corpo: PaginaSults | null;
    try {
      corpo = await requisitarPagina(url, headers, timeout, env);
    } catch (erro) {
      if (aceitarParcial && chamados.length) break;
      throw erro;
    }
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

export async function criarChamado(env: SultsServerEnv, payload: Record<string, unknown>) {
  const token = env.SULTS_API_TOKEN?.trim();
  if (!token) throw new Error("SULTS_API_TOKEN não foi configurado no servidor.");
  const base = (env.SULTS_API_BASE_URL ?? "https://api.sults.com.br/api/v1").replace(/\/$/, "");
  const path = env.SULTS_TICKET_PATH ?? "/chamado/ticket";
  const header = env.SULTS_AUTH_HEADER ?? "Authorization";
  const scheme = env.SULTS_AUTH_SCHEME?.trim();
  const resposta = await fetch(`${base}${path.startsWith("/") ? path : `/${path}`}`, {
    method: "POST",
    headers: { [header]: scheme ? `${scheme} ${token}` : token, "Content-Type": "application/json;charset=UTF-8" },
    body: JSON.stringify(payload),
  });
  const corpo = await resposta.json().catch(() => null) as { id?: number; message?: string; mensagem?: string; error?: string } | null;
  if (!resposta.ok) throw new ErroSults(resposta.status, corpo?.message ?? corpo?.mensagem ?? corpo?.error ?? `SULTS retornou HTTP ${resposta.status}.`);
  if (!corpo?.id) throw new Error("A SULTS não retornou o número do chamado criado.");
  return corpo;
}

export async function buscarCatalogosSults(env: SultsServerEnv) {
  if (cacheCatalogos && cacheCatalogos.expiraEm > Date.now()) return cacheCatalogos.data;
  if (catalogosEmAndamento) return catalogosEmAndamento;
  const carregar = async () => {
  // Cinco páginas (até 500 chamados) dão resposta rápida e normalmente cobrem
  // os catálogos ativos. O valor pode ser ampliado por variável de ambiente.
  const data = await consultarSults({ ...env, SULTS_MAX_PAGES: env.SULTS_CATALOG_MAX_PAGES ?? "5" }, {}, true);
  const departamentos = new Map<number, string>();
  const assuntos = new Map<number, string>();
  const assuntosPorDepartamento = new Map<number, Map<number, string>>();
  const pessoas = new Map<number, string>();
  const pessoasPorDepartamento = new Map<number, Map<number, string>>();
  const responsaveisPorDepartamentoAssunto = new Map<string, Map<number, string>>();
  const vincular = (departamento: unknown, pessoa: unknown) => {
    const d = departamento as { id?: number; nome?: string } | undefined;
    const p = pessoa as { id?: number; nome?: string } | undefined;
    if (d?.id && d.nome) departamentos.set(d.id, d.nome);
    if (p?.id && p.nome) pessoas.set(p.id, p.nome);
    if (!d?.id || !p?.id || !p.nome) return;
    if (!pessoasPorDepartamento.has(d.id)) pessoasPorDepartamento.set(d.id, new Map());
    pessoasPorDepartamento.get(d.id)!.set(p.id, p.nome);
  };
  data.forEach((registro) => {
    const chamado = registro as { solicitante?: unknown; responsavel?: unknown; departamento?: unknown; departamentoEnvio?: unknown; assunto?: { id?: number; nome?: string; assunto?: string }; apoio?: Array<{ pessoa?: unknown; departamento?: unknown }> };
    vincular(chamado.departamento, chamado.responsavel);
    vincular(chamado.departamentoEnvio, chamado.solicitante);
    chamado.apoio?.forEach((item) => vincular(item.departamento, item.pessoa));
    const nomeAssunto = chamado.assunto?.nome ?? chamado.assunto?.assunto;
    const departamento = chamado.departamento as { id?: number } | undefined;
    if (chamado.assunto?.id && nomeAssunto) {
      assuntos.set(chamado.assunto.id, nomeAssunto);
      if (departamento?.id) {
        if (!assuntosPorDepartamento.has(departamento.id)) assuntosPorDepartamento.set(departamento.id, new Map());
        assuntosPorDepartamento.get(departamento.id)!.set(chamado.assunto.id, nomeAssunto);
      }
    }
    const responsavel = chamado.responsavel as { id?: number; nome?: string } | undefined;
    if (departamento?.id && chamado.assunto?.id && responsavel?.id && responsavel.nome) {
      const chave = `${departamento.id}:${chamado.assunto.id}`;
      if (!responsaveisPorDepartamentoAssunto.has(chave)) responsaveisPorDepartamentoAssunto.set(chave, new Map());
      responsaveisPorDepartamentoAssunto.get(chave)!.set(responsavel.id, responsavel.nome);
    }
  });
  const token = env.SULTS_API_TOKEN?.trim() ?? "";
  const base = new URL(env.SULTS_API_BASE_URL ?? "https://api.sults.com.br/api/v1");
  const header = env.SULTS_AUTH_HEADER ?? "Authorization";
  const scheme = env.SULTS_AUTH_SCHEME?.trim();
  const ativos = new Set<number>();
  let ativosValidados = true;
  let aviso: string | undefined;
  for (let pagina = 0; pagina < 10; pagina += 1) {
    const url = new URL("/v1/pessoas", base.origin);
    url.searchParams.set("start", String(pagina));
    url.searchParams.set("limit", "100");
    let resposta: Response | null = null;
    for (let tentativa = 0; tentativa < 3; tentativa += 1) {
      resposta = await fetch(url, { headers: { [header]: scheme ? `${scheme} ${token}` : token } });
      if (resposta.status !== 429) break;
      const esperaServidor = esperaRetryAfter(resposta.headers.get("retry-after"));
      await aguardar(Math.min(5_000, esperaServidor ?? 750 * 2 ** tentativa));
    }
    if (!resposta?.ok) {
      ativosValidados = false;
      aviso = resposta?.status === 429
        ? "A SULTS limitou a consulta de pessoas ativas. Os nomes foram carregados pelo histórico de chamados e podem incluir cadastros inativos."
        : `Não foi possível validar as pessoas ativas na SULTS (HTTP ${resposta?.status ?? "desconhecido"}). Os nomes foram carregados pelo histórico.`;
      break;
    }
    const lote = await resposta.json().catch(() => []) as Array<{ id?: number; ativo?: boolean }>;
    lote.forEach((pessoa) => { if (pessoa.id && pessoa.ativo !== false) ativos.add(pessoa.id); });
    if (lote.length < 100) break;
  }
  const ordenar = (itens: Array<{ id: number; nome: string }>) => itens.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const somenteAtivos = (mapa: Map<number, string>) => ordenar([...mapa].filter(([id]) => !ativosValidados || ativos.has(id)).map(([id, nome]) => ({ id, nome })));
  const resultado = {
    departamentos: ordenar([...departamentos].map(([id, nome]) => ({ id, nome }))),
    assuntos: ordenar([...assuntos].map(([id, nome]) => ({ id, nome }))),
    pessoas: somenteAtivos(pessoas),
    pessoasHistorico: ordenar([...pessoas].map(([id, nome]) => ({ id, nome }))),
    pessoasPorDepartamento: Object.fromEntries([...pessoasPorDepartamento].map(([id, mapa]) => [id, somenteAtivos(mapa)])),
    assuntosPorDepartamento: Object.fromEntries([...assuntosPorDepartamento].map(([id, mapa]) => [id, ordenar([...mapa].map(([assuntoId, nome]) => ({ id: assuntoId, nome })))])),
    responsaveisPorDepartamentoAssunto: Object.fromEntries([...responsaveisPorDepartamentoAssunto].map(([chave, mapa]) => [chave, somenteAtivos(mapa)])),
    aviso,
  };
  cacheCatalogos = { expiraEm: Date.now() + 10 * 60_000, data: resultado };
  return resultado;
  };
  catalogosEmAndamento = carregar();
  try {
    return await catalogosEmAndamento;
  } finally {
    catalogosEmAndamento = null;
  }
}

function normalizarPessoa(valor: string) {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[._-]+/g, " ").replace(/\s+/g, " ").trim().toLocaleLowerCase("pt-BR");
}

export async function buscarPessoaSultsRapida(env: SultsServerEnv, loginOuNome: string) {
  const busca = normalizarPessoa(loginOuNome);
  if (!busca) throw new ErroSults(400, "Informe o login ou nome usado no SULTS.");
  const chamados = await consultarSults({ ...env, SULTS_MAX_PAGES: "3", SULTS_REQUEST_DELAY_MS: "100" }, {}, true);
  const pessoas = new Map<number, string>();
  chamados.forEach((registro) => {
    const chamado = registro as { solicitante?: { id?: number; nome?: string }; responsavel?: { id?: number; nome?: string }; apoio?: Array<{ pessoa?: { id?: number; nome?: string } }> };
    [chamado.solicitante, chamado.responsavel, ...(chamado.apoio?.map((item) => item.pessoa) ?? [])].forEach((pessoa) => {
      if (pessoa?.id && pessoa.nome) pessoas.set(pessoa.id, pessoa.nome);
    });
  });
  const candidatos = [...pessoas].map(([id, nome]) => ({ id, nome }));
  const exata = candidatos.find((pessoa) => normalizarPessoa(pessoa.nome) === busca);
  if (exata) return exata;
  const parciais = candidatos.filter((pessoa) => normalizarPessoa(pessoa.nome).includes(busca));
  if (parciais.length === 1) return parciais[0];
  if (parciais.length > 1) throw new ErroSults(409, `Mais de uma pessoa encontrada: ${parciais.slice(0, 3).map((pessoa) => pessoa.nome).join(", ")}. Informe o nome completo.`);
  throw new ErroSults(404, "Pessoa não encontrada nos 300 chamados mais recentes. Informe o nome completo usado no SULTS.");
}
