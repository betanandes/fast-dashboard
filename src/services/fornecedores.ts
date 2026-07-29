import { supabase } from "../lib/supabase";

export interface Fornecedor {
  id: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  contato: string | null;
  site: string | null;
  observacao: string | null;
  ativo: boolean;
}

let tabelaIndisponivel = false;
const mensagemTabela = "A tabela public.fornecedores ainda não existe no Supabase. Execute a migration 20260728_telas_ti_fornecedores.sql no SQL Editor.";

export async function listarFornecedores() {
  if (tabelaIndisponivel) throw new Error(mensagemTabela);
  const { data, error } = await supabase.from("fornecedores").select("*").order("nome_fantasia");
  if (error) {
    if ((error as { code?: string }).code === "PGRST205" || error.message.includes("schema cache")) {
      tabelaIndisponivel = true;
      throw new Error(mensagemTabela);
    }
    throw error;
  }
  return (data ?? []) as Fornecedor[];
}

export async function salvarFornecedor(item: Omit<Fornecedor, "id"> & { id?: string }) {
  const payload = { ...item, updated_at: new Date().toISOString() };
  const query = item.id
    ? supabase.from("fornecedores").update(payload as never).eq("id", item.id)
    : supabase.from("fornecedores").insert(payload as never);
  const { error } = await query;
  if (error) throw error;
}

export async function excluirFornecedor(id: string) {
  const { error } = await supabase.from("fornecedores").delete().eq("id", id);
  if (error) throw error;
}
