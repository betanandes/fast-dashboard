import { useCallback, useRef, useState } from "react";
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
import Turnstile, { type TurnstileHandle } from "../components/auth/Turnstile";

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
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
  const [captchaToken, setCaptchaToken] = useState("");
  const turnstile = useRef<TurnstileHandle | null>(null);
  const receberCaptcha = useCallback((token: string) => setCaptchaToken(token), []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResetMsg(null);
    setLoading(true);

    if (turnstileSiteKey && !captchaToken) {
      setError("Conclua a verificação de segurança para entrar.");
      setLoading(false);
      return;
    }
    const { error } = await signIn(email, password, captchaToken);

    if (error) {
      setError(
        "E-mail ou senha incorretos. Verifique os dados e tente novamente.",
      );
      setLoading(false);
      turnstile.current?.reset();
      return;
    }

    sessionStorage.removeItem("mfa_verificado");
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
    if (turnstileSiteKey && !captchaToken) {
      setResetMsg({ tipo: "erro", texto: "Conclua a verificação de segurança antes de redefinir a senha." });
      return;
    }
    setLoadingReset(true);
    setResetMsg(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
      captchaToken: captchaToken || undefined,
    });
    turnstile.current?.reset();

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
    // role="main" + id para o skip link funcionar
    <main
      id="main-content"
      className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
      // Garante que leitores de tela anunciem a página corretamente
    >
      <div className="w-full max-w-sm">
        {/* Cabeçalho — logo e título */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Fast Sistemas Construtivos"
            className="h-12 w-auto object-contain mx-auto mb-4"
          />
          {/* h1 visível para leitores de tela identificarem a página */}
          <h1 className="text-xl font-semibold text-gray-900">Dashboard TI</h1>
          <p className="text-sm text-gray-500 mt-1">
            Acesse com suas credenciais corporativas
          </p>
        </div>

        {/* Formulário de login */}
        <div className="card p-6">
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            noValidate
            aria-label="Formulário de acesso"
          >
            {/* Campo e-mail — label associado via htmlFor/id */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                E-mail corporativo
                <span aria-hidden="true" className="text-brand-600 ml-0.5">
                  *
                </span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setResetMsg(null);
                }}
                className="input"
                placeholder="seunome@cscempresarial.com.br"
                autoComplete="email"
                required
                aria-required="true"
                aria-invalid={error ? "true" : "false"}
                aria-describedby={error ? "login-error" : undefined}
                disabled={loading}
              />
            </div>

            {turnstileSiteKey && (
              <Turnstile siteKey={turnstileSiteKey} onToken={receberCaptcha} handle={turnstile} />
            )}

            {/* Campo senha */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Senha
                <span aria-hidden="true" className="text-brand-600 ml-0.5">
                  *
                </span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  aria-required="true"
                  aria-invalid={error ? "true" : "false"}
                  disabled={loading}
                />
                {/* Botão mostrar/ocultar com label descritivo para leitores de tela */}
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded"
                  aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={showPass}
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Mensagem de erro — aria-live para leitores de tela anunciarem */}
            {error && (
              <div
                id="login-error"
                role="alert"
                aria-live="assertive"
                className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg"
              >
                <AlertCircle
                  className="w-4 h-4 text-red-500 mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password || Boolean(turnstileSiteKey && !captchaToken)}
              className="btn-primary w-full"
              aria-busy={loading}
            >
              {loading && (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              )}
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
            className="w-full flex items-center justify-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium py-2 transition-colors disabled:opacity-50 rounded-lg"
            aria-busy={loadingReset}
          >
            {loadingReset ? (
              <Loader2
                className="w-3.5 h-3.5 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Mail className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            {loadingReset ? "Enviando..." : "Esqueci minha senha"}
          </button>

          {/* Feedback do reset — aria-live polite para não interromper o usuário */}
          {resetMsg && (
            <div
              role="status"
              aria-live="polite"
              className={`flex items-start gap-2 p-3 rounded-lg border text-sm ${
                resetMsg.tipo === "sucesso"
                  ? "bg-green-50 border-green-100 text-green-700"
                  : "bg-red-50 border-red-100 text-red-700"
              }`}
            >
              {resetMsg.tipo === "sucesso" ? (
                <CheckCircle
                  className="w-4 h-4 mt-0.5 shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <AlertCircle
                  className="w-4 h-4 mt-0.5 shrink-0"
                  aria-hidden="true"
                />
              )}
              <p>{resetMsg.texto}</p>
            </div>
          )}

          <p className="text-center text-xs text-gray-400">
            Problemas de acesso?{" "}
            <span aria-label="Entre em contato com o departamento de TI">
              Fale com o TI.
            </span>
          </p>
        </div>
      </div>
    </main>
  );
}
