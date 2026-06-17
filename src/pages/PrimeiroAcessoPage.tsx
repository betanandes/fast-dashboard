import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle,
  Lock,
} from "lucide-react";
import { supabase } from "../lib/supabase";

export default function PrimeiroAcessoPage() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (senha.length < 8) {
      setErro("A senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (senha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    // 1. Atualiza a senha no Supabase Auth
    const { error: errSenha } = await supabase.auth.updateUser({
      password: senha,
    });
    if (errSenha) {
      setErro(
        "Erro ao redefinir senha. Lembre-se: a nova senha não pode ser igual à anterior.",
      );
      setLoading(false);
      return;
    }

    // 2. Marca primeiro_acesso como false na tabela usuarios
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await (supabase.from("usuarios") as any)
        .update({ primeiro_acesso: false })
        .eq("id", user.id);
    }

    setSucesso(true);
    setTimeout(() => navigate("/dashboard"), 2000);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600 rounded-2xl mb-4">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Bem-vindo!</h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            Este é seu primeiro acesso. Por segurança, crie uma senha pessoal
            antes de continuar.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {sucesso ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-semibold text-gray-900 text-lg">
                Senha criada com sucesso!
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Redirecionando para o dashboard...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Requisitos */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <p className="text-xs font-medium text-blue-700 mb-1">
                  Requisitos da senha:
                </p>
                <ul className="text-xs text-blue-600 space-y-0.5">
                  <li className={senha.length >= 8 ? "text-green-600" : ""}>
                    {senha.length >= 8 ? "✓" : "•"} Mínimo 8 caracteres
                  </li>
                  <li className={/[A-Z]/.test(senha) ? "text-green-600" : ""}>
                    {/[A-Z]/.test(senha) ? "✓" : "•"} Uma letra maiúscula
                  </li>
                  <li className={/[0-9]/.test(senha) ? "text-green-600" : ""}>
                    {/[0-9]/.test(senha) ? "✓" : "•"} Um número
                  </li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nova senha
                </label>
                <div className="relative">
                  <input
                    type={showSenha ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="input pr-10"
                    placeholder="Crie uma senha segura"
                    required
                    disabled={loading}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showSenha ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirmar senha
                </label>
                <div className="relative">
                  <input
                    type={showSenha ? "text" : "password"}
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    className="input pr-10"
                    placeholder="Repita a senha"
                    required
                    disabled={loading}
                  />
                  {confirmar && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      {senha === confirmar ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                    </span>
                  )}
                </div>
              </div>

              {erro && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700">{erro}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !senha || !confirmar}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Salvando..." : "Criar minha senha e entrar"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Dúvidas? Entre em contato com o TI.
        </p>
      </div>
    </div>
  );
}
