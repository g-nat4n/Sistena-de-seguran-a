import { MapPin, Radio } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Camera } from '../../types/camera'
import { Badge } from '../ui/Badge'
import { cameraTypeLabel, statusLabel, streamStateLabel } from '../../utils/labels'
import { RtspLivePreview } from './RtspLivePreview'

function statusTone(status: string) {
  if (status === 'ONLINE') return 'green' as const
  if (status === 'MAINTENANCE') return 'amber' as const
  return 'red' as const
}

function streamTone(state?: string | null) {
  if (state === 'CONNECTED') return 'green' as const
  if (state === 'ERROR') return 'red' as const
  if (state === 'CONNECTING' || state === 'RECONNECTING') return 'amber' as const
  return 'neutral' as const
}

export function CameraCard({ camera }: { camera: Camera }) {
  return (
    <article className="overflow-hidden rounded-xl border border-sg-border bg-sg-card/90 transition hover:border-sg-blue/40">
      <div className="relative aspect-video bg-black/40">
        {camera.streamState === 'CONNECTED' ? (
          <RtspLivePreview
            cameraId={camera.id}
            cameraName={camera.name}
            connected
            refreshMs={700}
            className="!aspect-auto h-full"
          />
        ) : camera.demoMediaUrl ? (
          <img
            src={camera.demoMediaUrl}
            alt={`Visualização demonstrativa — ${camera.name}`}
            className="h-full w-full object-cover opacity-90"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-sg-muted">Sem mídia demo</div>
        )}
        <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col gap-1">
          <Badge tone={statusTone(camera.status)}>
            <span className="mr-1 inline-flex">
              <Radio size={11} />
            </span>
            {statusLabel(camera.status)}
          </Badge>
          <Badge tone={streamTone(camera.streamState)}>
            {streamStateLabel(camera.streamState ?? 'IDLE')}
          </Badge>
        </div>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-3">
          <p className="font-display text-sm font-semibold text-white">{camera.name}</p>
          <p className="flex items-center gap-1 text-xs text-slate-300">
            <MapPin size={12} /> {camera.location}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 p-3">
        <div className="text-xs text-sg-muted">
          <p>{camera.identifier}</p>
          <p>
            {cameraTypeLabel(camera.type)} ·{' '}
            {camera.rtspConfigured ? 'RTSP configurado' : 'demo / sem RTSP'}
          </p>
        </div>
        <Link
          to={`/monitoramento/${camera.id}`}
          className="rounded-lg border border-sg-border px-3 py-1.5 text-xs text-sg-text transition hover:border-sg-blue hover:text-sg-blue"
        >
          Abrir
        </Link>
      </div>
    </article>
  )
}
