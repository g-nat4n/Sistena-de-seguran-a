import { useState } from 'react'
import {
  configureCameraRtsp,
  fetchCameraById,
  startCameraStream,
  stopCameraStream,
  testCameraRtsp,
} from '../../services/cameraService'
import type { Camera } from '../../types/camera'
import { formatDateTime, streamStateLabel } from '../../utils/labels'
import { Badge } from '../ui/Badge'
import { TextField } from '../ui/TextField'

interface RtspConfigPanelProps {
  camera: Camera
  onUpdated: (camera: Camera) => void
}

export function RtspConfigPanel({ camera, onUpdated }: RtspConfigPanelProps) {
  const [host, setHost] = useState(camera.rtspHost ?? '')
  const [port, setPort] = useState(String(camera.rtspPort ?? 554))
  const [path, setPath] = useState(camera.rtspPath ?? '/cam/realmonitor?channel=1&subtype=0')
  const [username, setUsername] = useState(camera.rtspUsername ?? 'admin')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function saveConfig() {
    setBusy(true)
    setMessage(null)
    try {
      const updated = await configureCameraRtsp(camera.id, {
        host,
        port: Number(port) || 554,
        path,
        username,
        password: password || undefined,
      })
      setPassword('')
      onUpdated(updated)
      setMessage('Credenciais RTSP salvas. A senha não é exibida novamente.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Falha ao salvar RTSP')
    } finally {
      setBusy(false)
    }
  }

  async function run(action: 'test' | 'start' | 'stop') {
    setBusy(true)
    setMessage(null)
    try {
      const result =
        action === 'test'
          ? await testCameraRtsp(camera.id)
          : action === 'start'
            ? await startCameraStream(camera.id)
            : await stopCameraStream(camera.id)
      onUpdated({ ...camera, streamState: result.streamState, lastError: result.success ? null : result.message })
      setMessage(result.message)
      onUpdated(await fetchCameraById(camera.id))
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Falha na operação de stream')
    } finally {
      setBusy(false)
    }
  }

  const streamTone =
    camera.streamState === 'CONNECTED'
      ? 'green'
      : camera.streamState === 'ERROR'
        ? 'red'
        : camera.streamState === 'RECONNECTING' || camera.streamState === 'CONNECTING'
          ? 'amber'
          : 'neutral'

  return (
    <section className="rounded-xl border border-sg-border bg-sg-card/90 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-semibold">RTSP Intelbras</h3>
          <p className="text-xs text-sg-muted">
            A senha é criptografada no backend e nunca retorna na API. Mantenha o serviço Python (porta 8090) no ar.
          </p>
        </div>
        <Badge tone={streamTone}>{streamStateLabel(camera.streamState ?? 'IDLE')}</Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <TextField label="Host / IP" value={host} onChange={setHost} placeholder="192.168.1.50" />
        <TextField label="Porta" value={port} onChange={setPort} placeholder="554" />
        <TextField
          label="Path"
          value={path}
          onChange={setPath}
          placeholder="/cam/realmonitor?channel=1&subtype=0"
        />
        <TextField label="Usuário" value={username} onChange={setUsername} placeholder="admin" />
        <TextField
          label={camera.rtspConfigured ? 'Senha (deixe vazio para manter)' : 'Senha'}
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void saveConfig()}
          className="rounded-lg bg-sg-blue px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Salvar RTSP
        </button>
        <button
          type="button"
          disabled={busy || !camera.rtspConfigured}
          onClick={() => void run('test')}
          className="rounded-lg border border-sg-border px-3 py-2 text-sm disabled:opacity-50"
        >
          Testar conexão
        </button>
        <button
          type="button"
          disabled={busy || !camera.rtspConfigured}
          onClick={() => void run('start')}
          className="rounded-lg border border-sg-green/40 px-3 py-2 text-sm text-sg-green disabled:opacity-50"
        >
          Iniciar stream
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void run('stop')}
          className="rounded-lg border border-sg-red/40 px-3 py-2 text-sm text-sg-red disabled:opacity-50"
        >
          Parar stream
        </button>
      </div>

      <div className="mt-3 space-y-1 text-xs text-sg-muted">
        {camera.lastTestedAt ? <p>Último teste: {formatDateTime(camera.lastTestedAt)}</p> : null}
        {camera.lastSeenAt ? <p>Último heartbeat: {formatDateTime(camera.lastSeenAt)}</p> : null}
        {camera.lastError ? <p className="text-sg-red">Erro: {camera.lastError}</p> : null}
        {message ? <p className="text-sg-text">{message}</p> : null}
      </div>
    </section>
  )
}
