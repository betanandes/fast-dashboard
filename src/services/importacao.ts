import { supabase } from "../lib/supabase";

export interface ResumoPreview {
  meses: string[];
  total_valor: number;
  vencidos: number;
  a_vencer: number;
}

export interface AmostraPagamento {
  mes_referencia: string;
  fornecedor: string;
  valor: number;
  data_vencimento: string | null;
  status: string;
  categoria: string;
}

export interface ResultadoPreview {
  preview: true;
  total_lido: number;
  total_valido: number;
  total_erros: number;
  erros: string[];
  amostra: AmostraPagamento[];
  resumo: ResumoPreview;
}

export interface ResultadoImportacao {
  sucesso: true;
  importacao_id: string;
  total_lido: number;
  total_inserido: number;
  total_erros: number;
  erros: string[];
}

function edgeFunctionUrl(nome: string): string {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return `${url}/functions/v1/${nome}`;
}

async function getAuthHeader(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Usuário não autenticado");
  return `Bearer ${session.access_token}`;
}

export async function previewExcel(arquivo: File): Promise<ResultadoPreview> {
  const form = new FormData();
  form.append("arquivo", arquivo);
  form.append("preview", "true");

  const res = await fetch(edgeFunctionUrl("importar-excel"), {
    method: "POST",
    headers: { Authorization: await getAuthHeader() },
    body: form,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.erro ?? "Erro ao fazer preview");
  return data as ResultadoPreview;
}

export async function confirmarImportacao(
  arquivo: File,
): Promise<ResultadoImportacao> {
  const form = new FormData();
  form.append("arquivo", arquivo);
  form.append("preview", "false");

  const res = await fetch(edgeFunctionUrl("importar-excel"), {
    method: "POST",
    headers: { Authorization: await getAuthHeader() },
    body: form,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.erro ?? "Erro ao importar");
  return data as ResultadoImportacao;
}

export async function listarImportacoes() {
  const { data, error } = await supabase
    .from("importacoes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data;
}
