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
import MfaSetupPage from "./pages/MfaSetupPage";
import MfaVerifyPage from "./pages/MfaVerifyPage";
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
          {/* Públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Requerem autenticação mas sem layout */}
          <Route element={<ProtectedRoute />}>
            <Route path="/primeiro-acesso" element={<PrimeiroAcessoPage />} />
            <Route path="/mfa-verify" element={<MfaVerifyPage />} />
            <Route path="/mfa-setup" element={<MfaSetupPage />} />
          </Route>

          {/* Protegidas com layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/vencimentos" element={<VencimentosPage />} />
              <Route path="/fornecedores" element={<FornecedoresPage />} />
              <Route path="/importar" element={<ImportarPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
