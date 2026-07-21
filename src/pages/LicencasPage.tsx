import { useState } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BadgeCheck, CircleDollarSign, Search, ShieldCheck, UsersRound, X } from "lucide-react";
import DataLayoutSwitcher from "../components/ui/DataLayoutSwitcher";
import { useDataLayout } from "../hooks/useDataLayout";
import { LICENCAS, type LicencaTI } from "../data/tiData";
import { useThemeContext } from "../hooks/ThemeContext";

const DEPARTAMENTOS = [...new Set(LICENCAS.map((item) => item.departamento))].sort();
const CORES = ["#C41E23", "#2563eb", "#16a34a"];

function Status({ valor }: { valor: LicencaTI["status"] }) {
  return <span className={`badge ${valor === "Ativo" ? "badge-ok" : valor === "Pendente" ? "badge-warn" : "badge-danger"}`}>{valor}</span>;
}

function Tabela({ dados }: { dados: LicencaTI[] }) {
  return <section className="card overflow-hidden"><div className="flex items-center justify-between border-b border-gray-100 px-5 py-4"><h2 className="text-sm font-semibold text-gray-900">Colaboradores</h2><span className="text-xs text-gray-400">{dados.length} resultado(s)</span></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead className="bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3">Colaborador</th><th className="px-4 py-3">Departamento</th><th className="px-4 py-3">Cód. SAP</th><th className="px-4 py-3">AppControl</th><th className="px-4 py-3">Perfil</th><th className="px-4 py-3 text-center">CRM</th><th className="px-4 py-3 text-center">Logística</th><th className="px-4 py-3 text-center">Financeiro</th><th className="px-4 py-3">Status</th></tr></thead><tbody>{dados.map((item) => <tr key={item.appControl} className="border-t border-gray-100 text-xs hover:bg-gray-50"><td className="px-5 py-3 font-medium text-gray-900">{item.colaborador}</td><td className="px-4 py-3 text-gray-600">{item.departamento}</td><td className="px-4 py-3 font-mono text-gray-500">{item.codigoSap}</td><td className="px-4 py-3 font-mono text-gray-500">{item.appControl}</td><td className="px-4 py-3 text-gray-600">{item.perfil}</td>{[item.crm, item.logistica, item.financeiro].map((ativo, index) => <td key={index} className="px-4 py-3 text-center"><span className={ativo ? "text-green-500" : "text-gray-400"}>{ativo ? "✓" : "—"}</span></td>)}<td className="px-4 py-3"><Status valor={item.status} /></td></tr>)}</tbody></table></div>{!dados.length && <p className="p-10 text-center text-sm text-gray-400">Nenhuma licença encontrada.</p>}</section>;
}

function Cards({ dados }: { dados: LicencaTI[] }) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{dados.map((item) => <article key={item.appControl} className="card p-5"><div className="flex items-start justify-between gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 font-semibold text-brand-600">{item.colaborador.split(" ").slice(0, 2).map((parte) => parte[0]).join("")}</div><Status valor={item.status} /></div><h2 className="mt-4 text-sm font-semibold text-gray-900">{item.colaborador}</h2><p className="mt-1 text-xs text-gray-500">{item.departamento} • {item.perfil}</p><div className="my-4 grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-3 text-xs"><div><p className="text-[10px] text-gray-400">Cód. SAP</p><p className="mt-1 font-mono font-medium text-gray-700">{item.codigoSap}</p></div><div><p className="text-[10px] text-gray-400">AppControl</p><p className="mt-1 font-mono font-medium text-gray-700">{item.appControl}</p></div></div><div className="flex flex-wrap gap-2">{[["CRM", item.crm], ["Logística", item.logistica], ["Financeiro", item.financeiro]].map(([nome, ativo]) => <span key={String(nome)} className={`rounded-full px-2 py-1 text-[10px] font-medium ${ativo ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"}`}>{ativo ? "✓ " : ""}{nome}</span>)}</div></article>)}</div>;
}

function Lista({ dados }: { dados: LicencaTI[] }) {
  return <section className="card divide-y divide-gray-100 overflow-hidden">{dados.map((item) => <article key={item.appControl} className="grid items-center gap-4 px-5 py-4 hover:bg-gray-50 md:grid-cols-[minmax(220px,1fr)_170px_190px_100px]"><div><p className="text-sm font-semibold text-gray-900">{item.colaborador}</p><p className="mt-1 text-xs text-gray-400">{item.codigoSap} • {item.appControl}</p></div><div><p className="text-[10px] uppercase text-gray-400">Departamento</p><p className="mt-1 text-xs font-medium text-gray-700">{item.departamento}</p></div><div className="flex flex-wrap gap-1.5">{item.crm && <span className="badge badge-info">CRM</span>}{item.logistica && <span className="badge badge-info">Logística</span>}{item.financeiro && <span className="badge badge-info">Financeiro</span>}</div><div className="md:text-right"><Status valor={item.status} /></div></article>)}{!dados.length && <p className="p-10 text-center text-sm text-gray-400">Nenhuma licença encontrada.</p>}</section>;
}

