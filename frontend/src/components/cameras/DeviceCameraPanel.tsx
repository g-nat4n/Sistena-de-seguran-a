import { Activity, Camera, FlipHorizontal, Square, SwitchCamera } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useDeviceCamera, type CameraFacing } from '../../hooks/useDeviceCamera'
import { useMotionDetection } from '../../hooks/useMotionDetection'
import { simulateEvent } from '../../services/simulationService'
import type { AlertType } from '../../types/alerts'
import type { MotionSample } from '../../utils/motionDetection'
import { Badge } from '../ui/Badge'
import { SelectField } from '../ui/SelectField'
import { ALERT_TYPE_OPTIONS, formatDateTime } from '../../utils/labels'

interface DeviceCameraPanelProps {
  linkedCameraId?: number
  linkedCameraName?: string
}

export function DeviceCameraPanel({ linkedCameraId, linkedCameraName }: DeviceCameraPanelProps) {
  const [facing, setFacing] = useState<CameraFacing>('environment')
  const [snapshot, setSnapshot] = useState<string | null>(null)
  const [alertType, setAlertType] = useState<AlertType>('SUSPICIOUS_MOVEMENT')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [autoDetect, setAutoDetect] = useState(false)
  const camera = useDeviceCamera({ facingMode: facing })

  const handleSuspiciousMotion = useCallback(
    async (sample: MotionSample) => {
      try {
        const created = await simulateEvent({
          type: 'SUSPICIOUS_MOVEMENT',
          cameraId: linkedCameraId,
          description:
            `Protótipo local: movimento anônimo detectado na câmera do dispositivo ` +
            `(intensidade ${(sample.score * 100).toFixed(1)}%). ` +
            `Não há reconhecimento facial nem identificação de pessoa.` +
            (linkedCameraName ? ` Slot: ${linkedCameraName}.` : ''),
        })
        setMessage(
          `Movimento detectado → alerta ${created.publicId} enviado à central (protótipo, sem identificação).`,
        )
      } catch (err) {
        setMessage(err instanceof Error ? err.message : 'Falha ao registrar movimento')
      }
    },
    [linkedCameraId, linkedCameraName],
  )

  const motion = useMotionDetection({
    videoRef: camera.videoRef,
    enabled: camera.active && autoDetect,
    onSuspiciousMotion: handleSuspiciousMotion,
  })

  async function handleStart() {
    setMessage(null)
    setSnapshot(null)
    await camera.start()
  }

  function handleCapture() {
    const frame = camera.captureFrame()
    if (!frame) {
      setMessage('Não foi possível capturar o frame.')
      return
    }
    setSnapshot(frame)
    setMessage('Frame capturado localmente (não enviado como stream RTSP).')
  }

  async function handleCreateAlert() {
    setBusy(true)
    setMessage(null)
    try {
      const created = await simulateEvent({
        type: alertType,
        cameraId: linkedCameraId,
        description: linkedCameraName
          ? `Evento manual a partir da câmera do dispositivo vinculada a "${linkedCameraName}". Sem reconhecimento facial.`
          : 'Evento manual a partir da câmera do notebook/celular. Sem reconhecimento facial.',
      })
      setMessage(`Alerta ${created.publicId} gerado na central.`)
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
    setAutoDetect(false)
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
              {camera.active ? 'Ao vivo' : 'Parada'}
            </Badge>
            {autoDetect ? <Badge tone={motionTone}>Movimento: {motion.scorePercent}%</Badge> : null}
          </div>
          <p className="mt-1 text-xs text-sg-muted">
            Preview local + protótipo de detecção de movimento anônimo (diferença de frames). Sem rostos/biometria.
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
              onClick={() => {
                setAutoDetect(false)
                camera.stop()
              }}
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
            {camera.active && autoDetect ? (
              <div className="absolute left-3 top-3">
                <Badge tone={motionTone}>
                  <Activity size={12} className="mr-1" />
                  {motion.level === 'suspicious'
                    ? 'Movimento suspeito'
                    : motion.level === 'low'
                      ? 'Movimento leve'
                      : 'Estável'}
                </Badge>
              </div>
            ) : null}
          </div>

          {camera.devices.length > 1 ? (
            <SelectField
              label="Dispositivo de vídeo"
              value={camera.deviceId}
              emptyLabel="Padrão do sistema"
              options={camera.devices.map((device, index) => ({
                value: device.deviceId,
                label: device.label || `Câmera ${index + 1}`,
              }))}
              onChange={(value) => {
                camera.setDeviceId(value)
                camera.stop()
                setAutoDetect(false)
                setMessage('Dispositivo alterado. Clique em Iniciar câmera.')
              }}
            />
          ) : null}

          {camera.error ? <p className="text-sm text-sg-red">{camera.error}</p> : null}
          {message ? <p className="text-sm text-sg-muted">{message}</p> : null}

          <p className="rounded-lg border border-dashed border-sg-border p-3 text-xs text-sg-muted">
            A detecção compara frames em escala de cinza no próprio navegador. Ela não sabe quem é a pessoa —
            apenas que houve mudança significativa na cena. Cooldown de ~20s entre alertas automáticos.
          </p>
        </div>

        <aside className="space-y-3">
          <label className="flex items-center justify-between gap-3 rounded-lg border border-sg-border bg-sg-bg/50 px-3 py-2 text-sm">
            <span>
              Detecção automática de movimento
              <span className="mt-0.5 block text-xs text-sg-muted">Protótipo local (sem YOLO ainda)</span>
            </span>
            <input
              type="checkbox"
              checked={autoDetect}
              disabled={!camera.active}
              onChange={(e) => setAutoDetect(e.target.checked)}
              className="h-4 w-4 accent-sg-green"
            />
          </label>

          {autoDetect ? (
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
                <p className="mt-2">Mova-se na frente da câmera para testar.</p>
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

          <SelectField
            label="Tipo de alerta manual"
            value={alertType}
            allowEmpty={false}
            options={ALERT_TYPE_OPTIONS}
            onChange={(value) => setAlertType(value as AlertType)}
          />

          <button
            type="button"
            disabled={busy}
            onClick={() => void handleCreateAlert()}
            className="w-full rounded-lg bg-sg-blue px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? 'Gerando...' : 'Gerar alerta manual'}
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
