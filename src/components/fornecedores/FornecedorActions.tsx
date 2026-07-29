import { useRef, useState } from "react";
import { Bold, Italic, Link, List, Loader2, Mail, Paperclip, TicketPlus, Underline, X } from "lucide-react";
import type { Fornecedor } from "../../services/fornecedores";
import { abrirChamadoFornecedor, carregarCatalogosSults, enviarEmailFornecedor } from "../../services/acoesFornecedor";
import type { PessoaChamado } from "../../services/chamadosSults";

type Item = { id: number; nome: string };
type Catalogos = {
  pessoasHistorico: PessoaChamado[];
  departamentos: Item[];
  assuntos: Item[];
  aviso?: string;
};

function Janela({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={onClose}>
    <section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
        <h2 className="text-base font-semibold text-gray-900">{titulo}</h2>
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
      </header>
      {children}
    </section>
  </div>;
}

const normalizar = (valor: string) => valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export default function FornecedorActions({ nome, fornecedor }: { nome: string; fornecedor?: Fornecedor }) {
  const [modal, setModal] = useState<"email" | "chamado" | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [email, setEmail] = useState({ para: fornecedor?.email ?? "", assunto: `Contato — ${nome}`, anexos: [] as File[] });
  const mensagemEmail = useRef<HTMLDivElement>(null);
  const [chamado, setChamado] = useState({
    titulo: `Fornecedor: ${nome}`, mensagem: "", operacao: "", periodo: "", vencimento: "", filial: "", valor: "",
    solicitanteId: "", departamentoId: "", assuntoId: "",
  });

  const fechar = () => { setModal(null); setErro(""); setAviso(""); setSucesso(""); };
  const procurar = <T extends Item>(itens: T[], nomeExato: string) => itens.find((item) => normalizar(item.nome) === normalizar(nomeExato));

  async function prepararChamado() {
    setModal("chamado"); setErro(""); setAviso(""); setCarregando(true);
    try {
      const base = await carregarCatalogosSults<Catalogos>();
      const solicitante = procurar(base.pessoasHistorico, "Manager");
      const departamento = procurar(base.departamentos, "Auditoria");
      const assunto = procurar(base.assuntos, "Lançamento de despesas gerais (fixas e variáveis)")
        ?? procurar(base.assuntos, "Lançamento de despesas");
      setChamado((atual) => ({
        ...atual,
        solicitanteId: String(solicitante?.id ?? ""),
        departamentoId: String(departamento?.id ?? import.meta.env.VITE_SULTS_EXPENSE_DEPARTMENT_ID ?? "1"),
        assuntoId: String(assunto?.id ?? import.meta.env.VITE_SULTS_EXPENSE_SUBJECT_ID ?? "45"),
      }));
      setAviso(base.aviso ?? "");
      if (!solicitante) setErro("Não foi possível localizar o solicitante Manager no histórico da SULTS.");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar o preset da SULTS.");
    } finally {
      setCarregando(false);
    }
  }

  async function anexosEmail() {
    return Promise.all(email.anexos.map((file) => new Promise<{ filename: string; content: string }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ filename: file.name, content: String(reader.result).split(",")[1] });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    })));
  }

  async function enviarEmail() {
    const html = mensagemEmail.current?.innerHTML.trim() ?? "";
    if (!email.para || !email.assunto || !html) return setErro("Preencha destinatário, assunto e mensagem.");
    setEnviando(true); setErro("");
    try {
      await enviarEmailFornecedor({ para: email.para, assunto: email.assunto, mensagem: html, anexos: await anexosEmail() });
      setSucesso("E-mail enviado com sucesso.");
    } catch (e) { setErro(e instanceof Error ? e.message : "Erro ao enviar."); }
    finally { setEnviando(false); }
  }

  async function criarChamado() {
    const obrigatorios = [chamado.titulo, chamado.operacao, chamado.periodo, chamado.vencimento, chamado.filial, chamado.valor, chamado.mensagem, chamado.solicitanteId, chamado.departamentoId, chamado.assuntoId];
    if (obrigatorios.some((valor) => !valor)) return setErro("Preencha todos os campos e aguarde o carregamento do preset.");
    const mensagem = [
      `Operação / Serviço: ${chamado.operacao}`, `Período: ${chamado.periodo}`,
      `Data de vencimento: ${chamado.vencimento}`, `Loja / Filial: ${chamado.filial}`,
      `Fornecedor: ${nome}`, `Valor: ${chamado.valor}`, "", `Descrição: ${chamado.mensagem}`,
    ].join("\n");
    setEnviando(true); setErro("");
    try {
      const resultado = await abrirChamadoFornecedor({
        titulo: chamado.titulo, mensagem, tipo: 1,
        solicitanteId: Number(chamado.solicitanteId), departamentoId: Number(chamado.departamentoId),
        assuntoId: Number(chamado.assuntoId),
      });
      setSucesso(`Chamado #${resultado?.id ?? ""} aberto com sucesso.`);
    } catch (e) { setErro(e instanceof Error ? e.message : "Erro ao abrir chamado."); }
    finally { setEnviando(false); }
  }

  const campo = (label: string, chave: "operacao" | "periodo" | "vencimento" | "filial" | "valor", tipo = "text") =>
    <label><span className="mb-1.5 block text-xs font-medium text-gray-600">{label} *</span><input type={tipo} className="input" value={chamado[chave]} onChange={(e) => setChamado({ ...chamado, [chave]: e.target.value })} /></label>;

  return <>
    <div className="ml-auto flex gap-2">
      <button type="button" onClick={() => setModal("email")} className="btn-secondary flex items-center gap-2 text-xs"><Mail className="h-3.5 w-3.5" /> Enviar e-mail</button>
      <button type="button" onClick={() => void prepararChamado()} className="btn-primary flex items-center gap-2 text-xs"><TicketPlus className="h-3.5 w-3.5" /> Abrir chamado</button>
    </div>

    {modal === "email" && <Janela titulo={`Enviar e-mail — ${nome}`} onClose={fechar}><div className="space-y-4 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label><span className="mb-1.5 block text-xs font-medium text-gray-600">Destinatário *</span><input type="email" className="input" value={email.para} onChange={(e) => setEmail({ ...email, para: e.target.value })} /></label>
        <label><span className="mb-1.5 block text-xs font-medium text-gray-600">Assunto *</span><input className="input" value={email.assunto} onChange={(e) => setEmail({ ...email, assunto: e.target.value })} /></label>
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200"><div className="flex gap-1 border-b bg-gray-50 p-2">
        {[[Bold, "bold"], [Italic, "italic"], [Underline, "underline"], [List, "insertUnorderedList"], [Link, "createLink"]].map(([Icon, comando]) =>
          <button key={String(comando)} type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand(String(comando), false, comando === "createLink" ? window.prompt("Endereço do link:") ?? undefined : undefined); }} className="rounded p-2 text-gray-500 hover:bg-white"><Icon className="h-4 w-4" /></button>)}
      </div><div ref={mensagemEmail} contentEditable className="min-h-48 p-4 text-sm outline-none" /></div>
      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed p-3 text-xs text-gray-500"><Paperclip className="h-4 w-4" /><input type="file" multiple className="hidden" onChange={(e) => setEmail({ ...email, anexos: [...e.target.files ?? []] })} />{email.anexos.length ? email.anexos.map((a) => a.name).join(", ") : "Adicionar anexo"}</label>
      {erro && <p className="text-xs text-red-600">{erro}</p>}{sucesso && <p className="text-xs text-green-600">{sucesso}</p>}
      <div className="flex justify-end"><button onClick={() => void enviarEmail()} disabled={enviando} className="btn-primary">Enviar</button></div>
    </div></Janela>}

    {modal === "chamado" && <Janela titulo={`Abrir chamado SULTS — ${nome}`} onClose={fechar}><div className="grid gap-4 p-5 sm:grid-cols-2">
      {carregando && <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700 sm:col-span-2"><Loader2 className="h-4 w-4 animate-spin" /> Localizando o preset na SULTS...</div>}
      {aviso && <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 sm:col-span-2">{aviso}</div>}
      <div className="rounded-xl border border-green-100 bg-green-50 p-4 text-xs leading-6 text-green-900 sm:col-span-2">
        <strong>Preset automático:</strong> Manager → Auditoria → Lançamento de despesas gerais (fixas e variáveis) → atribuição automática pela SULTS
      </div>
      <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-medium text-gray-600">Título *</span><input className="input" value={chamado.titulo} onChange={(e) => setChamado({ ...chamado, titulo: e.target.value })} /></label>
      {campo("Operação / Serviço", "operacao")}{campo("Referente a qual período", "periodo")}{campo("Data de vencimento", "vencimento", "date")}{campo("Loja / Filial", "filial")}{campo("Valor", "valor")}
      <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-medium text-gray-600">Descrição *</span><textarea className="input min-h-32" value={chamado.mensagem} onChange={(e) => setChamado({ ...chamado, mensagem: e.target.value })} /></label>
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-800 sm:col-span-2">Os campos são enviados como mensagem estruturada. A API pública da SULTS não documenta os campos personalizados nem upload de anexos para criação de chamados.</p>
      {erro && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 sm:col-span-2">{erro}</div>}{sucesso && <p className="text-xs text-green-600 sm:col-span-2">{sucesso}</p>}
      <div className="flex justify-end sm:col-span-2"><button onClick={() => void criarChamado()} disabled={enviando || carregando || Boolean(erro)} className="btn-primary flex items-center gap-2">{enviando && <Loader2 className="h-4 w-4 animate-spin" />} Abrir chamado</button></div>
    </div></Janela>}
  </>;
}
