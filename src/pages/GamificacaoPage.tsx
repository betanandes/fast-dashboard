import { useEffect, useState } from "react";
import { BadgeCheck, BookOpen, CheckCircle2, Headphones, Loader2, ShieldCheck, Sparkles, Timer, Trophy, Users } from "lucide-react";
import { carregarChamadosSults } from "../services/chamadosSults";
import { carregarConfiguracaoSults } from "../services/sults";

const NIVEIS = [
  ["Inicializador", "Toda grande solução começa com um primeiro diagnóstico.", 0],
  ["Operador de Suporte", "Atender bem também é construir confiança.", 150],
  ["Analista de Sistemas", "Você transforma sintomas em soluções.", 400],
  ["Guardião da Infraestrutura", "Disponibilidade e segurança caminham juntas.", 750],
  ["Especialista em Automação", "Processos melhores deixam tempo para inovar.", 1200],
  ["Arquiteto de Soluções", "Você conecta pessoas, processos e tecnologia.", 1800],
  ["Mestre da Tecnologia", "Seu conhecimento eleva todo o time.", 2600],
] as const;

const MISSOES = [
  ["Primeira resposta ágil", "Registrar a primeira interação em até 30 minutos.", "Diária", 1, 20],
  ["Fila sob controle", "Concluir 5 chamados sem reabertura.", "Semanal", 5, 80],
  ["Parceiro do time", "Apoiar chamados de outro analista.", "Semanal", 3, 60],
  ["Documentação é solução", "Publicar ou atualizar artigos da base.", "Mensal", 2, 100],
  ["Prevenção em primeiro lugar", "Concluir manutenção preventiva planejada.", "Mensal", 1, 120],
] as const;

const CONQUISTAS = [
  ["Primeiro Atendimento", "Concluiu o primeiro chamado.", Headphones, "Atendimento"],
  ["Resolvedor Bronze", "Concluiu 25 chamados.", BadgeCheck, "Atendimento"],
  ["Velocidade com Qualidade", "10 primeiras respostas dentro do SLA.", Timer, "SLA"],
  ["Guardião do Conhecimento", "Publicou 5 artigos de documentação.", BookOpen, "Conhecimento"],
  ["Sentinela da Infraestrutura", "Concluiu 10 ações preventivas.", ShieldCheck, "Infraestrutura"],
  ["Espírito de Equipe", "Apoiou 20 atendimentos de colegas.", Users, "Colaboração"],
] as const;

