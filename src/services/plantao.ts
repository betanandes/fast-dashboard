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

let consultaConfiguracao: Promise<ConfiguracaoPlantao> | null = null;
let consultaPlantoes: Promise<PlantaoTI[]> | null = null;
const BANCO_TI_ATIVO = import.meta.env.VITE_TI_DATABASE_ENABLED === "true";
const PLANTOES_LOCAL_KEY = "fast-dashboard:plantoes-ti";
const CONFIG_LOCAL_KEY = "fast-dashboard:configuracao-plantao";

function lerPlantoesLocal(): PlantaoTI[] {
  try { return JSON.parse(localStorage.getItem(PLANTOES_LOCAL_KEY) ?? "[]") as PlantaoTI[]; } catch { return []; }
}

function gravarPlantoesLocal(plantoes: PlantaoTI[]) {
  localStorage.setItem(PLANTOES_LOCAL_KEY, JSON.stringify(plantoes));
}

export async function carregarConfiguracaoPlantao(): Promise<ConfiguracaoPlantao> {
  if (!BANCO_TI_ATIVO) {
    try { return { ...CONFIG_PLANTAO_PADRAO, ...JSON.parse(localStorage.getItem(CONFIG_LOCAL_KEY) ?? "{}") as ConfiguracaoPlantao }; } catch { return CONFIG_PLANTAO_PADRAO; }
  }
  if (!consultaConfiguracao) consultaConfiguracao = Promise.resolve(supabase.from("configuracoes_plantao").select("*").eq("id", 1).maybeSingle().then(({ data, error }) => {
    if (error) throw error;
    return data ?? CONFIG_PLANTAO_PADRAO;
  }));
  const consulta = consultaConfiguracao;
  try {
    return await consulta;
  } finally {
    if (consultaConfiguracao === consulta) consultaConfiguracao = null;
  }
}

export async function salvarConfiguracaoPlantao(
  config: Pick<ConfiguracaoPlantao, "email_destino" | "dia_envio" | "hora_envio" | "ativo">,
) {
  if (!BANCO_TI_ATIVO) {
    localStorage.setItem(CONFIG_LOCAL_KEY, JSON.stringify({ ...CONFIG_PLANTAO_PADRAO, ...config, updated_at: new Date().toISOString() }));
    return;
  }
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
  if (!BANCO_TI_ATIVO) return lerPlantoesLocal();
  if (!consultaPlantoes) consultaPlantoes = Promise.resolve(supabase.from("plantoes_ti").select("*").order("data", { ascending: true }).then(({ data, error }) => {
    if (error) throw error;
    return data ?? [];
  }));
  const consulta = consultaPlantoes;
  try {
    return await consulta;
  } finally {
    if (consultaPlantoes === consulta) consultaPlantoes = null;
  }
}

export async function salvarPlantao(
  plantao: Pick<PlantaoTI, "data" | "colaborador_nome" | "colaborador_email" | "telefone" | "observacao"> & { id?: string },
) {
  if (!BANCO_TI_ATIVO) {
    const registros = lerPlantoesLocal();
    const indice = plantao.id ? registros.findIndex((item) => item.id === plantao.id) : registros.findIndex((item) => item.data === plantao.data);
    const salvo: PlantaoTI = { ...plantao, id: indice >= 0 ? registros[indice].id : `local-${crypto.randomUUID()}`, created_at: indice >= 0 ? registros[indice].created_at : new Date().toISOString(), created_by: null };
    gravarPlantoesLocal(indice >= 0 ? registros.map((item, posicao) => posicao === indice ? salvo : item) : [...registros, salvo].sort((a, b) => a.data.localeCompare(b.data)));
    return;
  }
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
  if (!BANCO_TI_ATIVO) {
    const existentes = lerPlantoesLocal();
    if (existentes.length) return existentes;
    const locais = plantoes.map((item) => ({ ...item, id: `local-${crypto.randomUUID()}` }));
    gravarPlantoesLocal(locais);
    return locais;
  }
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
  if (!BANCO_TI_ATIVO) {
    gravarPlantoesLocal(lerPlantoesLocal().filter((item) => item.id !== id));
    return;
  }
  const { error } = await supabase.from("plantoes_ti").delete().eq("id", id);
  if (error) throw error;
}
