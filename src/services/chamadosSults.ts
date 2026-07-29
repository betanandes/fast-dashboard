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
  ultimaAlteracao?: string;
  primeiraInteracao?: string;
  countInteracaoPublico?: number;
  countInteracaoInterno?: number;
  solicitante?: PessoaChamado;
  responsavel?: PessoaChamado;
  unidade?: { id: number; nome?: string; nomeFantasia?: string };
  departamento?: { id: number; nome: string };
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

function normalizar(valor: string) {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR");
}

function pessoasDoChamado(chamado: ChamadoSultsAnalitico) {
  return [chamado.solicitante, chamado.responsavel, ...(chamado.apoio?.map((item) => item.pessoa) ?? [])]
    .filter((pessoa): pessoa is PessoaChamado => Boolean(pessoa?.id && pessoa.nome));
}

export async function buscarPessoaSultsServidor(loginOuNome: string) {
  const busca = normalizar(loginOuNome);
  if (!busca) throw new Error("Informe o login ou nome usado no SULTS.");
  const { data } = await carregarChamadosSults();
  const pessoas = new Map<number, PessoaChamado>();
  data.forEach((chamado) => pessoasDoChamado(chamado).forEach((pessoa) => pessoas.set(pessoa.id, pessoa)));
  const candidatos = [...pessoas.values()];
  const exato = candidatos.find((pessoa) => normalizar(pessoa.nome) === busca);
  if (exato) return exato;
  const parciais = candidatos.filter((pessoa) => normalizar(pessoa.nome).includes(busca));
  if (parciais.length === 1) return parciais[0];
  if (parciais.length > 1) throw new Error(`Encontramos mais de uma pessoa (${parciais.slice(0, 3).map((pessoa) => pessoa.nome).join(", ")}). Informe o nome completo.`);
  throw new Error("Pessoa não encontrada nos chamados. Informe o ID manualmente ou confirme o nome exibido no SULTS.");
}

export async function listarChamadosNovosServidor(responsavelId?: number | null) {
  const { data } = await carregarChamadosSults(true);
  return data.filter((chamado) => chamado.situacao === 1 && (!responsavelId || chamado.responsavel?.id === responsavelId));
}
