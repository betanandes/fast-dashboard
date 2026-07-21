import { useState } from "react";
import { BadgeCheck, CircleDollarSign, Search, ShieldCheck, UsersRound, X } from "lucide-react";
import { LICENCAS } from "../data/tiData";

export default function LicencasPage() {
  const [busca, setBusca] = useState("");
  const [departamento, setDepartamento] = useState("Todos");
  const [perfil, setPerfil] = useState("Todos");
  const [status, setStatus] = useState("Todos");
  const departamentos = [...new Set(LICENCAS.map((item) => item.departamento))].sort();

  const dados = (() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return LICENCAS.filter((item) => {
      const texto = Object.values(item).join(" ").toLocaleLowerCase("pt-BR");
      return (!termo || texto.includes(termo)) &&
        (departamento === "Todos" || item.departamento === departamento) &&
        (perfil === "Todos" || item.perfil === perfil) &&
        (status === "Todos" || item.status === status);
    });
  })();

  const limpar = () => { setBusca(""); setDepartamento("Todos"); setPerfil("Todos"); setStatus("Todos"); };
  const profissionais = LICENCAS.filter((item) => item.perfil === "Profissional").length;
  const pendencias = LICENCAS.filter((item) => item.status !== "Ativo").length;

  return (
    <div className="page">
      <div className="page-header">
        <div><h1 className="page-title">Licenças e acessos</h1><p className="page-subtitle">Dashboard de usuários, perfis e módulos do sistema.</p></div>
        <span className="badge badge-info">Layout dashboard</span>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Licenças cadastradas", value: LICENCAS.length, icon: UsersRound, color: "text-blue-600 bg-blue-50" },
          { label: "Perfis profissionais", value: profissionais, icon: ShieldCheck, color: "text-violet-600 bg-violet-50" },
          { label: "Acessos ativos", value: LICENCAS.length - pendencias, icon: BadgeCheck, color: "text-green-600 bg-green-50" },
          { label: "Custo mensal estimado", value: `R$ ${(profissionais * 200 + (LICENCAS.length - profissionais) * 160).toLocaleString("pt-BR")}`, icon: CircleDollarSign, color: "text-amber-600 bg-amber-50" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-4 p-4"><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></div><div><p className="text-xs text-gray-500">{label}</p><p className="mt-1 text-xl font-semibold text-gray-900">{value}</p></div></div>
        ))}
      </div>

      <div className="card mb-5 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_repeat(3,180px)_auto]">
          <label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input value={busca} onChange={(e) => setBusca(e.target.value)} className="input pl-9" placeholder="Buscar por nome, código, departamento ou módulo..." /></label>
          <select className="input" value={departamento} onChange={(e) => setDepartamento(e.target.value)}><option>Todos</option>{departamentos.map((item) => <option key={item}>{item}</option>)}</select>
          <select className="input" value={perfil} onChange={(e) => setPerfil(e.target.value)}><option>Todos</option><option>Profissional</option><option>Limitada</option></select>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}><option>Todos</option><option>Ativo</option><option>Pendente</option><option>Inativo</option></select>
          <button type="button" onClick={limpar} className="btn-secondary flex items-center justify-center gap-2"><X className="h-4 w-4" /> Limpar</button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4"><h2 className="text-sm font-semibold text-gray-900">Colaboradores</h2><span className="text-xs text-gray-400">{dados.length} resultado(s)</span></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left"><thead className="bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3">Colaborador</th><th className="px-4 py-3">Departamento</th><th className="px-4 py-3">Cód. SAP</th><th className="px-4 py-3">AppControl</th><th className="px-4 py-3">Perfil</th><th className="px-4 py-3 text-center">CRM</th><th className="px-4 py-3 text-center">Logística</th><th className="px-4 py-3 text-center">Financeiro</th><th className="px-4 py-3">Status</th></tr></thead>
          <tbody>{dados.map((item) => <tr key={item.appControl} className="border-t border-gray-100 text-xs hover:bg-gray-50"><td className="px-5 py-3 font-medium text-gray-900">{item.colaborador}</td><td className="px-4 py-3 text-gray-600">{item.departamento}</td><td className="px-4 py-3 font-mono text-gray-500">{item.codigoSap}</td><td className="px-4 py-3 font-mono text-gray-500">{item.appControl}</td><td className="px-4 py-3 text-gray-600">{item.perfil}</td>{[item.crm, item.logistica, item.financeiro].map((ativo, index) => <td key={index} className="px-4 py-3 text-center"><span className={ativo ? "text-green-600" : "text-gray-300"}>{ativo ? "✓" : "—"}</span></td>)}<td className="px-4 py-3"><span className={`badge ${item.status === "Ativo" ? "badge-ok" : item.status === "Pendente" ? "badge-warn" : "badge-danger"}`}>{item.status}</span></td></tr>)}</tbody></table></div>
          {dados.length === 0 && <p className="p-10 text-center text-sm text-gray-400">Nenhuma licença encontrada com esses filtros.</p>}
        </section>

        <aside className="card self-start p-5"><h2 className="mb-4 text-sm font-semibold text-gray-900">Resumo por departamento</h2><div className="space-y-3">{departamentos.map((nome) => { const total = LICENCAS.filter((item) => item.departamento === nome).length; return <div key={nome}><div className="mb-1 flex justify-between text-xs"><span className="text-gray-600">{nome}</span><span className="font-medium text-gray-900">{total}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.max(12, total / LICENCAS.length * 100)}%` }} /></div></div>; })}</div></aside>
      </div>
    </div>
  );
}
