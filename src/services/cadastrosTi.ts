import { supabase } from "../lib/supabase";
import { LICENCAS, MAQUINAS, PROVEDORES, SOFTWARES, type LicencaTI, type MaquinaTI, type ProvedorTI, type SoftwareTI } from "../data/tiData";

export type LicencaRegistro = LicencaTI & { id: string };
export type SoftwareRegistro = SoftwareTI & { id: string };
export type MaquinaRegistro = MaquinaTI & { id: string };
export type ProvedorRegistro = ProvedorTI & { id: string };

const demoLicencas = () => LICENCAS.map((item, index) => ({ ...item, id: `demo-licenca-${index}` }));
const demoSoftwares = () => SOFTWARES.map((item, index) => ({ ...item, id: `demo-software-${index}` }));
const demoMaquinas = () => MAQUINAS.map((item, index) => ({ ...item, id: `demo-maquina-${index}` }));
const demoProvedores = () => PROVEDORES.map((item, index) => ({ ...item, id: `demo-provedor-${index}` }));

function licencaPayload(item: LicencaTI) { return { colaborador: item.colaborador, departamento: item.departamento, codigo_sap: item.codigoSap, app_control: item.appControl, perfil: item.perfil, crm: item.crm, logistica: item.logistica, financeiro: item.financeiro, status: item.status }; }
function softwarePayload(item: SoftwareTI) { return { nome: item.nome, aplicacao: item.aplicacao, acesso: item.acesso, valor_mensal: item.valorMensal, valor_anual: item.valorAnual, satisfaz: item.satisfaz, link: item.link, responsavel: item.responsavel }; }
function maquinaPayload(item: MaquinaTI) { return { maquina: item.maquina, serie: item.serie, modelo: item.modelo, unidade: item.unidade, contato: item.contato, cnpj: item.cnpj, cidade: item.cidade, ip: item.ip, status: item.status, observacao: item.observacao }; }
function provedorPayload(item: ProvedorTI) { return { loja: item.loja, cidade: item.cidade, uf: item.uf, provedor_principal: item.provedorPrincipal, provedor_backup: item.provedorBackup, velocidade: item.velocidade, tecnologia: item.tecnologia, status: item.status, telefone_suporte: item.telefoneSuporte, vencimento_contrato: item.vencimentoContrato }; }

function mapLicenca(row: Record<string, unknown>): LicencaRegistro { return { id: String(row.id), colaborador: String(row.colaborador), departamento: String(row.departamento), codigoSap: String(row.codigo_sap), appControl: String(row.app_control), perfil: row.perfil as LicencaTI["perfil"], crm: Boolean(row.crm), logistica: Boolean(row.logistica), financeiro: Boolean(row.financeiro), status: row.status as LicencaTI["status"] }; }
function mapSoftware(row: Record<string, unknown>): SoftwareRegistro { return { id: String(row.id), nome: String(row.nome), aplicacao: String(row.aplicacao), acesso: String(row.acesso), valorMensal: Number(row.valor_mensal), valorAnual: Number(row.valor_anual), satisfaz: row.satisfaz as SoftwareTI["satisfaz"], link: String(row.link), responsavel: String(row.responsavel) }; }
function mapMaquina(row: Record<string, unknown>): MaquinaRegistro { return { id: String(row.id), maquina: String(row.maquina), serie: String(row.serie), modelo: String(row.modelo), unidade: String(row.unidade), contato: String(row.contato), cnpj: String(row.cnpj), cidade: String(row.cidade), ip: String(row.ip), status: row.status as MaquinaTI["status"], observacao: String(row.observacao ?? "") }; }
function mapProvedor(row: Record<string, unknown>): ProvedorRegistro { return { id: String(row.id), loja: String(row.loja), cidade: String(row.cidade), uf: String(row.uf), provedorPrincipal: String(row.provedor_principal), provedorBackup: String(row.provedor_backup), velocidade: String(row.velocidade), tecnologia: row.tecnologia as ProvedorTI["tecnologia"], status: row.status as ProvedorTI["status"], telefoneSuporte: String(row.telefone_suporte), vencimentoContrato: String(row.vencimento_contrato) }; }

async function selecionar(tabela: "licencas_ti" | "softwares_ti" | "maquinas_ti" | "provedores_ti") {
  const { data, error } = await supabase.from(tabela).select("*").order("created_at");
  if (error) throw error;
  return (data ?? []) as unknown as Record<string, unknown>[];
}

export async function listarLicencas() { const rows = await selecionar("licencas_ti"); return rows.length ? rows.map(mapLicenca) : demoLicencas(); }
export async function listarSoftwares() { const rows = await selecionar("softwares_ti"); return rows.length ? rows.map(mapSoftware) : demoSoftwares(); }
export async function listarMaquinas() { const rows = await selecionar("maquinas_ti"); return rows.length ? rows.map(mapMaquina) : demoMaquinas(); }
export async function listarProvedores() { const rows = await selecionar("provedores_ti"); return rows.length ? rows.map(mapProvedor) : demoProvedores(); }

