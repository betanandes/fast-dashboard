import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./hooks/AuthContext";
import { ThemeContext } from "./hooks/ThemeContext";
import { useAuth } from "./hooks/useAuth";
import { useTheme } from "./hooks/useTheme";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ImportarPage from "./pages/ImportarPage";
import VencimentosPage from "./pages/VencimentosPage";
import FornecedoresPage from "./pages/FornecedoresPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";

function Providers({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const theme = useTheme(); // ← único lugar que instancia o tema

  return (
    <AuthContext.Provider value={auth}>
      <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
    </AuthContext.Provider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Providers>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

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
      </Providers>
    </BrowserRouter>
  );
}
