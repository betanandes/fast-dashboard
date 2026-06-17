import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarClock,
  Upload,
  Building2,
  LogOut,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  User,
} from "lucide-react";
import { useAuthContext } from "../../hooks/AuthContext";
import { useSidebar } from "../../hooks/useSidebar";
import { supabase } from "../../lib/supabase";
import { useEffect, useState } from "react";

const NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Visão geral" },
  { to: "/vencimentos", icon: CalendarClock, label: "Vencimentos" },
  { to: "/fornecedores", icon: Building2, label: "Fornecedores" },
  { to: "/importar", icon: Upload, label: "Importar Excel" },
];

export default function AppLayout() {
  const { user, signOut } = useAuthContext();
  const { collapsed, toggle: toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<{ nome: string; role: string } | null>(
    null,
  );

  useEffect(() => {
    if (!user) return;
    supabase
      .from("usuarios")
      .select("nome, role")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setPerfil(data);
      });
  }, [user]);

  const nomeExibido = perfil?.nome || user?.email?.split("@")[0] || "Usuário";
  const isAdmin = perfil?.role === "admin";
  const iniciais = nomeExibido.slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`
        flex flex-col shrink-0 transition-all duration-300 ease-in-out
        bg-white border-r border-gray-200
        ${collapsed ? "w-16" : "w-56"}
      `}
      >
        {/* Logo */}
        <div
          className={`h-16 flex items-center border-b border-gray-200
          ${collapsed ? "justify-center" : "px-4 justify-between"}`}
        >
          {!collapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shrink-0">
                <svg
                  className="w-4 h-4 text-white"
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
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 leading-none truncate">
                  Fast TI
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                  Pagamentos
                </p>
              </div>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) => `
                flex items-center gap-3 rounded-lg text-sm transition-all duration-150
                ${collapsed ? "justify-center py-2.5 px-2" : "px-3 py-2.5"}
                ${
                  isActive
                    ? "bg-brand-50 text-brand-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 shrink-0 ${isActive ? "text-brand-600" : "text-gray-400"}`}
                  />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{label}</span>
                      {isActive && (
                        <ChevronRight className="w-3 h-3 text-brand-400 shrink-0" />
                      )}
                    </>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Usuário */}
        <div className="p-2 border-t border-gray-200">
          <div
            className={`flex items-center gap-2.5 px-2 py-2 rounded-lg ${collapsed ? "justify-center" : ""}`}
          >
            <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
              <span className="text-[10px] font-semibold text-brand-700">
                {iniciais}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">
                  {nomeExibido}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  {isAdmin ? (
                    <>
                      <Shield className="w-2.5 h-2.5 text-brand-500" />
                      <span className="text-[9px] text-brand-600 font-semibold uppercase">
                        Admin
                      </span>
                    </>
                  ) : (
                    <>
                      <User className="w-2.5 h-2.5 text-gray-400" />
                      <span className="text-[9px] text-gray-400 uppercase">
                        Usuário
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={async () => {
                  await signOut();
                  navigate("/login");
                }}
                className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
          {collapsed && (
            <button
              onClick={async () => {
                await signOut();
                navigate("/login");
              }}
              className="w-full flex justify-center mt-1 text-gray-400 hover:text-red-500 transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
