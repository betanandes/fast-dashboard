import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./hooks/AuthContext";
import { useAuth } from "./hooks/useAuth";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import ImportarPage from "./pages/ImportarPage";

function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Pública */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route
                path="/vencimentos"
                element={
                  <div className="p-8 text-sm text-gray-500">
                    Sprint 2 — Vencimentos
                  </div>
                }
              />
              <Route
                path="/fornecedores"
                element={
                  <div className="p-8 text-sm text-gray-500">
                    Sprint 4 — Fornecedores
                  </div>
                }
              />
              <Route path="/importar" element={<ImportarPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
