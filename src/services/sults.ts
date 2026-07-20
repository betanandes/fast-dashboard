const SULTS_API_URL = "https://api.sults.com.br/api/v1/chamado/ticket";

export interface PessoaSults {
  id: number;
  nome: string;
}

interface ApoioSults {
  pessoa?: PessoaSults;
}

export interface ChamadoSults {
  id: number;
  titulo: string;
  situacao: number;
  solicitante?: PessoaSults;
  responsavel?: PessoaSults;
  apoio?: ApoioSults[];
}

interface PaginaChamados {
  data: ChamadoSults[];
  totalPage?: number;
}

export interface ConfiguracaoSults {
  login: string;
  pessoaId: number | null;
  pessoaNome: string;
  mensagemPadrao: string;
}

export interface CriarChamadoPayload {
  titulo: string;
  mensagem: string;
  tipo: 1 | 2 | 3;
  solicitanteId: number;
  responsavelId?: number;
  unidadeId?: number;
  departamentoId?: number;
  departamentoEnvioId?: number;
  assuntoId?: number;
  dtPrazo?: string;
}

const STORAGE_KEY = "fast-dashboard:sults-config";

function headers(token: string) {
  return {
    Authorization: token.trim(),
    "Content-Type": "application/json;charset=UTF-8",
  };
}

async function lerResposta<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => null)) as T | null;
  if (!res.ok) {
    const detalhe =
      data && typeof data === "object" && "message" in data
        ? String(data.message)
        : `HTTP ${res.status}`;
    throw new Error(`A SULTS recusou a requisição (${detalhe}).`);
  }
  if (!data) throw new Error("A SULTS retornou uma resposta vazia.");
  return data;
}

export async function testarConexaoSults(token: string): Promise<number> {
  const url = new URL(SULTS_API_URL);
  url.searchParams.set("start", "0");
  url.searchParams.set("limit", "1");
  const res = await fetch(url, { headers: headers(token) });
  const pagina = await lerResposta<PaginaChamados>(res);
  return pagina.data?.length ?? 0;
}

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function pessoasDoChamado(chamado: ChamadoSults): PessoaSults[] {
  return [
    chamado.solicitante,
    chamado.responsavel,
    ...(chamado.apoio?.map((item) => item.pessoa) ?? []),
  ].filter((pessoa): pessoa is PessoaSults => Boolean(pessoa?.id && pessoa.nome));
}

export async function buscarPessoaSults(
  token: string,
  loginOuNome: string,
): Promise<PessoaSults> {
  const busca = normalizar(loginOuNome);
  if (!busca) throw new Error("Informe o login ou nome usado no SULTS.");

  const pessoas = new Map<number, PessoaSults>();
  let totalPaginas = 1;

  // A API pública não expõe um catálogo de usuários. Percorremos os chamados
  // recentes e deduplicamos solicitantes, responsáveis e pessoas de apoio.
  for (let pagina = 0; pagina < Math.min(totalPaginas, 5); pagina += 1) {
    const url = new URL(SULTS_API_URL);
    url.searchParams.set("start", String(pagina));
    url.searchParams.set("limit", "100");
    const res = await fetch(url, { headers: headers(token) });
    const resultado = await lerResposta<PaginaChamados>(res);
    totalPaginas = Math.max(1, resultado.totalPage ?? 1);
    resultado.data?.forEach((chamado) => {
      pessoasDoChamado(chamado).forEach((pessoa) => pessoas.set(pessoa.id, pessoa));
    });
  }

  const candidatos = [...pessoas.values()];
  const exato = candidatos.find((pessoa) => normalizar(pessoa.nome) === busca);
  if (exato) return exato;

  const parciais = candidatos.filter((pessoa) => normalizar(pessoa.nome).includes(busca));
  if (parciais.length === 1) return parciais[0];
  if (parciais.length > 1) {
    throw new Error(
      `Encontramos mais de uma pessoa (${parciais.slice(0, 3).map((p) => p.nome).join(", ")}). Informe o nome completo.`,
    );
  }

  throw new Error(
    "Pessoa não encontrada nos chamados recentes. Informe o ID manualmente ou confirme o nome exibido no SULTS.",
  );
}

export async function listarChamadosNovos(
  token: string,
  responsavelId?: number | null,
): Promise<ChamadoSults[]> {
  const url = new URL(SULTS_API_URL);
  url.searchParams.set("start", "0");
  url.searchParams.set("limit", "100");
  url.searchParams.set("situacao", "1");
  if (responsavelId) url.searchParams.set("responsavel", String(responsavelId));
  const res = await fetch(url, { headers: headers(token) });
  const pagina = await lerResposta<PaginaChamados>(res);
  return pagina.data ?? [];
}

export async function criarChamadoSults(
  token: string,
  payload: CriarChamadoPayload,
): Promise<{ id: number }> {
  const res = await fetch(SULTS_API_URL, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(payload),
  });
  return lerResposta<{ id: number }>(res);
}

export function carregarConfiguracaoSults(): ConfiguracaoSults {
  const fallback: ConfiguracaoSults = {
    login: "",
    pessoaId: null,
    pessoaNome: "",
    mensagemPadrao:
      "Olá! Recebemos o seu chamado e já iniciamos a análise. Em breve retornaremos com uma atualização.",
  };
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    return salvo ? { ...fallback, ...JSON.parse(salvo) } : fallback;
  } catch {
    return fallback;
  }
}

export function salvarConfiguracaoSults(config: ConfiguracaoSults) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
