import { useEffect, useState } from 'react'
import { CameraCard } from '../components/cameras/CameraCard'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { PageHeader } from '../components/ui/PageHeader'
import { Badge } from '../components/ui/Badge'
import { fetchCameras } from '../services/cameraService'
import type { Camera } from '../types/camera'

export function MonitoringPage() {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setCameras(await fetchCameras())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar câmeras')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  if (loading) return <LoadingState label="Carregando grade de monitoramento..." />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />

  const online = cameras.filter((c) => c.status === 'ONLINE').length

  return (
    <div>
      <PageHeader
        title="Monitoramento"
        description="Grade de câmeras fictícias com mídia demonstrativa. Não há conexão RTSP real nesta etapa."
        action={<Badge tone="green">{online}/{cameras.length} online</Badge>}
      />

      <div className="mb-4 rounded-xl border border-sg-blue/25 bg-sg-blue/5 px-4 py-3 text-sm text-sg-muted">
        Arquitetura preparada para streams RTSP/ONVIF no futuro. Agora você vê apenas simulação visual.
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cameras.map((camera) => (
          <CameraCard key={camera.id} camera={camera} />
        ))}
      </div>
    </div>
  )
}
