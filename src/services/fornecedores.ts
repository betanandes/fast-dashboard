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

export async function listarFornecedores() {
  const { data, error } = await supabase.from("fornecedores").select("*").order("nome_fantasia");
  if (error) throw error;
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
