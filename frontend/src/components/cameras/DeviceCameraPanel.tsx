import { Activity, Camera, FlipHorizontal, Square, SwitchCamera } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useClipRecorder } from '../../hooks/useClipRecorder'
import { useDeviceCamera, type CameraFacing } from '../../hooks/useDeviceCamera'
import { useMotionDetection, type MotionAlertEvent } from '../../hooks/useMotionDetection'
import { uploadEvidence } from '../../services/evidenceService'
import { fetchStoreSettings } from '../../services/settingsService'
import { simulateEvent } from '../../services/simulationService'
import { Badge } from '../ui/Badge'
import { formatDateTime } from '../../utils/labels'

interface DeviceCameraPanelProps {
  linkedCameraId?: number
  linkedCameraName?: string
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime = /data:(.*?);base64/.exec(header)?.[1] ?? 'image/jpeg'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

function isAfterBusinessHours(start: string, end: string, now = new Date()): boolean {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const minutes = now.getHours() * 60 + now.getMinutes()
  const startMin = sh * 60 + sm
  const endMin = eh * 60 + em
  if (startMin === endMin) return false
  if (startMin < endMin) {
    return minutes < startMin || minutes >= endMin
  }
  // horário que atravessa meia-noite
  return minutes >= endMin && minutes < startMin
}

export function DeviceCameraPanel({ linkedCameraId, linkedCameraName }: DeviceCameraPanelProps) {
  const [facing, setFacing] = useState<CameraFacing>('environment')
  const [snapshot, setSnapshot] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [afterHours, setAfterHours] = useState(false)
  const camera = useDeviceCamera({ facingMode: facing })
  const { captureClip } = useClipRecorder({
    stream: camera.stream,
    enabled: camera.active,
  })

  useEffect(() => {
    void fetchStoreSettings()
      .then((settings) => {
        setAfterHours(isAfterBusinessHours(settings.businessHoursStart, settings.businessHoursEnd))
      })
      .catch(() => setAfterHours(false))

    const timer = window.setInterval(() => {
      void fetchStoreSettings()
        .then((settings) => {
          setAfterHours(isAfterBusinessHours(settings.businessHoursStart, settings.businessHoursEnd))
        })
        .catch(() => undefined)
    }, 60_000)

    return () => window.clearInterval(timer)
  }, [])

  const createAlertWithClip = useCallback(
    async (event: MotionAlertEvent) => {
      setMessage(`Regra disparada (${event.type}) — gravando trecho...`)

      let evidenceUrl: string | undefined
      const clip = await captureClip(2500)
      if (clip && clip.size > 0) {
        const uploaded = await uploadEvidence(clip, `motion-${Date.now()}.webm`)
        evidenceUrl = uploaded.url
      } else {
        const frame = camera.captureFrame()
        if (frame) {
          const uploaded = await uploadEvidence(dataUrlToBlob(frame), `motion-${Date.now()}.jpg`)
          evidenceUrl = uploaded.url
          setSnapshot(frame)
        }
      }

      const descriptions: Record<MotionAlertEvent['type'], string> = {
        SUSPICIOUS_MOVEMENT:
          `Movimentação intensa na cena (intensidade ${(event.sample.score * 100).toFixed(1)}%). ` +
          'Critério: mudança de pixels sustentada. Sem identificação de pessoa.',
        UNUSUAL_DWELL:
          'Atividade contínua na cena por ~20s. Critério: permanência/movimento prolongado. Sem identificação de pessoa.',
        AFTER_HOURS_MOVEMENT:
          `Movimento detectado fora do horário comercial (intensidade ${(event.sample.score * 100).toFixed(1)}%). ` +
          'Sem identificação de pessoa.',
      }

      const created = await simulateEvent({
        type: event.type,
        cameraId: linkedCameraId,
        evidenceUrl,
        description:
          descriptions[event.type] +
          ' Filmagem do momento anexada.' +
          (linkedCameraName ? ` Slot: ${linkedCameraName}.` : ''),
      })
      setMessage(`Alerta ${created.publicId} (${event.type}) gerado com filmagem.`)
    },
    [captureClip, camera, linkedCameraId, linkedCameraName],
  )

  const handleAlert = useCallback(
    (event: MotionAlertEvent) => {
      void createAlertWithClip(event).catch((err) => {
        setMessage(err instanceof Error ? err.message : 'Falha ao registrar evento')
      })
    },
    [createAlertWithClip],
  )

  const motion = useMotionDetection({
    videoRef: camera.videoRef,
    enabled: camera.active,
    afterHours,
    onAlert: handleAlert,
  })

  async function handleStart() {
    setMessage(null)
    setSnapshot(null)
    await camera.start()
    setMessage(
      'Câmera ligada. Todas as regras ativas: movimento, permanência' +
        (afterHours ? ' e fora do horário' : '') +
        '. Gravação automática no alerta.',
    )
  }

  function handleCapture() {
    const frame = camera.captureFrame()
    if (!frame) {
      setMessage('Não foi possível capturar o frame.')
      return
    }
    setSnapshot(frame)
    setMessage('Frame capturado localmente.')
  }

  async function handleForceAlert() {
    setBusy(true)
    setMessage(null)
    try {
      await createAlertWithClip({
        type: afterHours ? 'AFTER_HOURS_MOVEMENT' : 'SUSPICIOUS_MOVEMENT',
        sample: { score: motion.score, changedPixels: 0, totalPixels: 0 },
      })
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Falha ao gerar alerta')
    } finally {
      setBusy(false)
    }
  }

  function toggleFacing() {
    const next = facing === 'environment' ? 'user' : 'environment'
    setFacing(next)
    camera.stop()
    setMessage(
      `Alternado para câmera ${next === 'environment' ? 'traseira/ambiente' : 'frontal'}. Clique em Iniciar novamente.`,
    )
  }

  const motionTone =
    motion.level === 'suspicious' ? 'red' : motion.level === 'low' ? 'amber' : 'neutral'

  return (
    <section className="overflow-hidden rounded-xl border border-sg-green/30 bg-sg-card/90">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sg-border px-4 py-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-semibold">Câmera deste dispositivo</h2>
            <Badge tone={camera.active ? 'green' : 'neutral'}>
              {camera.active ? 'Ao vivo + todas as regras' : 'Parada'}
            </Badge>
            {camera.active ? <Badge tone={motionTone}>Movimento: {motion.scorePercent}%</Badge> : null}
            {afterHours ? <Badge tone="amber">Fora do horário</Badge> : null}
          </div>
          <p className="mt-1 text-xs text-sg-muted">
            Não precisa escolher tipo de alerta: o sistema avalia todas as regras e grava o trecho automaticamente.
            {linkedCameraName ? ` Vinculada a: ${linkedCameraName}.` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!camera.active ? (
            <button
              type="button"
              onClick={() => void handleStart()}
              className="inline-flex items-center gap-2 rounded-lg bg-sg-green px-3 py-2 text-sm font-medium text-slate-950"
            >
              <Camera size={16} /> Iniciar câmera
            </button>
          ) : (
            <button
              type="button"
              onClick={() => camera.stop()}
              className="inline-flex items-center gap-2 rounded-lg border border-sg-red/40 px-3 py-2 text-sm text-sg-red"
            >
              <Square size={14} /> Parar
            </button>
          )}
          <button
            type="button"
            onClick={toggleFacing}
            className="inline-flex items-center gap-2 rounded-lg border border-sg-border px-3 py-2 text-sm text-sg-muted hover:text-sg-text"
          >
            <SwitchCamera size={16} /> Alternar frontal/traseira
          </button>
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-3">
          <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
            <video
              ref={camera.videoRef}
              playsInline
              muted
              autoPlay
              className={`h-full w-full object-cover ${facing === 'user' ? 'scale-x-[-1]' : ''}`}
            />
            {!camera.active ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 p-4 text-center text-sm text-sg-muted">
                Clique em “Iniciar câmera” e autorize o acesso no navegador.
              </div>
            ) : null}
            {camera.active ? (
              <div className="absolute left-3 top-3">
                <Badge tone={motionTone}>
                  <Activity size={12} className="mr-1" />
                  {motion.level === 'suspicious'
                    ? 'Movimento suspeito'
                    : motion.level === 'low'
                      ? 'Movimento leve'
                      : 'Monitorando'}
                </Badge>
              </div>
            ) : null}
          </div>

          {camera.error ? <p className="text-sm text-sg-red">{camera.error}</p> : null}
          {message ? <p className="text-sm text-sg-muted">{message}</p> : null}

          <p className="rounded-lg border border-dashed border-sg-border p-3 text-xs text-sg-muted">
            Webcam com limiares mais rígidos (~22% mudança, 5 ciclos, dwell 35s, cooldown 45s) para reduzir
            falso positivo. Ocultação/loitering precisos ficam no Vision/RTSP (YOLO-Pose).
          </p>
        </div>

        <aside className="space-y-3">
          <div className="rounded-lg border border-sg-border p-3 text-xs text-sg-muted">
            <p className="mb-2 font-medium text-sg-text">Regras ativas (sem seleção)</p>
            <ul className="list-inside list-disc space-y-1">
              {motion.activeRules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </div>

          {camera.active ? (
            <div className="rounded-lg border border-sg-border p-3 text-xs text-sg-muted">
              <p>
                Intensidade atual: <span className="text-sg-text">{motion.scorePercent}%</span>
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded bg-sg-border">
                <div
                  className={`h-full transition-all ${
                    motion.level === 'suspicious'
                      ? 'bg-sg-red'
                      : motion.level === 'low'
                        ? 'bg-sg-amber'
                        : 'bg-sg-green'
                  }`}
                  style={{ width: `${Math.min(100, motion.scorePercent * 4)}%` }}
                />
              </div>
              {motion.lastTriggerAt ? (
                <p className="mt-2">Último disparo: {formatDateTime(new Date(motion.lastTriggerAt).toISOString())}</p>
              ) : (
                <p className="mt-2">Mova-se na frente da câmera para disparar + gravar.</p>
              )}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!camera.active}
              onClick={handleCapture}
              className="inline-flex items-center gap-2 rounded-lg border border-sg-border px-3 py-2 text-sm disabled:opacity-50"
            >
              <FlipHorizontal size={16} /> Capturar frame
            </button>
          </div>

          <button
            type="button"
            disabled={busy || !camera.active}
            onClick={() => void handleForceAlert()}
            className="w-full rounded-lg bg-sg-blue px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? 'Gerando...' : 'Forçar alerta agora (com filmagem)'}
          </button>

          {snapshot ? (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-sg-muted">Último frame (local)</p>
              <img
                src={snapshot}
                alt="Frame capturado da câmera do dispositivo"
                className="rounded-lg border border-sg-border"
              />
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  )
}
