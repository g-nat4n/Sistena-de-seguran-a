import { ArrowLeft, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { PageHeader } from '../components/ui/PageHeader'
import { fetchCameraById } from '../services/cameraService'
import type { Camera } from '../types/camera'
import { cameraTypeLabel, formatDateTime, statusLabel } from '../utils/labels'

export function CameraDetailPage() {
  const { id } = useParams()
  const [camera, setCamera] = useState<Camera | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!id) return
      setLoading(true)
      setError(null)
      try {
        setCamera(await fetchCameraById(Number(id)))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Câmera não encontrada')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [id])

  if (loading) return <LoadingState />
  if (error || !camera) return <ErrorState message={error ?? 'Câmera não encontrada'} />

  return (
    <div>
      <Link to="/monitoramento" className="mb-4 inline-flex items-center gap-2 text-sm text-sg-muted hover:text-sg-blue">
        <ArrowLeft size={16} /> Voltar ao monitoramento
      </Link>

      <PageHeader
        title={camera.name}
        description={camera.description || 'Visualização individual da câmera simulada.'}
        action={<Badge tone={camera.status === 'ONLINE' ? 'green' : 'red'}>{statusLabel(camera.status)}</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="overflow-hidden rounded-xl border border-sg-border bg-sg-card">
          {camera.demoMediaUrl ? (
            <img
              src={camera.demoMediaUrl}
              alt={`Demo ${camera.name}`}
              className="aspect-video w-full object-cover"
            />
          ) : (
            <div className="flex aspect-video items-center justify-center text-sg-muted">Sem mídia</div>
          )}
          <div className="border-t border-sg-border px-4 py-3 text-xs text-sg-muted">
            Fonte demonstrativa · stream RTSP não conectado · atualizado em {formatDateTime(camera.updatedAt)}
          </div>
        </div>

        <aside className="space-y-3 rounded-xl border border-sg-border bg-sg-card p-4">
          <Info label="Identificação" value={camera.identifier} />
          <Info label="Localização" value={camera.location} icon />
          <Info label="Tipo" value={cameraTypeLabel(camera.type)} />
          <Info label="RTSP configurado" value={camera.rtspConfigured ? 'Sim' : 'Não (MVP)'} />
          <p className="rounded-lg border border-dashed border-sg-border p-3 text-xs text-sg-muted">
            Campo RTSP existe no modelo de dados para integração futura com DVR/NVR/IP. Não é exigido nem simulado
            como conexão real neste MVP.
          </p>
        </aside>
      </div>
    </div>
  )
}

function Info({ label, value, icon }: { label: string; value: string; icon?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-sg-muted">{label}</p>
      <p className="mt-1 flex items-center gap-1 text-sm text-sg-text">
        {icon ? <MapPin size={14} className="text-sg-blue" /> : null}
        {value}
      </p>
    </div>
  )
}