function indiceDemo(id: string) {
  if (!id.startsWith("demo-")) return null;
  const valor = Number(id.split("-").at(-1));
  return Number.isInteger(valor) ? valor : null;
}

async function prepararLicencas() { let rows = await selecionar("licencas_ti"); if (!rows.length) { const { data, error } = await supabase.from("licencas_ti").insert(LICENCAS.map(licencaPayload) as never).select("*"); if (error) throw error; rows = (data ?? []) as unknown as Record<string, unknown>[]; } return rows.map(mapLicenca); }
async function prepararSoftwares() { let rows = await selecionar("softwares_ti"); if (!rows.length) { const { data, error } = await supabase.from("softwares_ti").insert(SOFTWARES.map(softwarePayload) as never).select("*"); if (error) throw error; rows = (data ?? []) as unknown as Record<string, unknown>[]; } return rows.map(mapSoftware); }
async function prepararMaquinas() { let rows = await selecionar("maquinas_ti"); if (!rows.length) { const { data, error } = await supabase.from("maquinas_ti").insert(MAQUINAS.map(maquinaPayload) as never).select("*"); if (error) throw error; rows = (data ?? []) as unknown as Record<string, unknown>[]; } return rows.map(mapMaquina); }
async function prepararProvedores() { let rows = await selecionar("provedores_ti"); if (!rows.length) { const { data, error } = await supabase.from("provedores_ti").insert(PROVEDORES.map(provedorPayload) as never).select("*"); if (error) throw error; rows = (data ?? []) as unknown as Record<string, unknown>[]; } return rows.map(mapProvedor); }

export async function salvarLicenca(item: LicencaRegistro) { const base = await prepararLicencas(); const indice = indiceDemo(item.id); const id = indice === null ? item.id : base.find((registro) => registro.appControl === LICENCAS[indice]?.appControl)?.id; const query = id ? supabase.from("licencas_ti").update(licencaPayload(item) as never).eq("id", id) : supabase.from("licencas_ti").insert(licencaPayload(item) as never); const { error } = await query; if (error) throw error; return listarLicencas(); }
export async function salvarSoftware(item: SoftwareRegistro) { const base = await prepararSoftwares(); const indice = indiceDemo(item.id); const id = indice === null ? item.id : base.find((registro) => registro.nome === SOFTWARES[indice]?.nome)?.id; const query = id ? supabase.from("softwares_ti").update(softwarePayload(item) as never).eq("id", id) : supabase.from("softwares_ti").insert(softwarePayload(item) as never); const { error } = await query; if (error) throw error; return listarSoftwares(); }
export async function salvarMaquina(item: MaquinaRegistro) { const base = await prepararMaquinas(); const indice = indiceDemo(item.id); const id = indice === null ? item.id : base.find((registro) => registro.serie === MAQUINAS[indice]?.serie)?.id; const query = id ? supabase.from("maquinas_ti").update(maquinaPayload(item) as never).eq("id", id) : supabase.from("maquinas_ti").insert(maquinaPayload(item) as never); const { error } = await query; if (error) throw error; return listarMaquinas(); }
export async function salvarProvedor(item: ProvedorRegistro) { const base = await prepararProvedores(); const indice = indiceDemo(item.id); const id = indice === null ? item.id : base.find((registro) => registro.loja === PROVEDORES[indice]?.loja)?.id; const query = id ? supabase.from("provedores_ti").update(provedorPayload(item) as never).eq("id", id) : supabase.from("provedores_ti").insert(provedorPayload(item) as never); const { error } = await query; if (error) throw error; return listarProvedores(); }

export async function excluirLicenca(item: LicencaRegistro) { const base = await prepararLicencas(); const id = item.id.startsWith("demo-") ? base.find((registro) => registro.appControl === item.appControl)?.id : item.id; if (!id) throw new Error("Registro não encontrado."); const { error } = await supabase.from("licencas_ti").delete().eq("id", id); if (error) throw error; return listarLicencas(); }
export async function excluirSoftware(item: SoftwareRegistro) { const base = await prepararSoftwares(); const id = item.id.startsWith("demo-") ? base.find((registro) => registro.nome === item.nome)?.id : item.id; if (!id) throw new Error("Registro não encontrado."); const { error } = await supabase.from("softwares_ti").delete().eq("id", id); if (error) throw error; return listarSoftwares(); }
export async function excluirMaquina(item: MaquinaRegistro) { const base = await prepararMaquinas(); const id = item.id.startsWith("demo-") ? base.find((registro) => registro.serie === item.serie)?.id : item.id; if (!id) throw new Error("Registro não encontrado."); const { error } = await supabase.from("maquinas_ti").delete().eq("id", id); if (error) throw error; return listarMaquinas(); }
export async function excluirProvedor(item: ProvedorRegistro) { const base = await prepararProvedores(); const id = item.id.startsWith("demo-") ? base.find((registro) => registro.loja === item.loja)?.id : item.id; if (!id) throw new Error("Registro não encontrado."); const { error } = await supabase.from("provedores_ti").delete().eq("id", id); if (error) throw error; return listarProvedores(); }
