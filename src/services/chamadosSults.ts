import { supabase } from "../lib/supabase";

export interface PessoaChamado {
  id: number;
  nome: string;
}

export interface ChamadoSultsAnalitico {
  id: number;
  titulo: string;
  situacao: number;
  tipo?: number;
  aberto?: string;
  concluido?: string;
  resolvido?: string;
  ultimaAlteracao?: string;
  primeiraInteracao?: string;
  countInteracaoPublico?: number;
  countInteracaoInterno?: number;
  solicitante?: PessoaChamado;
  responsavel?: PessoaChamado;
  unidade?: { id: number; nome?: string; nomeFantasia?: string };
  departamento?: { id: number; nome: string };
  departamentoEnvio?: { id: number; nome: string };
  assunto?: { id: number; nome?: string; assunto?: string };
  apoio?: Array<{ pessoa?: PessoaChamado; departamento?: { id: number; nome: string } }>;
}

export const SITUACOES: Record<number, string> = {
  1: "Novo",
  2: "Concluído",
  3: "Resolvido",
  4: "Em andamento",
  5: "Aguardando solicitante",
  6: "Aguardando responsável",
};

export function nomeAssunto(chamado: ChamadoSultsAnalitico) {
  return chamado.assunto?.nome ?? chamado.assunto?.assunto ?? "Sem assunto";
}

function normalizarDepartamento(valor: string) {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR");
}

export function ehDepartamentoTi(chamado: ChamadoSultsAnalitico) {
  const nome = normalizarDepartamento(chamado.departamento?.nome ?? "");
  return nome === "ti"
    || nome === "tecnologia da informacao"
    || nome === "tecnologia de informacao";
}

export interface ResultadoChamadosSults {
  data: ChamadoSultsAnalitico[];
  cache: boolean;
  stale?: boolean;
  aviso?: string;
}

export interface OpcoesConsultaChamados {
  refresh?: boolean;
  inicio?: string;
  fim?: string;
}

const requisicoesEmAndamento = new Map<string, Promise<ResultadoChamadosSults>>();

function dataSults(valor: string, fimDoDia = false) {
  // A API exige ISO 8601 UTC no formato exato "YYYY-MM-DDTHH:mm:ssZ".
  // O Date converte os limites do dia local para UTC; a substituição remove
  // os milissegundos, que não são aceitos pelo filtro da SULTS.
  return new Date(`${valor}T${fimDoDia ? "23:59:59" : "00:00:00"}`)
    .toISOString()
    .replace(/\.\d{3}Z$/, "Z");
}

async function executarConsulta(opcoes: OpcoesConsultaChamados): Promise<ResultadoChamadosSults> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Usuário não autenticado.");
  const parametros = new URLSearchParams();
  if (opcoes.refresh) parametros.set("refresh", "true");
  if (opcoes.inicio) parametros.set("abertoStart", dataSults(opcoes.inicio));
  if (opcoes.fim) parametros.set("abertoEnd", dataSults(opcoes.fim, true));
  const url = `/api/sults/tickets${parametros.size ? `?${parametros}` : ""}`;
  const resposta = await fetch(url, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  const corpo = await resposta.json().catch(() => null) as { data?: ChamadoSultsAnalitico[]; cache?: boolean; stale?: boolean; aviso?: string; erro?: string } | null;
  if (!resposta.ok) throw new Error(corpo?.erro ?? `Erro HTTP ${resposta.status}`);
  return { data: corpo?.data ?? [], cache: Boolean(corpo?.cache), stale: Boolean(corpo?.stale), aviso: corpo?.aviso };
}

export async function carregarChamadosSults(opcoes: boolean | OpcoesConsultaChamados = {}): Promise<ResultadoChamadosSults> {
  const normalizadas = typeof opcoes === "boolean" ? { refresh: opcoes } : opcoes;
  const chave = JSON.stringify(normalizadas);
  if (!requisicoesEmAndamento.has(chave)) requisicoesEmAndamento.set(chave, executarConsulta(normalizadas));
  const requisicao = requisicoesEmAndamento.get(chave)!;
  try {
    return await requisicao;
  } finally {
    if (requisicoesEmAndamento.get(chave) === requisicao) requisicoesEmAndamento.delete(chave);
  }
}

export async function buscarPessoaSultsServidor(loginOuNome: string) {
  if (!loginOuNome.trim()) throw new Error("Informe o login ou nome usado no SULTS.");
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Usuário não autenticado.");
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 15_000);
  try {
    const resposta = await fetch(`/api/sults/person?q=${encodeURIComponent(loginOuNome.trim())}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      signal: controller.signal,
    });
    const corpo = await resposta.json().catch(() => null) as (PessoaChamado & { erro?: string }) | null;
    if (!resposta.ok) throw new Error(corpo?.erro ?? `Erro HTTP ${resposta.status}`);
    if (!corpo?.id || !corpo.nome) throw new Error("A SULTS retornou uma resposta inválida.");
    return corpo;
  } catch (erro) {
    if (erro instanceof DOMException && erro.name === "AbortError") throw new Error("A consulta excedeu 15 segundos. Tente novamente.", { cause: erro });
    throw erro;
  } finally {
    window.clearTimeout(timer);
  }
}

export async function listarChamadosNovosServidor(responsavelId?: number | null) {
  const { data } = await carregarChamadosSults(true);
  return data.filter((chamado) => chamado.situacao === 1 && (!responsavelId || chamado.responsavel?.id === responsavelId));
}
