import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthContext } from "../../hooks/AuthContext";
import { supabase } from "../../lib/supabase";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute() {
  const { user, loading } = useAuthContext();
  const location = useLocation();
  const [verificando, setVerificando] = useState(true);
  const [primeiroAcesso, setPrimeiroAcesso] = useState(false);

  useEffect(() => {
    async function verificar() {
      if (!user) {
        setVerificando(false);
        return;
      }

      const { data } = await (supabase.from("usuarios") as any)
        .select("primeiro_acesso")
        .eq("id", user.id)
        .single();

      setPrimeiroAcesso(data?.primeiro_acesso === true);
      setVerificando(false);
    }
    if (!loading) verificar();
  }, [user, loading]);

  // Carregando sessão ou verificando primeiro acesso
  if (loading || verificando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
      </div>
    );
  }

  // Não autenticado → login
  if (!user) return <Navigate to="/login" replace />;

  // Primeiro acesso — redireciona para troca obrigatória
  // (exceto se já estiver na página de primeiro acesso)
  if (primeiroAcesso && location.pathname !== "/primeiro-acesso") {
    return <Navigate to="/primeiro-acesso" replace />;
  }

  return <Outlet />;
}
