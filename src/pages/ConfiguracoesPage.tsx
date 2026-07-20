import { useMemo, useState, type FormEvent } from "react";
import {
  AlertCircle,
  Bot,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  MessageSquareText,
  Search,
  ShieldCheck,
  TicketCheck,
  UserRoundSearch,
} from "lucide-react";
import {
  buscarPessoaSults,
  carregarConfiguracaoSults,
  listarChamadosNovos,
  salvarConfiguracaoSults,
  testarConexaoSults,
  type ConfiguracaoSults,
} from "../services/sults";

type Feedback = { tipo: "sucesso" | "erro" | "info"; texto: string } | null;

export default function ConfiguracoesPage() {
  const inicial = useMemo(() => carregarConfiguracaoSults(), []);
  const [config, setConfig] = useState<ConfiguracaoSults>(inicial);
  const [token, setToken] = useState("");
  const [mostrarToken, setMostrarToken] = useState(false);
  const [conectado, setConectado] = useState(false);
  const [carregando, setCarregando] = useState<"conexao" | "pessoa" | "chamados" | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const atualizar = <K extends keyof ConfiguracaoSults>(
    campo: K,
    valor: ConfiguracaoSults[K],
  ) => setConfig((atual) => ({ ...atual, [campo]: valor }));

  const testar = async () => {
    if (!token.trim()) {
      setFeedback({ tipo: "erro", texto: "Informe o token de acesso da API SULTS." });
      return;
    }
    setCarregando("conexao");
    setFeedback(null);
    try {
      await testarConexaoSults(token);
      setConectado(true);
      setFeedback({ tipo: "sucesso", texto: "Conexão validada com sucesso." });
    } catch (erro) {
      setConectado(false);
      setFeedback({
        tipo: "erro",
        texto: erro instanceof Error ? erro.message : "Não foi possível conectar à SULTS.",
      });
    } finally {
      setCarregando(null);
    }
  };

  const buscarPessoa = async () => {
    if (!token.trim()) {
      setFeedback({ tipo: "erro", texto: "Informe o token antes de buscar o ID." });
      return;
    }
    setCarregando("pessoa");
    setFeedback(null);
    try {
      const pessoa = await buscarPessoaSults(token, config.login);
      setConfig((atual) => ({ ...atual, pessoaId: pessoa.id, pessoaNome: pessoa.nome }));
      setConectado(true);
      setFeedback({ tipo: "sucesso", texto: `${pessoa.nome} localizado com o ID ${pessoa.id}.` });
    } catch (erro) {
      setFeedback({
        tipo: "erro",
        texto: erro instanceof Error ? erro.message : "Não foi possível localizar a pessoa.",
      });
    } finally {
      setCarregando(null);
    }
  };

  const conferirChamados = async () => {
    if (!token.trim()) {
      setFeedback({ tipo: "erro", texto: "Informe o token antes de consultar chamados." });
      return;
    }
    setCarregando("chamados");
    setFeedback(null);
    try {
      const chamados = await listarChamadosNovos(token, config.pessoaId);
      setConectado(true);
      setFeedback({
        tipo: "info",
        texto: `${chamados.length} chamado(s) novo(s) encontrado(s)${config.pessoaId ? ` para o ID ${config.pessoaId}` : ""}.`,
      });
    } catch (erro) {
      setFeedback({
        tipo: "erro",
        texto: erro instanceof Error ? erro.message : "Não foi possível consultar os chamados.",
      });
    } finally {
      setCarregando(null);
    }
  };

  const salvar = (event: FormEvent) => {
    event.preventDefault();
    if (!config.login.trim() || !config.pessoaId || !config.mensagemPadrao.trim()) {
      setFeedback({ tipo: "erro", texto: "Preencha login, ID da pessoa e mensagem padrão." });
      return;
    }
    salvarConfiguracaoSults({ ...config, login: config.login.trim(), mensagemPadrao: config.mensagemPadrao.trim() });
    setFeedback({
      tipo: "sucesso",
      texto: "Configuração salva neste navegador. O token não foi armazenado.",
    });
  };

  return (
    <div className="page">
      <div className="page-header items-start">
        <div>
          <h1 className="page-title">Configurações</h1>
          <p className="page-subtitle">Conecte seu usuário e prepare a automação de chamados do SULTS.</p>
        </div>
        <span className={`badge flex items-center gap-1.5 ${conectado ? "badge-ok" : "bg-gray-100 text-gray-600"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${conectado ? "bg-green-500" : "bg-gray-400"}`} />
          {conectado ? "API conectada" : "Não verificada"}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form onSubmit={salvar} className="card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
              <Bot className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Integração SULTS</h2>
              <p className="text-xs text-gray-500">Credencial, identificação do analista e resposta padrão</p>
            </div>
          </div>

          <div className="space-y-6 p-6">
            <section>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">1</span>
                <h3 className="text-sm font-semibold text-gray-900">Validar acesso à API</h3>
              </div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">Token de acesso</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type={mostrarToken ? "text" : "password"}
                    value={token}
                    onChange={(event) => {
                      setToken(event.target.value);
                      setConectado(false);
                    }}
                    className="input pl-9 pr-10"
                    placeholder="Cole o token gerado no SULTS"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarToken((valor) => !valor)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={mostrarToken ? "Ocultar token" : "Mostrar token"}
                  >
                    {mostrarToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <button type="button" onClick={testar} disabled={carregando !== null} className="btn-secondary whitespace-nowrap">
                  {carregando === "conexao" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Testar conexão"}
                </button>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                <ShieldCheck className="h-3.5 w-3.5" /> O token permanece somente na memória desta aba.
              </p>
            </section>

            <section className="border-t border-gray-100 pt-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">2</span>
                <h3 className="text-sm font-semibold text-gray-900">Identificar o analista</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">Login ou nome no SULTS</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <UserRoundSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        value={config.login}
                        onChange={(event) => {
                          atualizar("login", event.target.value);
                          atualizar("pessoaNome", "");
                        }}
                        className="input pl-9"
                        placeholder="Ex.: Adriano Santana"
                      />
                    </div>
                    <button type="button" onClick={buscarPessoa} disabled={carregando !== null} className="btn-secondary" title="Buscar ID">
                      {carregando === "pessoa" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">ID da pessoa</label>
                  <input
                    type="number"
                    min="1"
                    value={config.pessoaId ?? ""}
                    onChange={(event) => atualizar("pessoaId", event.target.value ? Number(event.target.value) : null)}
                    className="input"
                    placeholder="Ex.: 42"
                  />
                </div>
              </div>
              {config.pessoaNome && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
                  <Check className="h-3.5 w-3.5" /> {config.pessoaNome} vinculado ao ID {config.pessoaId}
                </div>
              )}
            </section>

            <section className="border-t border-gray-100 pt-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">3</span>
                <h3 className="text-sm font-semibold text-gray-900">Definir resposta padrão</h3>
              </div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">Mensagem enviada ao receber um chamado novo</label>
              <div className="relative">
                <MessageSquareText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <textarea
                  value={config.mensagemPadrao}
                  onChange={(event) => atualizar("mensagemPadrao", event.target.value)}
                  className="input min-h-32 resize-y pl-9"
                  maxLength={2000}
                  placeholder="Digite a mensagem padrão..."
                />
                <span className="absolute bottom-2.5 right-3 text-[10px] text-gray-400">{config.mensagemPadrao.length}/2000</span>
              </div>
            </section>

            {feedback && (
              <div className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${
                feedback.tipo === "erro"
                  ? "bg-red-50 text-red-700"
                  : feedback.tipo === "sucesso"
                    ? "bg-green-50 text-green-700"
                    : "bg-blue-50 text-blue-700"
              }`}>
                {feedback.tipo === "erro" ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
                {feedback.texto}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
            <button type="button" onClick={conferirChamados} disabled={carregando !== null} className="btn-secondary flex items-center gap-2">
              {carregando === "chamados" ? <Loader2 className="h-4 w-4 animate-spin" /> : <TicketCheck className="h-4 w-4" />}
              Consultar chamados novos
            </button>
            <button type="submit" className="btn-primary">Salvar configuração</button>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">Status da integração</h2>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between gap-3"><span className="text-gray-500">Listar novos chamados</span><span className="badge badge-ok">Disponível</span></div>
              <div className="flex items-center justify-between gap-3"><span className="text-gray-500">Localizar ID</span><span className="badge badge-ok">Disponível</span></div>
              <div className="flex items-center justify-between gap-3"><span className="text-gray-500">Criar chamado</span><span className="badge badge-ok">Disponível</span></div>
              <div className="flex items-center justify-between gap-3"><span className="text-gray-500">Responder chamado</span><span className="badge badge-warn">Aguardando API</span></div>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900">
              <AlertCircle className="h-4 w-4" /> Sobre a resposta automática
            </div>
            <p className="text-xs leading-5 text-amber-800">
              O endpoint informado cria um novo chamado; ele não responde um chamado existente. A configuração está pronta, mas o envio automático deve permanecer desativado até a SULTS fornecer o endpoint de interação/resposta.
            </p>
          </div>

          <div className="card p-5">
            <h2 className="mb-2 text-sm font-semibold text-gray-900">Como o ID é encontrado?</h2>
            <p className="text-xs leading-5 text-gray-500">
              A busca consulta os chamados recentes e compara o nome informado com solicitantes, responsáveis e pessoas de apoio. Se o usuário ainda não aparecer em chamados, o ID pode ser digitado manualmente.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
