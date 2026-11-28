import { useEffect, useState } from 'react'

const VISION_BASE =
  (typeof window !== 'undefined' &&
    (window as unknown as { smartguardDesktop?: { visionUrl?: string } }).smartguardDesktop?.visionUrl) ||
  'http://127.0.0.1:8090'

interface RtspLivePreviewProps {
  cameraId: number
  cameraName: string
  connected: boolean
  className?: string
  refreshMs?: number
}

export function RtspLivePreview({
  cameraId,
  cameraName,
  connected,
  className = '',
  refreshMs = 450,
}: RtspLivePreviewProps) {
  const [src, setSrc] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!connected) {
      setSrc(null)
      setError(null)
      return
    }

    let cancelled = false
    let timer: number | undefined
    let objectUrl: string | null = null

    async function tick() {
      try {
        const res = await fetch(`${VISION_BASE}/streams/${cameraId}/snapshot?t=${Date.now()}`, {
          cache: 'no-store',
        })
        if (!res.ok) {
          throw new Error(
            res.status === 404
              ? 'Aguardando primeiro frame…'
              : `Preview HTTP ${res.status}`,
          )
        }
        const blob = await res.blob()
        if (cancelled) return
        const next = URL.createObjectURL(blob)
        if (objectUrl) URL.revokeObjectURL(objectUrl)
        objectUrl = next
        setSrc(next)
        setError(null)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Sem imagem')
        }
      } finally {
        if (!cancelled) {
          timer = window.setTimeout(() => void tick(), refreshMs)
        }
      }
    }

    void tick()

    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [cameraId, connected, refreshMs])

  if (!connected) {
    return (
      <div className={`flex aspect-video items-center justify-center bg-black/50 text-sm text-sg-muted ${className}`}>
        Stream parado — clique em Conectar agora
      </div>
    )
  }

  return (
    <div className={`relative aspect-video overflow-hidden bg-black ${className}`}>
      {src ? (
        <img src={src} alt={`Ao vivo — ${cameraName}`} className="h-full w-full object-contain" />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-sg-muted">
          {error ?? 'Carregando imagem…'}
        </div>
      )}
      <div className="pointer-events-none absolute left-3 top-3 rounded bg-sg-red/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
        Ao vivo
      </div>
      {error && src ? (
        <div className="absolute bottom-2 left-2 right-2 rounded bg-black/70 px-2 py-1 text-[10px] text-amber-200">
          {error}
        </div>
      ) : null}
    </div>
  )
}
