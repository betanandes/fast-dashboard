import { supabase } from "../lib/supabase";
import { LICENCAS, MAQUINAS, SOFTWARES, type LicencaTI, type MaquinaTI, type SoftwareTI } from "../data/tiData";

export type LicencaRegistro = LicencaTI & { id: string };
export type SoftwareRegistro = SoftwareTI & { id: string };
export type MaquinaRegistro = MaquinaTI & { id: string };

const demoLicencas = () => LICENCAS.map((item, index) => ({ ...item, id: `demo-licenca-${index}` }));
const demoSoftwares = () => SOFTWARES.map((item, index) => ({ ...item, id: `demo-software-${index}` }));
const demoMaquinas = () => MAQUINAS.map((item, index) => ({ ...item, id: `demo-maquina-${index}` }));

function licencaPayload(item: LicencaTI) { return { colaborador: item.colaborador, departamento: item.departamento, codigo_sap: item.codigoSap, app_control: item.appControl, perfil: item.perfil, crm: item.crm, logistica: item.logistica, financeiro: item.financeiro, status: item.status }; }
function softwarePayload(item: SoftwareTI) { return { nome: item.nome, aplicacao: item.aplicacao, acesso: item.acesso, valor_mensal: item.valorMensal, valor_anual: item.valorAnual, satisfaz: item.satisfaz, link: item.link, responsavel: item.responsavel }; }
function maquinaPayload(item: MaquinaTI) { return { maquina: item.maquina, serie: item.serie, modelo: item.modelo, unidade: item.unidade, contato: item.contato, cnpj: item.cnpj, cidade: item.cidade, ip: item.ip, status: item.status, observacao: item.observacao }; }

function mapLicenca(row: Record<string, unknown>): LicencaRegistro { return { id: String(row.id), colaborador: String(row.colaborador), departamento: String(row.departamento), codigoSap: String(row.codigo_sap), appControl: String(row.app_control), perfil: row.perfil as LicencaTI["perfil"], crm: Boolean(row.crm), logistica: Boolean(row.logistica), financeiro: Boolean(row.financeiro), status: row.status as LicencaTI["status"] }; }
function mapSoftware(row: Record<string, unknown>): SoftwareRegistro { return { id: String(row.id), nome: String(row.nome), aplicacao: String(row.aplicacao), acesso: String(row.acesso), valorMensal: Number(row.valor_mensal), valorAnual: Number(row.valor_anual), satisfaz: row.satisfaz as SoftwareTI["satisfaz"], link: String(row.link), responsavel: String(row.responsavel) }; }
function mapMaquina(row: Record<string, unknown>): MaquinaRegistro { return { id: String(row.id), maquina: String(row.maquina), serie: String(row.serie), modelo: String(row.modelo), unidade: String(row.unidade), contato: String(row.contato), cnpj: String(row.cnpj), cidade: String(row.cidade), ip: String(row.ip), status: row.status as MaquinaTI["status"], observacao: String(row.observacao ?? "") }; }

async function selecionar(tabela: "licencas_ti" | "softwares_ti" | "maquinas_ti") {
  const { data, error } = await supabase.from(tabela).select("*").order("created_at");
  if (error) throw error;
  return (data ?? []) as unknown as Record<string, unknown>[];
}

export async function listarLicencas() { const rows = await selecionar("licencas_ti"); return rows.length ? rows.map(mapLicenca) : demoLicencas(); }
export async function listarSoftwares() { const rows = await selecionar("softwares_ti"); return rows.length ? rows.map(mapSoftware) : demoSoftwares(); }
export async function listarMaquinas() { const rows = await selecionar("maquinas_ti"); return rows.length ? rows.map(mapMaquina) : demoMaquinas(); }

function indiceDemo(id: string) {
  if (!id.startsWith("demo-")) return null;
  const valor = Number(id.split("-").at(-1));
  return Number.isInteger(valor) ? valor : null;
}

async function prepararLicencas() { let rows = await selecionar("licencas_ti"); if (!rows.length) { const { data, error } = await supabase.from("licencas_ti").insert(LICENCAS.map(licencaPayload) as never).select("*"); if (error) throw error; rows = (data ?? []) as unknown as Record<string, unknown>[]; } return rows.map(mapLicenca); }
async function prepararSoftwares() { let rows = await selecionar("softwares_ti"); if (!rows.length) { const { data, error } = await supabase.from("softwares_ti").insert(SOFTWARES.map(softwarePayload) as never).select("*"); if (error) throw error; rows = (data ?? []) as unknown as Record<string, unknown>[]; } return rows.map(mapSoftware); }
async function prepararMaquinas() { let rows = await selecionar("maquinas_ti"); if (!rows.length) { const { data, error } = await supabase.from("maquinas_ti").insert(MAQUINAS.map(maquinaPayload) as never).select("*"); if (error) throw error; rows = (data ?? []) as unknown as Record<string, unknown>[]; } return rows.map(mapMaquina); }

export async function salvarLicenca(item: LicencaRegistro) { const base = await prepararLicencas(); const indice = indiceDemo(item.id); const id = indice === null ? item.id : base.find((registro) => registro.appControl === LICENCAS[indice]?.appControl)?.id; const query = id ? supabase.from("licencas_ti").update(licencaPayload(item) as never).eq("id", id) : supabase.from("licencas_ti").insert(licencaPayload(item) as never); const { error } = await query; if (error) throw error; return listarLicencas(); }
export async function salvarSoftware(item: SoftwareRegistro) { const base = await prepararSoftwares(); const indice = indiceDemo(item.id); const id = indice === null ? item.id : base.find((registro) => registro.nome === SOFTWARES[indice]?.nome)?.id; const query = id ? supabase.from("softwares_ti").update(softwarePayload(item) as never).eq("id", id) : supabase.from("softwares_ti").insert(softwarePayload(item) as never); const { error } = await query; if (error) throw error; return listarSoftwares(); }
export async function salvarMaquina(item: MaquinaRegistro) { const base = await prepararMaquinas(); const indice = indiceDemo(item.id); const id = indice === null ? item.id : base.find((registro) => registro.serie === MAQUINAS[indice]?.serie)?.id; const query = id ? supabase.from("maquinas_ti").update(maquinaPayload(item) as never).eq("id", id) : supabase.from("maquinas_ti").insert(maquinaPayload(item) as never); const { error } = await query; if (error) throw error; return listarMaquinas(); }

export async function excluirLicenca(item: LicencaRegistro) { const base = await prepararLicencas(); const id = item.id.startsWith("demo-") ? base.find((registro) => registro.appControl === item.appControl)?.id : item.id; if (!id) throw new Error("Registro não encontrado."); const { error } = await supabase.from("licencas_ti").delete().eq("id", id); if (error) throw error; return listarLicencas(); }
export async function excluirSoftware(item: SoftwareRegistro) { const base = await prepararSoftwares(); const id = item.id.startsWith("demo-") ? base.find((registro) => registro.nome === item.nome)?.id : item.id; if (!id) throw new Error("Registro não encontrado."); const { error } = await supabase.from("softwares_ti").delete().eq("id", id); if (error) throw error; return listarSoftwares(); }
export async function excluirMaquina(item: MaquinaRegistro) { const base = await prepararMaquinas(); const id = item.id.startsWith("demo-") ? base.find((registro) => registro.serie === item.serie)?.id : item.id; if (!id) throw new Error("Registro não encontrado."); const { error } = await supabase.from("maquinas_ti").delete().eq("id", id); if (error) throw error; return listarMaquinas(); }
