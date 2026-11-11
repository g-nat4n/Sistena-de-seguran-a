import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { PlaceholderPage } from './pages/PlaceholderPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route
            path="monitoramento"
            element={
              <PlaceholderPage
                title="Monitoramento"
                description="Visualização das câmeras simuladas da loja."
                phase="Fase 2"
              />
            }
          />
          <Route
            path="alertas"
            element={
              <PlaceholderPage
                title="Central de Alertas"
                description="Gestão de eventos comportamentais e prioridades."
                phase="Fase 2"
              />
            }
          />
          <Route
            path="historico"
            element={
              <PlaceholderPage
                title="Histórico de Ocorrências"
                description="Consulta e rastreamento de alterações de status."
                phase="Fase 2"
              />
            }
          />
          <Route
            path="cameras"
            element={
              <PlaceholderPage
                title="Gerenciamento de Câmeras"
                description="Cadastro manual de câmeras sem exigir RTSP no MVP."
                phase="Fase 2"
              />
            }
          />
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
