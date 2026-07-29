import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./hooks/AuthContext";
import { ThemeContext } from "./hooks/ThemeContext";
import { useAuth } from "./hooks/useAuth";
import { useTheme } from "./hooks/useTheme";
import A11yPanel from "./components/ui/A11yPanel";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import VencimentosPage from "./pages/VencimentosPage";
import FornecedoresPage from "./pages/FornecedoresPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PrimeiroAcessoPage from "./pages/PrimeiroAcessoPage";
import ConfiguracoesPage from "./pages/ConfiguracoesPage";
import LicencasPage from "./pages/LicencasPage";
import SoftwaresPage from "./pages/SoftwaresPage";
import PlantaoPage from "./pages/PlantaoPage";
import ProvedoresPage from "./pages/ProvedoresPage";
import ChamadosPage from "./pages/ChamadosPage";
import GamificacaoPage from "./pages/GamificacaoPage";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";

export default function App() {
  const auth = useAuth();
  const theme = useTheme();

  return (
    <ThemeContext.Provider value={theme}>
      <AuthContext.Provider value={auth}>
        <BrowserRouter>
          <Routes>
            {/* Públicas */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Autenticadas sem layout */}
            <Route element={<ProtectedRoute />}>
              <Route path="/primeiro-acesso" element={<PrimeiroAcessoPage />} />
            </Route>

            {/* Autenticadas com layout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/vencimentos" element={<VencimentosPage />} />
                <Route path="/fornecedores" element={<FornecedoresPage />} />
                <Route path="/licencas" element={<LicencasPage />} />
                <Route path="/softwares" element={<SoftwaresPage />} />
                <Route path="/maquinas" element={<Navigate to="/dashboard" replace />} />
                <Route path="/plantao" element={<PlantaoPage />} />
                <Route path="/provedores" element={<ProvedoresPage />} />
                <Route path="/chamados" element={<ChamadosPage />} />
                <Route path="/gamificacao" element={<GamificacaoPage />} />
                <Route path="/configuracoes" element={<ConfiguracoesPage />} />
                <Route
                  path="/importar"
                  element={<Navigate to="/licencas" replace />}
                />
                <Route
                  path="/planilhas"
                  element={<Navigate to="/licencas" replace />}
                />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>

          {/* Painel de acessibilidade flutuante */}
          <A11yPanel />
        </BrowserRouter>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}
