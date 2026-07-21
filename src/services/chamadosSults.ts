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