export default function GamificacaoPage() {
  const [aba, setAba] = useState<"visao" | "niveis" | "conquistas" | "missoes">("visao");
  const [configSults] = useState(() => carregarConfiguracaoSults());
  const loginSults = configSults.login.trim();
  const [metricas, setMetricas] = useState({ resolvidos: 0, sla: 0, apoios: 0 });
  const [carregando, setCarregando] = useState(Boolean(loginSults));
  const [aviso, setAviso] = useState(loginSults ? "" : "Preencha o login ou nome no SULTS em Configurações para calcular a jornada.");
  useEffect(() => {
    if (!loginSults) return;
    const fim = new Date(); const inicio = new Date(); inicio.setFullYear(inicio.getFullYear() - 1);
    const data = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    void carregarChamadosSults({ inicio: data(inicio), fim: data(fim) }).then(({ data: chamados }) => {
      const normalizar = (valor: string) => valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR");
      const login = normalizar(loginSults);
      const pessoas = new Map<number, string>();
      chamados.forEach((c) => [c.solicitante, c.responsavel, ...(c.apoio?.map((a) => a.pessoa) ?? [])].forEach((p) => { if (p?.id && p.nome) pessoas.set(p.id, p.nome); }));
      const exata = [...pessoas].find(([, nome]) => normalizar(nome) === login);
      const parciais = [...pessoas].filter(([, nome]) => normalizar(nome).includes(login));
      const pessoaId = exata?.[0] ?? (parciais.length === 1 ? parciais[0][0] : null);
      if (!pessoaId) {
        setAviso(parciais.length > 1 ? "O login informado corresponde a mais de uma pessoa. Informe o nome completo em Configurações." : "O login informado não foi localizado nos chamados retornados pela SULTS.");
        return;
      }
      const meus = chamados.filter((c) => c.responsavel?.id === pessoaId);
      const resolvidos = meus.filter((c) => [2,3].includes(c.situacao)).length;
      const sla = meus.filter((c) => c.aberto && c.primeiraInteracao && (new Date(c.primeiraInteracao).getTime() - new Date(c.aberto).getTime()) <= 30 * 60_000).length;
      const apoios = chamados.filter((c) => c.apoio?.some((a) => a.pessoa?.id === pessoaId)).length;
      setMetricas({ resolvidos, sla, apoios });
    }).catch((e) => setAviso(e instanceof Error ? e.message : "Não foi possível sincronizar a jornada com a SULTS.")).finally(() => setCarregando(false));
  }, [loginSults]);
  const pontos = metricas.resolvidos * 10 + metricas.sla * 5 + metricas.apoios * 3;
  const atual = [...NIVEIS].reverse().find((nivel) => pontos >= nivel[2]) ?? NIVEIS[0];
  const proximo = NIVEIS.find((nivel) => nivel[2] > pontos);
  const progresso = proximo ? Math.round(((pontos - atual[2]) / (proximo[2] - atual[2])) * 100) : 100;

  return <div className="page space-y-5">
    <div className="page-header"><div><h1 className="page-title">Jornada TI</h1><p className="page-subtitle">Evolução conectada aos atendimentos da SULTS nos últimos 12 meses.</p></div><span className="badge badge-info flex items-center gap-1.5">{carregando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} {carregando ? "Sincronizando" : "SULTS sincronizada"}</span></div>
    {aviso && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">{aviso}</div>}
    <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1">{([["visao","Minha jornada"],["niveis","Níveis"],["conquistas","Conquistas"],["missoes","Missões"]] as const).map(([id, nome]) => <button key={id} onClick={() => setAba(id)} className={`rounded-lg px-4 py-2 text-sm font-medium ${aba === id ? "bg-brand-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>{nome}</button>)}</div>
    {aba === "visao" && <div className="space-y-5"><section className="card overflow-hidden p-6"><div className="flex flex-col gap-6 md:flex-row md:items-center"><div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-700 to-slate-950 text-white shadow-lg"><Trophy className="h-10 w-10" /></div><div className="flex-1"><p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Nível {NIVEIS.indexOf(atual)+1}</p><h2 className="mt-1 text-2xl font-semibold text-gray-900">{atual[0]}</h2><p className="mt-1 text-sm text-gray-500">{atual[1]}</p><div className="mt-5"><div className="mb-2 flex justify-between text-xs text-gray-500"><span>{pontos} pontos</span><span>{proximo ? `${proximo[2]} para ${proximo[0]}` : "Nível máximo"}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-brand-600" style={{ width: `${progresso}%` }} /></div></div></div></div></section><div className="grid gap-4 md:grid-cols-3"><div className="card p-5"><CheckCircle2 className="h-5 w-5 text-green-500" /><p className="mt-4 text-2xl font-semibold text-gray-900">{metricas.resolvidos}</p><p className="text-xs text-gray-500">chamados resolvidos/concluídos</p></div><div className="card p-5"><Timer className="h-5 w-5 text-blue-500" /><p className="mt-4 text-2xl font-semibold text-gray-900">{metricas.sla}</p><p className="text-xs text-gray-500">primeiras respostas em até 30 min</p></div><div className="card p-5"><Users className="h-5 w-5 text-violet-500" /><p className="mt-4 text-2xl font-semibold text-gray-900">{metricas.apoios}</p><p className="text-xs text-gray-500">chamados apoiados</p></div></div><section className="rounded-xl border border-blue-100 bg-blue-50 p-5"><h2 className="text-sm font-semibold text-blue-900">Pontuação dinâmica</h2><p className="mt-2 text-xs leading-5 text-blue-700">10 PT por chamado concluído/resolvido, 5 PT por primeira resposta em até 30 minutos e 3 PT por participação como apoio. A apuração usa o ID SULTS vinculado em Configurações.</p></section></div>}
    {aba === "niveis" && <section className="card overflow-hidden"><div className="border-b border-gray-100 px-5 py-4"><h2 className="text-sm font-semibold text-gray-900">Trilha de evolução</h2><p className="mt-1 text-xs text-gray-500">{NIVEIS.length} níveis progressivos</p></div><div className="divide-y divide-gray-100">{NIVEIS.map(([nome, frase, pt], index) => <article key={nome} className="grid items-center gap-4 px-5 py-4 md:grid-cols-[64px_minmax(200px,0.7fr)_1fr_120px]"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 font-semibold text-white">{index + 1}</div><p className="text-sm font-semibold text-gray-900">{nome}</p><p className="text-xs text-gray-500">{frase}</p><p className="text-sm font-semibold text-brand-600">{pt.toLocaleString("pt-BR")} PT</p></article>)}</div></section>}
    {aba === "conquistas" && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{CONQUISTAS.map(([nome, descricao, Icon, categoria], index) => { const conquistada = [metricas.resolvidos >= 1, metricas.resolvidos >= 25, metricas.sla >= 10, false, false, metricas.apoios >= 20][index]; return <article key={nome} className={`card p-5 ${conquistada ? "border-green-200" : ""}`}><div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${conquistada ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}><Icon className="h-7 w-7" /></div><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-brand-600">{categoria}</p><h2 className="mt-1 text-sm font-semibold text-gray-900">{nome}</h2><p className="mt-2 text-xs leading-5 text-gray-500">{descricao}</p><span className={`mt-4 inline-flex items-center gap-1.5 text-xs ${conquistada ? "font-medium text-green-700" : "text-gray-400"}`}><CheckCircle2 className="h-3.5 w-3.5" /> {conquistada ? "Conquistada pela SULTS" : "Ainda não conquistada"}</span></article>; })}</div>}
    {aba === "missoes" && <section className="card overflow-hidden"><div className="border-b border-gray-100 px-5 py-4"><h2 className="text-sm font-semibold text-gray-900">Missões de qualidade</h2><p className="mt-1 text-xs text-gray-500">Metas equilibradas entre atendimento, conhecimento e prevenção.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-gray-50 uppercase text-gray-500"><tr><th className="px-5 py-3">Missão</th><th className="px-4 py-3">Período</th><th className="px-4 py-3">Meta</th><th className="px-4 py-3">Recompensa</th><th className="px-4 py-3">Status</th></tr></thead><tbody>{MISSOES.map(([nome, descricao, periodo, meta, pt]) => <tr key={nome} className="border-t border-gray-100"><td className="px-5 py-3"><p className="font-semibold text-gray-900">{nome}</p><p className="mt-1 text-gray-400">{descricao}</p></td><td className="px-4 py-3"><span className="badge badge-info">{periodo}</span></td><td className="px-4 py-3 font-medium">{meta}</td><td className="px-4 py-3 font-semibold text-brand-600">{pt} PT</td><td className="px-4 py-3"><span className="badge badge-ok">Ativa</span></td></tr>)}</tbody></table></div></section>}
  </div>;
}
