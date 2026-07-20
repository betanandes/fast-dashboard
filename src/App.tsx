import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./hooks/AuthContext";
import { useAuth } from "./hooks/useAuth";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ImportarPage from "./pages/ImportarPage";
import VencimentosPage from "./pages/VencimentosPage";
import FornecedoresPage from "./pages/FornecedoresPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PrimeiroAcessoPage from "./pages/PrimeiroAcessoPage";
import ConfiguracoesPage from "./pages/ConfiguracoesPage";
import PlanilhasPage from "./pages/PlanilhasPage";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";

function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export default function App() {
  return (
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
              <Route path="/importar" element={<ImportarPage />} />
              <Route path="/planilhas" element={<PlanilhasPage />} />
              <Route path="/configuracoes" element={<ConfiguracoesPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
