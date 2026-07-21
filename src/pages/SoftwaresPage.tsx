import { useState } from "react";
import { ArrowUpRight, CircleDollarSign, Search, SlidersHorizontal, X } from "lucide-react";
import { SOFTWARES } from "../data/tiData";

const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function SoftwaresPage() {
  const [busca, setBusca] = useState("");
  const [satisfacao, setSatisfacao] = useState("Todos");
  const [responsavel, setResponsavel] = useState("Todos");
  const [faixa, setFaixa] = useState("Todos");
  const responsaveis = [...new Set(SOFTWARES.map((item) => item.responsavel))].sort();
  const dados = SOFTWARES.filter((item) => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    const texto = Object.values(item).join(" ").toLocaleLowerCase("pt-BR");
    const custoOk = faixa === "Todos" || (faixa === "Até R$ 500" && item.valorMensal <= 500) || (faixa === "R$ 501 a R$ 2.000" && item.valorMensal > 500 && item.valorMensal <= 2000) || (faixa === "Acima de R$ 2.000" && item.valorMensal > 2000);
    return (!termo || texto.includes(termo)) && (satisfacao === "Todos" || item.satisfaz === satisfacao) && (responsavel === "Todos" || item.responsavel === responsavel) && custoOk;
  });

  const limpar = () => { setBusca(""); setSatisfacao("Todos"); setResponsavel("Todos"); setFaixa("Todos"); };
  return <div className="page">
    <div className="page-header"><div><h1 className="page-title">Softwares e contratos</h1><p className="page-subtitle">Catálogo de ferramentas, acessos, responsáveis e custos.</p></div><span className="badge badge-info">Layout cards</span></div>
    <div className="card mb-6 p-4"><div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_repeat(3,190px)_auto]">
      <label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input className="input pl-9" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar software, aplicação, acesso ou responsável..." /></label>
      <select className="input" value={satisfacao} onChange={(e) => setSatisfacao(e.target.value)}><option>Todos</option><option>Sim</option><option>Em análise</option><option>Não</option></select>
      <select className="input" value={responsavel} onChange={(e) => setResponsavel(e.target.value)}><option>Todos</option>{responsaveis.map((item) => <option key={item}>{item}</option>)}</select>
      <select className="input" value={faixa} onChange={(e) => setFaixa(e.target.value)}><option>Todos</option><option>Até R$ 500</option><option>R$ 501 a R$ 2.000</option><option>Acima de R$ 2.000</option></select>
      <button type="button" onClick={limpar} className="btn-secondary flex items-center justify-center gap-2"><X className="h-4 w-4" /> Limpar</button>
    </div></div>
    <div className="mb-4 flex items-center justify-between"><p className="flex items-center gap-2 text-xs text-gray-500"><SlidersHorizontal className="h-4 w-4" /> {dados.length} software(s) encontrado(s)</p><p className="text-xs text-gray-500">Custo mensal filtrado: <strong className="text-gray-900">{moeda(dados.reduce((soma, item) => soma + item.valorMensal, 0))}</strong></p></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{dados.map((item) => <article key={item.nome} className="card flex min-h-64 flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-900 text-lg font-semibold text-white">{item.nome.slice(0, 1)}</div><span className={`badge ${item.satisfaz === "Sim" ? "badge-ok" : item.satisfaz === "Em análise" ? "badge-warn" : "badge-danger"}`}>{item.satisfaz}</span></div>
      <h2 className="font-semibold text-gray-900">{item.nome}</h2><p className="mt-1 flex-1 text-xs leading-5 text-gray-500">{item.aplicacao}</p>
      <div className="my-4 grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-3"><div><p className="text-[10px] text-gray-400">Mensal</p><p className="mt-1 text-sm font-semibold text-gray-900">{moeda(item.valorMensal)}</p></div><div><p className="text-[10px] text-gray-400">Anual</p><p className="mt-1 text-sm font-semibold text-gray-900">{moeda(item.valorAnual)}</p></div></div>
      <div className="flex items-center justify-between border-t border-gray-100 pt-4"><div><p className="text-[10px] text-gray-400">Responsável</p><p className="text-xs font-medium text-gray-700">{item.responsavel}</p></div><a href={item.link} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-brand-200 hover:text-brand-600" title={`Abrir ${item.nome}`}><ArrowUpRight className="h-4 w-4" /></a></div>
    </article>)}</div>
    {dados.length === 0 && <div className="card p-12 text-center"><CircleDollarSign className="mx-auto mb-3 h-7 w-7 text-gray-300" /><p className="text-sm text-gray-500">Nenhum software encontrado.</p></div>}
  </div>;
}
