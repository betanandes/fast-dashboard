import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Clipboard,
  KeyRound,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  UserCog,
  Users,
} from "lucide-react";
import CrudModal from "../components/ui/CrudModal";
import {
  cadastrarUsuario,
  listarUsuarios,
  type NovoUsuario,
  type PerfilUsuario,
  type UsuarioEquipe,
} from "../services/usuarios";

const PERFIS: Record<
  PerfilUsuario,
  { label: string; descricao: string; classe: string }
> = {
  admin: {
    label: "Administrador",
    descricao: "Acesso total, inclusive gestão de usuários.",
    classe: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
  },
  gestor: {
    label: "Gestor",
    descricao: "Pode consultar e alterar os cadastros operacionais.",
    classe: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
  },
  visualizador: {
    label: "Visualizador",
    descricao: "Acesso somente para consulta.",
    classe: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  },
};

function iniciais(nome: string) {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioEquipe[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState("");
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState<NovoUsuario | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState("");
  const [credencial, setCredencial] = useState<{
    nome: string;
    email: string;
    senha: string;
  } | null>(null);
  const [copiado, setCopiado] = useState(false);

  const carregar = async () => {
    setCarregando(true);
    setErroLista("");
    try {
      setUsuarios(await listarUsuarios());
    } catch (error) {
      setErroLista(error instanceof Error ? error.message : "Não foi possível carregar os usuários.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    listarUsuarios()
      .then(setUsuarios)
      .catch((error) => {
        setErroLista(error instanceof Error ? error.message : "Não foi possível carregar os usuários.");
      })
      .finally(() => setCarregando(false));
  }, []);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    if (!termo) return usuarios;
    return usuarios.filter((usuario) =>
      `${usuario.nome} ${usuario.email} ${PERFIS[usuario.role].label}`
        .toLocaleLowerCase("pt-BR")
        .includes(termo),
    );
  }, [busca, usuarios]);

  const abrirCadastro = () => {
    setErroForm("");
    setForm({ nome: "", email: "", role: "visualizador" });
  };

  const salvar = async () => {
    if (!form) return;
    if (!form.nome.trim() || !form.email.trim()) {
      setErroForm("Preencha o nome e o e-mail do colaborador.");
      return;
    }
    setSalvando(true);
    setErroForm("");
    try {
      const resultado = await cadastrarUsuario({
        nome: form.nome.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
      });
      setForm(null);
      setCredencial({
        nome: resultado.usuario.nome,
        email: resultado.usuario.email,
        senha: resultado.senha_temporaria,
      });
      await carregar();
    } catch (error) {
      setErroForm(error instanceof Error ? error.message : "Não foi possível cadastrar o colaborador.");
    } finally {
      setSalvando(false);
    }
  };

  const copiarCredencial = async () => {
    if (!credencial) return;
    await navigator.clipboard.writeText(
      `Acesso Fast Dashboard\nE-mail: ${credencial.email}\nSenha temporária: ${credencial.senha}`,
    );
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 2000);
  };

  const administradores = usuarios.filter((usuario) => usuario.role === "admin").length;
  const pendentes = usuarios.filter((usuario) => usuario.primeiro_acesso).length;

  return (
    <div className="page">
      <div className="page-header gap-4">
        <div>
          <h1 className="page-title">Usuários e acessos</h1>
          <p className="page-subtitle">
            Cadastre colaboradores e defina o nível de acesso ao dashboard.
          </p>
        </div>
        <button type="button" onClick={abrirCadastro} className="btn-primary">
          <Plus className="h-4 w-4" />
          Novo colaborador
        </button>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Colaboradores", valor: usuarios.length, icon: Users, cor: "bg-blue-50 text-blue-600" },
          { label: "Administradores", valor: administradores, icon: ShieldCheck, cor: "bg-red-50 text-red-600" },
          { label: "Primeiro acesso", valor: pendentes, icon: KeyRound, cor: "bg-amber-50 text-amber-600" },
        ].map(({ label, valor, icon: Icon, cor }) => (
          <div key={label} className="card flex items-center gap-4 p-4">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${cor}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">{valor}</p>
            </div>
          </div>
        ))}
      </div>

      {credencial && (
        <section className="mb-5 overflow-hidden rounded-2xl border border-green-200 bg-green-50 dark:border-green-900/60 dark:bg-green-950/20">
          <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white">
              <UserCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-green-900 dark:text-green-200">
                Colaborador cadastrado
              </h2>
              <p className="mt-1 text-xs leading-5 text-green-700 dark:text-green-300">
                Compartilhe a senha temporária de forma segura. Ela deverá ser alterada no primeiro acesso.
              </p>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-green-900 dark:text-green-100">
                <span>{credencial.email}</span>
                <span>{credencial.senha}</span>
              </div>
            </div>
            <button type="button" onClick={() => void copiarCredencial()} className="btn-secondary shrink-0">
              {copiado ? <Check className="h-4 w-4 text-green-600" /> : <Clipboard className="h-4 w-4" />}
              {copiado ? "Copiado" : "Copiar acesso"}
            </button>
          </div>
        </section>
      )}

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Equipe cadastrada</h2>
            <p className="mt-1 text-xs text-gray-500">{filtrados.length} resultado(s)</p>
          </div>
          <label className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              className="input pl-9"
              placeholder="Buscar nome, e-mail ou perfil..."
            />
          </label>
        </div>

        {erroLista && (
          <p className="border-b border-red-100 bg-red-50 px-5 py-3 text-xs text-red-700">
            {erroLista}
          </p>
        )}

        {carregando ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando colaboradores...
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtrados.map((usuario) => (
              <article
                key={usuario.id}
                className="grid items-center gap-4 px-5 py-4 hover:bg-gray-50 md:grid-cols-[minmax(240px,1fr)_180px_160px]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xs font-semibold text-brand-700">
                    {iniciais(usuario.nome)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{usuario.nome}</p>
                    <p className="mt-0.5 truncate text-xs text-gray-500">{usuario.email}</p>
                  </div>
                </div>
                <div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${PERFIS[usuario.role].classe}`}>
                    {PERFIS[usuario.role].label}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {usuario.primeiro_acesso ? (
                    <>
                      <KeyRound className="h-3.5 w-3.5 text-amber-500" />
                      Aguardando acesso
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-3.5 w-3.5 text-green-500" />
                      Acesso concluído
                    </>
                  )}
                </div>
              </article>
            ))}
            {!filtrados.length && (
              <div className="p-12 text-center">
                <UserCog className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-3 text-sm text-gray-500">Nenhum colaborador encontrado.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {form && (
        <CrudModal
          titulo="Novo colaborador"
          descricao="O colaborador receberá uma senha temporária para o primeiro acesso."
          salvando={salvando}
          erro={erroForm}
          onClose={() => setForm(null)}
          onSave={() => void salvar()}
        >
          <div className="space-y-4">
            <label>
              <span className="mb-1.5 block text-xs font-medium text-gray-600">Nome completo *</span>
              <input
                autoFocus
                className="input"
                value={form.nome}
                onChange={(event) => setForm({ ...form, nome: event.target.value })}
                placeholder="Ex.: Maria da Silva"
              />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-medium text-gray-600">E-mail corporativo *</span>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="nome@cscempresarial.com.br"
              />
            </label>
            <fieldset>
              <legend className="mb-2 text-xs font-medium text-gray-600">Perfil de acesso</legend>
              <div className="grid gap-2">
                {(Object.entries(PERFIS) as [PerfilUsuario, (typeof PERFIS)[PerfilUsuario]][]).map(
                  ([valor, perfil]) => (
                    <label
                      key={valor}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                        form.role === valor
                          ? "border-brand-300 bg-brand-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={valor}
                        checked={form.role === valor}
                        onChange={() => setForm({ ...form, role: valor })}
                        className="mt-0.5 h-4 w-4 accent-brand-600"
                      />
                      <span>
                        <span className="block text-sm font-medium text-gray-900">{perfil.label}</span>
                        <span className="mt-0.5 block text-xs leading-5 text-gray-500">{perfil.descricao}</span>
                      </span>
                    </label>
                  ),
                )}
              </div>
            </fieldset>
          </div>
        </CrudModal>
      )}
    </div>
  );
}