export default function LicencasPage() {
  const { dark } = useThemeContext();
  const [layout, setLayout] = useDataLayout("licencas", "dashboard");
  const [busca, setBusca] = useState(""); const [departamento, setDepartamento] = useState("Todos"); const [perfil, setPerfil] = useState("Todos"); const [status, setStatus] = useState("Todos");
  const termo = busca.trim().toLocaleLowerCase("pt-BR");
  const dados = LICENCAS.filter((item) => { const texto = Object.values(item).join(" ").toLocaleLowerCase("pt-BR"); return (!termo || texto.includes(termo)) && (departamento === "Todos" || item.departamento === departamento) && (perfil === "Todos" || item.perfil === perfil) && (status === "Todos" || item.status === status); });
  const limpar = () => { setBusca(""); setDepartamento("Todos"); setPerfil("Todos"); setStatus("Todos"); };
  const profissionais = dados.filter((item) => item.perfil === "Profissional").length;
  const ativos = dados.filter((item) => item.status === "Ativo").length;
  const porPerfil = ["Profissional", "Limitada"].map((nome) => ({ nome, total: dados.filter((item) => item.perfil === nome).length })).filter((item) => item.total);
  const porDepartamento = DEPARTAMENTOS.map((nome) => ({ nome, total: dados.filter((item) => item.departamento === nome).length })).filter((item) => item.total).sort((a, b) => b.total - a.total);
  const tooltip = { backgroundColor: dark ? "#111827" : "#fff", border: `1px solid ${dark ? "#374151" : "#e5e7eb"}`, borderRadius: 8, fontSize: 12 };

  return <div className="page"><div className="page-header gap-4"><div><h1 className="page-title">Licenças e acessos</h1><p className="page-subtitle">Usuários, perfis e módulos do sistema.</p></div><DataLayoutSwitcher value={layout} onChange={setLayout} /></div>
    <div className="card mb-5 p-4"><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6"><label className="relative sm:col-span-2"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input value={busca} onChange={(e) => setBusca(e.target.value)} className="input pl-9" placeholder="Buscar por nome, código, departamento ou módulo..." /></label><select className="input" value={departamento} onChange={(e) => setDepartamento(e.target.value)}><option>Todos</option>{DEPARTAMENTOS.map((item) => <option key={item}>{item}</option>)}</select><select className="input" value={perfil} onChange={(e) => setPerfil(e.target.value)}><option>Todos</option><option>Profissional</option><option>Limitada</option></select><select className="input" value={status} onChange={(e) => setStatus(e.target.value)}><option>Todos</option><option>Ativo</option><option>Pendente</option><option>Inativo</option></select><button type="button" onClick={limpar} className="btn-secondary flex w-full items-center justify-center gap-2"><X className="h-4 w-4" /> Limpar</button></div></div>

    {layout === "dashboard" && <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
      { label: "Licenças filtradas", value: dados.length, icon: UsersRound, color: "text-blue-600 bg-blue-50" },
      { label: "Perfis profissionais", value: profissionais, icon: ShieldCheck, color: "text-violet-600 bg-violet-50" },
      { label: "Acessos ativos", value: ativos, icon: BadgeCheck, color: "text-green-600 bg-green-50" },
      { label: "Custo mensal estimado", value: `R$ ${(profissionais * 200 + (dados.length - profissionais) * 160).toLocaleString("pt-BR")}`, icon: CircleDollarSign, color: "text-amber-600 bg-amber-50" },
    ].map(({ label, value, icon: Icon, color }) => <div key={label} className="card flex items-center gap-4 p-4"><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></div><div><p className="text-xs text-gray-500">{label}</p><p className="mt-1 text-xl font-semibold text-gray-900">{value}</p></div></div>)}</div>
      <div className="grid gap-5 lg:grid-cols-2"><div className="card p-5"><h2 className="mb-4 text-sm font-semibold text-gray-900">Licenças por departamento</h2><ResponsiveContainer width="100%" height={220}><BarChart data={porDepartamento.slice(0, 7)} layout="vertical" margin={{ left: 10, right: 20 }}><XAxis type="number" allowDecimals={false} tick={{ fill: dark ? "#9ca3af" : "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="nome" width={90} tick={{ fill: dark ? "#d1d5db" : "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltip} /><Bar dataKey="total" name="Licenças" fill="#C41E23" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div><div className="card p-5"><h2 className="mb-4 text-sm font-semibold text-gray-900">Distribuição de perfis</h2><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={porPerfil} dataKey="total" nameKey="nome" innerRadius={55} outerRadius={82} paddingAngle={3}>{porPerfil.map((_, index) => <Cell key={index} fill={CORES[index]} />)}</Pie><Tooltip contentStyle={tooltip} /></PieChart></ResponsiveContainer><div className="flex justify-center gap-5">{porPerfil.map((item, index) => <span key={item.nome} className="flex items-center gap-2 text-xs text-gray-500"><span className="h-2 w-2 rounded-full" style={{ background: CORES[index] }} />{item.nome}: {item.total}</span>)}</div></div></div><Tabela dados={dados} /></div>}
    {layout === "cards" && <Cards dados={dados} />}
    {layout === "list" && <Lista dados={dados} />}
  </div>;
}
