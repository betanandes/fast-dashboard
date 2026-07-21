import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarDays, Clock3, Loader2, Mail, Phone, Plus, Save, Search, UserRoundCheck, X } from "lucide-react";
import { listarPlantoes, salvarPlantao } from "../services/plantao";
import type { PlantaoTI } from "../types/database";

const EQUIPE = [
  { nome: "Adriano Santana", email: "adriano.santana@fastdrywall.com.br", telefone: "(21) 99901-1001" },
  { nome: "Bruno Tamer", email: "bruno.tamer@fastdrywall.com.br", telefone: "(21) 99902-1002" },
  { nome: "Elaine Dias", email: "elaine.dias@fastdrywall.com.br", telefone: "(21) 99903-1003" },
  { nome: "Gleisly Santella", email: "gleisly.santella@fastdrywall.com.br", telefone: "(21) 99904-1004" },
];

function dataISO(data: Date) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

function gerarEscala(): PlantaoTI[] {
  const hoje = new Date(); hoje.setHours(12, 0, 0, 0);
  const primeiro = new Date(hoje); primeiro.setDate(hoje.getDate() + ((6 - hoje.getDay() + 7) % 7));
  return Array.from({ length: 10 }, (_, index) => {
    const data = new Date(primeiro); data.setDate(primeiro.getDate() + index * 7);
    const pessoa = EQUIPE[index % EQUIPE.length];
    return { id: `demo-${index}`, data: dataISO(data), colaborador_nome: pessoa.nome, colaborador_email: pessoa.email, telefone: pessoa.telefone, observacao: index === 0 ? "Plantão remoto das 8h às 13h" : "Disponibilidade remota", created_at: new Date().toISOString(), created_by: null };
  });
}

