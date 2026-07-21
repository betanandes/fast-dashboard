import { supabase } from "../lib/supabase";
import type { ConfiguracaoPlantao, PlantaoTI } from "../types/database";

export const CONFIG_PLANTAO_PADRAO: ConfiguracaoPlantao = {
  id: 1,
  email_destino: "",
  dia_envio: 5,
  hora_envio: "09:00",
  ativo: false,
  updated_at: "",
  updated_by: null,
};

export async function carregarConfiguracaoPlantao(): Promise<ConfiguracaoPlantao> {
  const { data, error } = await supabase
    .from("configuracoes_plantao")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return data ?? CONFIG_PLANTAO_PADRAO;
}

export async function salvarConfiguracaoPlantao(
  config: Pick<ConfiguracaoPlantao, "email_destino" | "dia_envio" | "hora_envio" | "ativo">,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const payload = {
    id: 1,
    ...config,
    updated_by: user?.id ?? null,
  };
  const { error } = await supabase
    .from("configuracoes_plantao")
    .upsert(payload as never);
  if (error) throw error;
}

export async function listarPlantoes(): Promise<PlantaoTI[]> {
  const { data, error } = await supabase
    .from("plantoes_ti")
    .select("*")
    .order("data", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function salvarPlantao(
  plantao: Pick<PlantaoTI, "data" | "colaborador_nome" | "colaborador_email" | "telefone" | "observacao"> & { id?: string },
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { id, ...campos } = plantao;
  const payload = { ...campos, created_by: user?.id ?? null };
  const query = id && !id.startsWith("demo-")
    ? supabase.from("plantoes_ti").update(payload as never).eq("id", id)
    : supabase.from("plantoes_ti").upsert(payload as never, { onConflict: "data" });
  const { error } = await query;
  if (error) throw error;
}

export async function materializarPlantoes(plantoes: PlantaoTI[]) {
  const existentes = await listarPlantoes();
  if (existentes.length) return existentes;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const payload = plantoes.map((item) => ({
    data: item.data,
    colaborador_nome: item.colaborador_nome,
    colaborador_email: item.colaborador_email,
    telefone: item.telefone,
    observacao: item.observacao,
    created_by: user?.id ?? null,
  }));
  const { error } = await supabase.from("plantoes_ti").upsert(payload as never, { onConflict: "data" });
  if (error) throw error;
  return listarPlantoes();
}

export async function excluirPlantao(id: string) {
  const { error } = await supabase.from("plantoes_ti").delete().eq("id", id);
  if (error) throw error;
}
