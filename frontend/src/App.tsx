import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import { AppLayout } from './layouts/AppLayout'
import { AlertsPage } from './pages/AlertsPage'
import { CameraDetailPage } from './pages/CameraDetailPage'
import { CamerasPage } from './pages/CamerasPage'
import { DashboardPage } from './pages/DashboardPage'
import { HistoryPage } from './pages/HistoryPage'
import { LoginPage } from './pages/LoginPage'
import { MonitoringPage } from './pages/MonitoringPage'
import { DesktopSetupPage } from './pages/DesktopSetupPage'
import { ServerStatusPage } from './pages/ServerStatusPage'
import { SettingsPage } from './pages/SettingsPage'
import { SimulatorPage } from './pages/SimulatorPage'

export default function App() {
  const isDesktop =
    typeof window !== 'undefined' &&
    (Boolean((window as unknown as { smartguardDesktop?: unknown }).smartguardDesktop) ||
      window.location.protocol === 'file:')
  const Router = isDesktop ? HashRouter : BrowserRouter

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="monitoramento" element={<MonitoringPage />} />
              <Route path="monitoramento/:id" element={<CameraDetailPage />} />
              <Route path="alertas" element={<AlertsPage />} />
              <Route path="historico" element={<HistoryPage />} />
              <Route path="cameras" element={<CamerasPage />} />
              <Route path="simulador" element={<SimulatorPage />} />
              <Route path="configuracoes" element={<SettingsPage />} />
              <Route path="servidor" element={<ServerStatusPage />} />
              <Route path="app-setup" element={<DesktopSetupPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}
