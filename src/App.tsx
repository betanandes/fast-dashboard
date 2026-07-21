import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./hooks/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { useTheme } from "./hooks/useTheme";
import { ThemeContext } from "./hooks/ThemeContext";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import VencimentosPage from "./pages/VencimentosPage";
import FornecedoresPage from "./pages/FornecedoresPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PrimeiroAcessoPage from "./pages/PrimeiroAcessoPage";
import ConfiguracoesPage from "./pages/ConfiguracoesPage";
import LicencasPage from "./pages/LicencasPage";
import SoftwaresPage from "./pages/SoftwaresPage";
import MaquinasPage from "./pages/MaquinasPage";
import PlantaoPage from "./pages/PlantaoPage";
import ProvedoresPage from "./pages/ProvedoresPage";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";

function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export default function App() {
  const theme = useTheme();
  return (
    <ThemeContext.Provider value={theme}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/primeiro-acesso" element={<PrimeiroAcessoPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/vencimentos" element={<VencimentosPage />} />
              <Route path="/fornecedores" element={<FornecedoresPage />} />
              <Route path="/licencas" element={<LicencasPage />} />
              <Route path="/softwares" element={<SoftwaresPage />} />
              <Route path="/maquinas" element={<MaquinasPage />} />
              <Route path="/plantao" element={<PlantaoPage />} />
              <Route path="/provedores" element={<ProvedoresPage />} />
              <Route path="/importar" element={<Navigate to="/licencas" replace />} />
              <Route path="/planilhas" element={<Navigate to="/licencas" replace />} />
              <Route path="/configuracoes" element={<ConfiguracoesPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeContext.Provider>
  );
}
