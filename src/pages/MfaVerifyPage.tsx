import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  AlertCircle,
  Loader2,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { enviarCodigoEmail, verificarCodigoEmail } from "../services/mfa";
import { useAuthContext } from "../hooks/AuthContext";

const MFA_VERIFICADO_KEY = "mfa_verificado";

export default function MfaVerifyPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [emailDestino, setEmailDestino] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Envia o código automaticamente ao entrar na tela
  useEffect(() => {
    handleEnviar();
  }, []);

  // Countdown para reenvio
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function handleEnviar() {
    setEnviando(true);
    setErro(null);
    try {
      const { email } = await enviarCodigoEmail();
      setEmailDestino(email);
      setEmailEnviado(true);
      setCountdown(60); // aguarda 60s para reenviar
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao enviar código");
    } finally {
      setEnviando(false);
    }
  }

  async function handleVerificar() {
    if (codigo.length !== 6) {
      setErro("Digite os 6 dígitos do código.");
      return;
    }
    setErro(null);
    setLoading(true);
    try {
      await verificarCodigoEmail(codigo);
      if (user) sessionStorage.setItem(MFA_VERIFICADO_KEY, user.id);
      navigate("/dashboard");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Código inválido ou expirado");
      setCodigo("");
    } finally {
      setLoading(false);
    }
  }

  // Mascara o e-mail: roberta.fernandes@empresa.com → r***a@empresa.com
  function mascaraEmail(email: string): string {
    const [local, domain] = email.split("@");
    if (local.length <= 2) return email;
    return `${local[0]}${"*".repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600 rounded-2xl mb-4">
            <Mail className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">
            Verificação de acesso
          </h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            {enviando ? (
              "Enviando código..."
            ) : emailEnviado ? (
              <>
                Enviamos um código para{" "}
                <strong>{mascaraEmail(emailDestino)}</strong>
              </>
            ) : (
              "Preparando verificação..."
            )}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-5">
          {enviando && !emailEnviado ? (
            <div className="text-center py-6">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                Enviando código para seu e-mail...
              </p>
            </div>
          ) : (
            <>
              {emailEnviado && (
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-100 rounded-xl">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-green-700">
                    Código enviado! Verifique sua caixa de entrada. Expira em 10
                    minutos.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 text-center">
                  Código de verificação
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={codigo}
                  onChange={(e) => {
                    setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setErro(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleVerificar()}
                  className="input text-center text-3xl tracking-[0.5em] font-mono py-4"
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Digite o código de 6 dígitos recebido no e-mail
                </p>
              </div>

              {erro && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700">{erro}</p>
                </div>
              )}

              <button
                onClick={handleVerificar}
                disabled={loading || codigo.length !== 6}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Verificando..." : "Verificar e entrar"}
              </button>

              {/* Reenviar código */}
              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-xs text-gray-400">
                    Reenviar em {countdown}s
                  </p>
                ) : (
                  <button
                    onClick={handleEnviar}
                    disabled={enviando}
                    className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 mx-auto transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reenviar código
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Problemas? Entre em contato com o TI.
        </p>
      </div>
    </div>
  );
}
