import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { AlertsPage } from './pages/AlertsPage'
import { CameraDetailPage } from './pages/CameraDetailPage'
import { CamerasPage } from './pages/CamerasPage'
import { DashboardPage } from './pages/DashboardPage'
import { HistoryPage } from './pages/HistoryPage'
import { MonitoringPage } from './pages/MonitoringPage'
import { PlaceholderPage } from './pages/PlaceholderPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="monitoramento" element={<MonitoringPage />} />
          <Route path="monitoramento/:id" element={<CameraDetailPage />} />
          <Route path="alertas" element={<AlertsPage />} />
          <Route path="historico" element={<HistoryPage />} />
          <Route path="cameras" element={<CamerasPage />} />
          <Route
            path="configuracoes"
            element={
              <PlaceholderPage
                title="Configurações"
                description="Loja, usuários, permissões e áreas de monitoramento."
                phase="Fase 4"
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