function formatarData(valor: string) { return new Date(`${valor}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }); }

export default function PlantaoPage() {
  const [plantoes, setPlantoes] = useState<PlantaoTI[]>(gerarEscala);
  const [busca, setBusca] = useState(""); const [periodo, setPeriodo] = useState("Próximos"); const [origemDemo, setOrigemDemo] = useState(true);
  const [mostrarCadastro, setMostrarCadastro] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroCadastro, setErroCadastro] = useState("");
  const [novoPlantao, setNovoPlantao] = useState({ data: "", colaborador_nome: "", colaborador_email: "", telefone: "", observacao: "Plantão remoto das 8h às 13h" });
  useEffect(() => { listarPlantoes().then((dados) => { if (dados.length) { setPlantoes(dados); setOrigemDemo(false); } }).catch(() => undefined); }, []);
  const hoje = dataISO(new Date());
  const dados = useMemo(() => plantoes.filter((item) => { const termo = busca.trim().toLocaleLowerCase("pt-BR"); const texto = Object.values(item).join(" ").toLocaleLowerCase("pt-BR"); const periodoOk = periodo === "Todos" || (periodo === "Próximos" ? item.data >= hoje : item.data < hoje); return (!termo || texto.includes(termo)) && periodoOk; }), [plantoes, busca, periodo, hoje]);
  const proximo = plantoes.find((item) => item.data >= hoje) ?? plantoes[0];
  const cadastrar = async () => {
    setErroCadastro("");
    if (!novoPlantao.data || !novoPlantao.colaborador_nome.trim() || !novoPlantao.colaborador_email.trim()) { setErroCadastro("Preencha a data, o nome e o e-mail do colaborador."); return; }
    if (new Date(`${novoPlantao.data}T12:00:00`).getDay() !== 6) { setErroCadastro("A data do plantão precisa ser um sábado."); return; }
    setSalvando(true);
    try {
      await salvarPlantao({ ...novoPlantao, colaborador_nome: novoPlantao.colaborador_nome.trim(), colaborador_email: novoPlantao.colaborador_email.trim(), telefone: novoPlantao.telefone.trim() || null, observacao: novoPlantao.observacao.trim() || null });
      const atualizados = await listarPlantoes(); setPlantoes(atualizados); setOrigemDemo(false); setMostrarCadastro(false); setNovoPlantao({ data: "", colaborador_nome: "", colaborador_email: "", telefone: "", observacao: "Plantão remoto das 8h às 13h" });
    } catch (erro) { setErroCadastro(erro instanceof Error ? erro.message : "Não foi possível salvar o plantão."); } finally { setSalvando(false); }
  };
  return <div className="page"><div className="page-header"><div><h1 className="page-title">Plantão de sábado</h1><p className="page-subtitle">Visualize quem estará disponível e acompanhe a escala semanal.</p></div><div className="flex items-center gap-2">{origemDemo && <span className="badge badge-warn">Escala demonstrativa</span>}<button type="button" onClick={() => setMostrarCadastro((valor) => !valor)} className="btn-primary flex items-center gap-2 text-sm"><Plus className="h-4 w-4" /> Cadastrar plantão</button></div></div>
    {mostrarCadastro && <section className="card mb-6 overflow-hidden"><div className="border-b border-gray-100 px-5 py-4"><h2 className="text-sm font-semibold text-gray-900">Novo sábado de plantão</h2><p className="mt-1 text-xs text-gray-400">Se a data já existir, o colaborador escalado será atualizado.</p></div><div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-5"><label><span className="mb-1.5 block text-xs font-medium text-gray-600">Data (sábado)</span><input type="date" className="input" value={novoPlantao.data} onChange={(e) => setNovoPlantao((atual) => ({ ...atual, data: e.target.value }))} /></label><label><span className="mb-1.5 block text-xs font-medium text-gray-600">Colaborador</span><input className="input" value={novoPlantao.colaborador_nome} onChange={(e) => setNovoPlantao((atual) => ({ ...atual, colaborador_nome: e.target.value }))} placeholder="Nome completo" /></label><label><span className="mb-1.5 block text-xs font-medium text-gray-600">E-mail</span><input type="email" className="input" value={novoPlantao.colaborador_email} onChange={(e) => setNovoPlantao((atual) => ({ ...atual, colaborador_email: e.target.value }))} placeholder="colaborador@empresa.com.br" /></label><label><span className="mb-1.5 block text-xs font-medium text-gray-600">Telefone</span><input className="input" value={novoPlantao.telefone} onChange={(e) => setNovoPlantao((atual) => ({ ...atual, telefone: e.target.value }))} placeholder="(21) 99999-9999" /></label><label><span className="mb-1.5 block text-xs font-medium text-gray-600">Observação</span><input className="input" value={novoPlantao.observacao} onChange={(e) => setNovoPlantao((atual) => ({ ...atual, observacao: e.target.value }))} /></label></div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-5 py-4">{erroCadastro ? <p className="flex items-center gap-2 text-xs text-red-600"><AlertCircle className="h-4 w-4" /> {erroCadastro}</p> : <span />}<div className="flex gap-2"><button type="button" onClick={() => setMostrarCadastro(false)} className="btn-secondary">Cancelar</button><button type="button" onClick={cadastrar} disabled={salvando} className="btn-primary flex items-center gap-2">{salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar plantão</button></div></div></section>}
    {proximo && <section className="mb-6 overflow-hidden rounded-2xl bg-gray-900 text-white shadow-sm"><div className="grid lg:grid-cols-[1fr_330px]"><div className="p-7"><p className="mb-5 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-gray-400"><UserRoundCheck className="h-4 w-4 text-green-400" /> Próximo plantonista</p><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-xl font-semibold">{proximo.colaborador_nome.split(" ").slice(0, 2).map((parte) => parte[0]).join("")}</div><div><h2 className="text-2xl font-semibold">{proximo.colaborador_nome}</h2><p className="mt-1 capitalize text-gray-300">{formatarData(proximo.data)}</p></div></div><div className="mt-6 flex flex-wrap gap-4 text-xs text-gray-300"><span className="flex items-center gap-2"><Mail className="h-4 w-4 text-gray-500" /> {proximo.colaborador_email}</span><span className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-500" /> {proximo.telefone}</span></div></div><div className="border-t border-white/10 bg-white/5 p-7 lg:border-l lg:border-t-0"><p className="text-xs uppercase tracking-wide text-gray-400">Informações do plantão</p><div className="mt-5 space-y-4 text-sm"><p className="flex items-center gap-3"><CalendarDays className="h-4 w-4 text-brand-400" /> Sábado, {new Date(`${proximo.data}T12:00:00`).toLocaleDateString("pt-BR")}</p><p className="flex items-center gap-3"><Clock3 className="h-4 w-4 text-brand-400" /> 08:00 às 13:00</p><p className="text-xs leading-5 text-gray-400">{proximo.observacao}</p></div></div></div></section>}
    <div className="card mb-5 p-4"><div className="grid gap-3 md:grid-cols-[minmax(260px,1fr)_180px_auto]"><label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input className="input pl-9" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por colaborador, e-mail, telefone ou observação..." /></label><select className="input" value={periodo} onChange={(e) => setPeriodo(e.target.value)}><option>Próximos</option><option>Realizados</option><option>Todos</option></select><button type="button" onClick={() => { setBusca(""); setPeriodo("Próximos"); }} className="btn-secondary flex items-center justify-center gap-2"><X className="h-4 w-4" /> Limpar</button></div></div>
    <section className="card overflow-hidden"><div className="flex items-center justify-between border-b border-gray-100 px-5 py-4"><h2 className="text-sm font-semibold text-gray-900">Escala completa</h2><span className="text-xs text-gray-400">{dados.length} plantão(ões)</span></div><div className="divide-y divide-gray-100">{dados.map((item) => <article key={item.id} className="grid items-center gap-4 px-5 py-4 hover:bg-gray-50 md:grid-cols-[150px_minmax(220px,1fr)_minmax(220px,1fr)_130px]"><div><p className="text-xs font-semibold capitalize text-gray-900">{formatarData(item.data)}</p><p className="mt-1 text-[10px] text-gray-400">{new Date(`${item.data}T12:00:00`).toLocaleDateString("pt-BR")}</p></div><div><p className="text-sm font-medium text-gray-900">{item.colaborador_nome}</p><p className="mt-1 text-xs text-gray-400">{item.colaborador_email}</p></div><div><p className="text-xs text-gray-600">{item.observacao || "Plantão remoto"}</p><p className="mt-1 text-[11px] text-gray-400">{item.telefone}</p></div><div className="md:text-right"><span className={`badge ${item.data >= hoje ? "badge-info" : "bg-gray-100 text-gray-500"}`}>{item.data === proximo?.data ? "Próximo" : item.data >= hoje ? "Agendado" : "Realizado"}</span></div></article>)}</div></section>
  </div>;
}
