import { Camera, FlipHorizontal, Square, SwitchCamera } from 'lucide-react'
import { useState } from 'react'
import { useDeviceCamera, type CameraFacing } from '../../hooks/useDeviceCamera'
import { simulateEvent } from '../../services/simulationService'
import type { AlertType } from '../../types/alerts'
import { Badge } from '../ui/Badge'
import { SelectField } from '../ui/SelectField'
import { ALERT_TYPE_OPTIONS } from '../../utils/labels'

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
  const camera = useDeviceCamera({ facingMode: facing })

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
          ? `Evento simulado a partir da câmera do dispositivo vinculada a "${linkedCameraName}". Sem reconhecimento facial.`
          : 'Evento simulado a partir da câmera do notebook/celular. Sem reconhecimento facial e sem declaração automática de crime.',
      })
      setMessage(`Alerta ${created.publicId} gerado na central (simulado).`)
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
    setMessage(`Alternado para câmera ${next === 'environment' ? 'traseira/ambiente' : 'frontal'}. Clique em Iniciar novamente.`)
  }

  return (
    <section className="overflow-hidden rounded-xl border border-sg-green/30 bg-sg-card/90">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sg-border px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-semibold">Câmera deste dispositivo</h2>
            <Badge tone={camera.active ? 'green' : 'neutral'}>
              {camera.active ? 'Ao vivo' : 'Parada'}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-sg-muted">
            Usa a webcam do notebook ou a câmera do celular pelo navegador (getUserMedia). Não é RTSP.
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
              onClick={camera.stop}
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
                setMessage('Dispositivo alterado. Clique em Iniciar câmera.')
              }}
            />
          ) : null}

          {camera.error ? <p className="text-sm text-sg-red">{camera.error}</p> : null}
          {message ? <p className="text-sm text-sg-muted">{message}</p> : null}

          <p className="rounded-lg border border-dashed border-sg-border p-3 text-xs text-sg-muted">
            No notebook funciona em `localhost`. No celular, abra o sistema no browser do aparelho
            (mesma rede). Em IPs HTTP locais o browser pode bloquear a câmera — use HTTPS ou um túnel.
            O vídeo fica só neste dispositivo; não há gravação em servidor nesta etapa.
          </p>
        </div>

        <aside className="space-y-3">
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
            label="Tipo de alerta simulado"
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
            {busy ? 'Gerando...' : 'Gerar alerta simulado a partir desta sessão'}
          </button>

          {snapshot ? (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-sg-muted">Último frame (local)</p>
              <img src={snapshot} alt="Frame capturado da câmera do dispositivo" className="rounded-lg border border-sg-border" />
            </div>
          ) : (
            <p className="text-xs text-sg-muted">
              O frame capturado fica só no navegador (preview local). O alerta criado na API continua marcado como
              simulado.
            </p>
          )}
        </aside>
      </div>
    </section>
  )
}
