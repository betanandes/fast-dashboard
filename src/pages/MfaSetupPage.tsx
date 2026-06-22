import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { setupMfa, verifyMfa } from "../services/mfa";
import { QRCodeSVG } from "qrcode.react";
import { useAuthContext } from "../hooks/AuthContext";

export default function MfaSetupPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [etapa, setEtapa] = useState<
    "carregando" | "qrcode" | "sucesso" | "erro"
  >("carregando");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string>("");
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function carregar() {
      try {
        const { secret: s, otpauth_uri } = await setupMfa();
        setSecret(s);

        // Gera QR code localmente — sem API externa
        setQrUrl(otpauth_uri);
        setEtapa("qrcode");
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro ao configurar MFA");
        setEtapa("erro");
      }
    }
    carregar();
  }, []);

  async function handleVerificar() {
    if (codigo.length !== 6) {
      setErro("Digite os 6 dígitos do código.");
      return;
    }
    setErro(null);
    setLoading(true);
    try {
      await verifyMfa(codigo, true);
      // Marca como verificado nesta sessão para não pedir código novamente
      if (user) sessionStorage.setItem("mfa_verificado", user.id);
      setEtapa("sucesso");
      setTimeout(() => navigate("/dashboard"), 2500);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Código inválido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600 rounded-2xl mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Configurar autenticação
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Adicione uma camada extra de segurança à sua conta.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {etapa === "carregando" && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Gerando QR code...</p>
            </div>
          )}

          {etapa === "qrcode" && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-sm font-medium text-blue-800 mb-2">
                  Como configurar:
                </p>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>
                    Abra o <strong>Microsoft Authenticator</strong> ou{" "}
                    <strong>Google Authenticator</strong>
                  </li>
                  <li>
                    Toque em <strong>"Adicionar conta"</strong>
                  </li>
                  <li>
                    Escolha <strong>"Escanear QR code"</strong>
                  </li>
                  <li>Aponte a câmera para o código abaixo</li>
                  <li>Digite o código de 6 dígitos gerado</li>
                </ol>
              </div>

              {qrUrl && (
                <div className="flex flex-col items-center gap-3">
                  <div className="border-4 border-white shadow-lg rounded-xl p-4 bg-white inline-block">
                    <QRCodeSVG value={qrUrl} size={180} level="M" />
                  </div>
                  <p className="text-xs text-gray-400 text-center">
                    Não consegue escanear? Digite o código manualmente no app:
                  </p>
                  <div className="bg-gray-100 rounded-lg px-4 py-2 w-full text-center">
                    <code className="text-xs font-mono text-gray-700 break-all">
                      {secret}
                    </code>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                  className="input text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1 text-center">
                  O código muda a cada 30 segundos
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
                {loading ? "Verificando..." : "Confirmar e ativar 2FA"}
              </button>
            </div>
          )}

          {etapa === "sucesso" && (
            <div className="text-center py-6">
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                2FA ativado com sucesso!
              </h2>
              <p className="text-sm text-gray-500">
                A partir de agora, todo login exigirá o código do seu
                autenticador.
              </p>
              <p className="text-xs text-gray-400 mt-3">Redirecionando...</p>
            </div>
          )}

          {etapa === "erro" && (
            <div className="text-center py-6">
              <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Erro ao configurar
              </h2>
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4">
                {erro}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="btn-secondary flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" /> Tentar novamente
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Dúvidas? Entre em contato com o TI.
        </p>
      </div>
    </div>
  );
}
