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

export async function carregarChamadosSults(refresh = false): Promise<{ data: ChamadoSultsAnalitico[]; cache: boolean }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Usuário não autenticado.");
  const resposta = await fetch(`/api/sults/tickets${refresh ? "?refresh=true" : ""}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  const corpo = await resposta.json().catch(() => null) as { data?: ChamadoSultsAnalitico[]; cache?: boolean; erro?: string } | null;
  if (!resposta.ok) throw new Error(corpo?.erro ?? `Erro HTTP ${resposta.status}`);
  return { data: corpo?.data ?? [], cache: Boolean(corpo?.cache) };
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
