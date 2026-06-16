import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [tokenValido, setTokenValido] = useState(false);

  useEffect(() => {
    // O Supabase redireciona com o token no hash da URL
    // Ex: /reset-password#access_token=xxx&type=recovery
    const hash = window.location.hash;
    if (hash.includes("access_token") && hash.includes("type=recovery")) {
      setTokenValido(true);
    } else {
      setErro(
        "Link inválido ou expirado. Solicite um novo link de redefinição.",
      );
    }
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (senha.length < 6) {
      setErro("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (senha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: senha });

    if (error) {
      setErro(
        "Erro ao redefinir senha. Lembre-se: a nova senha não pode ser igual à anterior. Tente novamente ou solicite um novo link.",
      );
      setLoading(false);
      return;
    }

    setSucesso(true);
    setTimeout(() => navigate("/dashboard"), 2500);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-600 rounded-xl mb-4">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">
            Redefinir senha
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Fast Sistemas Construtivos
          </p>
        </div>

        <div className="card p-6">
          {sucesso ? (
            <div className="text-center py-4">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <p className="font-medium text-gray-900">
                Senha redefinida com sucesso!
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Redirecionando para o dashboard...
              </p>
            </div>
          ) : !tokenValido ? (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{erro}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    placeholder="Mínimo 6 caracteres"
                    required
                    disabled={loading}
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
                  Confirmar nova senha
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

              {erro && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700">{erro}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !senha || !confirmar}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Salvando..." : "Redefinir senha"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
