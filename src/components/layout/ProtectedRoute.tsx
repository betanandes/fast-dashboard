import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthContext } from "../../hooks/AuthContext";
import { supabase } from "../../lib/supabase";
import { Loader2 } from "lucide-react";

const MFA_VERIFICADO_KEY = "mfa_verificado";

export default function ProtectedRoute() {
  const { user, loading } = useAuthContext();
  const location = useLocation();
  const [verificando, setVerificando] = useState(true);
  const [primeiroAcesso, setPrimeiroAcesso] = useState(false);
  const [role, setRole] = useState<string>("visualizador");

  useEffect(() => {
    async function verificar() {
      if (!user) {
        setVerificando(false);
        return;
      }

      const { data } = await (supabase.from("usuarios") as any)
        .select("primeiro_acesso, role")
        .eq("id", user.id)
        .single();

      setPrimeiroAcesso(data?.primeiro_acesso === true);
      setRole(data?.role ?? "visualizador");
      setVerificando(false);
    }
    if (!loading) verificar();
  }, [user, loading]);

  if (loading || verificando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Primeiro acesso — troca de senha obrigatória
  if (primeiroAcesso && location.pathname !== "/primeiro-acesso") {
    return <Navigate to="/primeiro-acesso" replace />;
  }

  // MFA por e-mail — verifica se já confirmou nesta sessão
  const mfaVerificado = sessionStorage.getItem(MFA_VERIFICADO_KEY) === user.id;
  const rotasPublicas = ["/mfa-verify", "/primeiro-acesso"];
  if (!mfaVerificado && !rotasPublicas.includes(location.pathname)) {
    return <Navigate to="/mfa-verify" replace />;
  }

  // Bloqueia /importar para quem não é admin
  if (location.pathname === "/importar" && role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
