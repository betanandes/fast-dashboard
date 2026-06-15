import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarClock,
  Upload,
  Building2,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { useAuthContext } from '../../hooks/AuthContext'

const NAV = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Visão geral' },
  { to: '/vencimentos',   icon: CalendarClock,   label: 'Vencimentos' },
  { to: '/fornecedores',  icon: Building2,       label: 'Fornecedores' },
  { to: '/importar',      icon: Upload,          label: 'Importar Excel' },
]

export default function AppLayout() {
  const { user, signOut } = useAuthContext()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  // Iniciais do usuário para avatar
  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'TI'

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col shrink-0">

        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-none">Fast TI</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Controle de pagamentos</p>
            </div>
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-gray-400'}`} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight className="w-3 h-3 text-brand-400" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Usuário + logout */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
            <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
              <span className="text-[10px] font-semibold text-brand-700">{initials}</span>
            </div>
            <p className="text-xs text-gray-600 truncate flex-1">{user?.email}</p>
            <button
              onClick={handleSignOut}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

    </div>
  )
}
