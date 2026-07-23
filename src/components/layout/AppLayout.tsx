import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarClock,
  Building2,
  LogOut,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  User,
  Settings,
  BadgeCheck,
  AppWindow,
  MonitorCog,
  CalendarDays,
  Wifi,
  Moon,
  Sun,
  Tickets,
} from "lucide-react";
import { useAuthContext } from "../../hooks/AuthContext";
import { useSidebar } from "../../hooks/useSidebar";
import { supabase } from "../../lib/supabase";
import { useEffect, useState } from "react";
import { useThemeContext } from "../../hooks/ThemeContext";

const NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Visão geral" },
  { to: "/vencimentos", icon: CalendarClock, label: "Vencimentos" },
  { to: "/fornecedores", icon: Building2, label: "Fornecedores" },
  { to: "/licencas", icon: BadgeCheck, label: "Licenças" },
  { to: "/softwares", icon: AppWindow, label: "Softwares" },
  { to: "/maquinas", icon: MonitorCog, label: "Máquinas" },
  { to: "/provedores", icon: Wifi, label: "Provedores" },
  { to: "/chamados", icon: Tickets, label: "Chamados TI" },
  { to: "/plantao", icon: CalendarDays, label: "Plantão" },
  { to: "/configuracoes", icon: Settings, label: "Configurações" },
];

const ROTAS_TI = new Set([
  "/licencas",
  "/softwares",
  "/maquinas",
  "/provedores",
  "/chamados",
  "/plantao",
]);

export default function AppLayout() {
  const { user, signOut } = useAuthContext();
  const { collapsed, toggle: toggleSidebar } = useSidebar();
  const { dark, toggle: toggleTheme } = useThemeContext();
  const navigate = useNavigate();
  const location = useLocation();
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

  // Iniciais: primeira letra do nome + primeira letra do sobrenome
  function getIniciais(nome: string) {
    const partes = nome.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  // Cor do avatar baseada no nome — determinística (sempre a mesma para o mesmo usuário)
  const CORES_AVATAR = [
    { bg: "bg-blue-100", text: "text-blue-700" },
    { bg: "bg-violet-100", text: "text-violet-700" },
    { bg: "bg-emerald-100", text: "text-emerald-700" },
    { bg: "bg-rose-100", text: "text-rose-700" },
    { bg: "bg-amber-100", text: "text-amber-700" },
    { bg: "bg-cyan-100", text: "text-cyan-700" },
    { bg: "bg-pink-100", text: "text-pink-700" },
    { bg: "bg-indigo-100", text: "text-indigo-700" },
  ];
  const corIdx =
    nomeExibido.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    CORES_AVATAR.length;
  const corAvatar = CORES_AVATAR[corIdx];
  const iniciais = getIniciais(nomeExibido);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 transition-colors duration-200">
      {/* Sidebar */}
      <aside
        className={`
        relative z-30 flex shrink-0 flex-col border-r border-gray-200 bg-white
        transition-[width] duration-300 ease-in-out
        ${collapsed ? "w-[72px]" : "w-64"}
      `}
      >
        {/* Logo */}
        <div
          className={`relative flex h-16 shrink-0 items-center border-b border-gray-200 ${collapsed ? "justify-center px-3" : "justify-between px-4"}`}
        >
          {!collapsed ? (
            <img
              src={dark ? "/logo-white.svg" : "/logo.png"}
              alt="Fast Sistemas Construtivos"
              className="h-7 w-auto object-contain"
            />
          ) : (
            <img
              src="/favicon.png"
              alt="Fast"
              className="h-7 w-7 object-contain"
            />
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            className={`${collapsed ? "absolute -right-3 top-5 border border-gray-200 bg-white shadow-sm" : ""} flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700`}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) => `
                group relative flex min-h-10 items-center gap-3 rounded-xl text-sm transition-all duration-150
                ${collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}
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
                    className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-brand-600" : "text-gray-400 group-hover:text-gray-600"}`}
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
        <div className="border-t border-gray-200 p-3">
          <button
            type="button"
            onClick={toggleTheme}
            className={`mb-1 flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 ${collapsed ? "justify-center" : ""}`}
            title={dark ? "Usar tema claro" : "Usar tema escuro"}
            aria-label={dark ? "Usar tema claro" : "Usar tema escuro"}
          >
            {dark ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-gray-400" />
            )}
            {!collapsed && (
              <span className="flex-1 text-left">
                {dark ? "Tema claro" : "Tema escuro"}
              </span>
            )}
          </button>
          <div
            className={`flex items-center gap-2.5 rounded-xl px-2 py-2 ${collapsed ? "justify-center" : ""}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${corAvatar.bg}`}
            >
              <span className={`text-[10px] font-semibold ${corAvatar.text}`}>
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
              className="mt-1 flex min-h-9 w-full items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Conteúdo */}
      <main
        className={`flex-1 overflow-y-auto bg-gray-50 ${ROTAS_TI.has(location.pathname) ? "ti-workspace" : ""}`}
      >
        <Outlet />
      </main>
    </div>
  );
}
