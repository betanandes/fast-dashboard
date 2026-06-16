import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle,
  Mail,
} from "lucide-react";
import { useAuthContext } from "../hooks/AuthContext";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const { signIn } = useAuthContext();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMsg, setResetMsg] = useState<{
    tipo: "sucesso" | "erro";
    texto: string;
  } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResetMsg(null);
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(
        "E-mail ou senha incorretos. Verifique os dados e tente novamente.",
      );
      setLoading(false);
      return;
    }

    navigate("/dashboard");
  }

  async function handleReset() {
    if (!email) {
      setResetMsg({
        tipo: "erro",
        texto: "Digite seu e-mail acima antes de solicitar a redefinição.",
      });
      return;
    }
    setLoadingReset(true);
    setResetMsg(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      const msg = (error as { message?: string }).message ?? "";
      const limite =
        msg.toLowerCase().includes("rate") ||
        msg.includes("429") ||
        msg.toLowerCase().includes("too many");
      setResetMsg({
        tipo: "erro",
        texto: limite
          ? "Limite de tentativas atingido. Aguarde 60 minutos e tente novamente."
          : "Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.",
      });
    } else {
      setResetMsg({
        tipo: "sucesso",
        texto: `E-mail de redefinição enviado para ${email}. Verifique sua caixa de entrada.`,
      });
    }
    setLoadingReset(false);
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
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard TI</h1>
          <p className="text-sm text-gray-500 mt-1">
            Fast Sistemas Construtivos
          </p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                E-mail corporativo
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setResetMsg(null);
                }}
                className="input"
                placeholder="seunome@fast.com.br"
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        {/* Esqueci minha senha */}
        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={loadingReset}
            className="w-full flex items-center justify-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium py-2 transition-colors disabled:opacity-50"
          >
            {loadingReset ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Mail className="w-3.5 h-3.5" />
            )}
            {loadingReset ? "Enviando..." : "Esqueci minha senha"}
          </button>

          {/* Feedback do reset — estilizado */}
          {resetMsg && (
            <div
              className={`flex items-start gap-2 p-3 rounded-lg border text-sm ${
                resetMsg.tipo === "sucesso"
                  ? "bg-green-50 border-green-100 text-green-700"
                  : "bg-red-50 border-red-100 text-red-700"
              }`}
            >
              {resetMsg.tipo === "sucesso" ? (
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              )}
              <p>{resetMsg.texto}</p>
            </div>
          )}

          <p className="text-center text-xs text-gray-400">
            Problemas de acesso? Fale com o TI.
          </p>
        </div>
      </div>
    </div>
  );
}
