import { Navigate, Outlet } from 'react-router-dom'
import { useAuthContext } from '../../hooks/AuthContext'
import { Loader2 } from 'lucide-react'

export default function ProtectedRoute() {
  const { user, loading } = useAuthContext()

  // Enquanto verifica a sessão, exibe spinner (evita flash de redirect)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
      </div>
    )
  }

  // Não autenticado → vai para login
  if (!user) return <Navigate to="/login" replace />

  // Autenticado → renderiza a página filha
  return <Outlet />
}
