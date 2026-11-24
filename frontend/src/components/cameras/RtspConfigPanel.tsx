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

type Feedback = {
  ok: boolean
  title: string
  detail: string
  tip: string
}

function explainRtspError(raw: string): Feedback {
  const text = raw || 'Erro desconhecido'
  const lower = text.toLowerCase()

  if (lower.includes('rsv') || lower.includes('número de série') || lower.includes('numero de serie') || lower.includes('não o número')) {
    return {
      ok: false,
      title: 'Host inválido',
      detail: text,
      tip: 'Use o IP da câmera/DVR na rede local (ex.: 192.168.1.50), não o código RSV/série.',
    }
  }

  if (
    lower.includes('connection refused') ||
    lower.includes('connect timed out') ||
    lower.includes('não está respondendo') ||
    lower.includes('nao esta respondendo') ||
    lower.includes('sem conexão com http://127.0.0.1:8090')
  ) {
    return {
      ok: false,
      title: 'Serviço de câmeras fora do ar',
      detail: text,
      tip: 'Feche o SmartGuard e abra de novo. Se continuar, reinstale pelo Setup.',
    }
  }

  if (lower.includes('422') || lower.includes('rejeitou os dados')) {
    return {
      ok: false,
      title: 'Dados RTSP rejeitados',
      detail: text,
      tip: 'Salve de novo com IP local (192.168.x.x), porta 554 e usuário/senha da câmera.',
    }
  }

  if (lower.includes('senha') || lower.includes('credencial') || lower.includes('auth') || lower.includes('unauthorized')) {
    return {
      ok: false,
      title: 'Usuário ou senha incorretos',
      detail: text,
      tip: 'Use o mesmo login da câmera/DVR Intelbras (não o login do SmartGuard).',
    }
  }

  if (lower.includes('frame') || lower.includes('path') || lower.includes('canal') || lower.includes('channel')) {
    return {
      ok: false,
      title: 'Câmera respondeu, mas sem imagem',
      detail: text,
      tip: 'Confira o Path (channel/subtype) e se o RTSP está liberado no equipamento.',
    }
  }

  if (
    lower.includes('abrir') ||
    lower.includes('timeout') ||
    lower.includes('rede') ||
    lower.includes('host') ||
    lower.includes('ip')
  ) {
    return {
      ok: false,
      title: 'Não conectou na câmera',
      detail: text,
      tip: 'Confira o IP (não use RSV), se o PC está na mesma rede e se a porta é 554.',
    }
  }

  return {
    ok: false,
    title: 'Falha na conexão RTSP',
    detail: text,
    tip: 'Revise IP local, porta 554, path, usuário e senha da câmera.',
  }
}

const PATH_PRESETS = [
  {
    id: 'intelbras-main',
    label: 'Intelbras canal 1 (principal)',
    path: '/cam/realmonitor?channel=1&subtype=0',
  },
  {
    id: 'intelbras-sub',
    label: 'Intelbras canal 1 (substream — mais leve)',
    path: '/cam/realmonitor?channel=1&subtype=1',
  },
  {
    id: 'intelbras-ch2',
    label: 'Intelbras canal 2',
    path: '/cam/realmonitor?channel=2&subtype=0',
  },
] as const

export function RtspConfigPanel({ camera, onUpdated }: RtspConfigPanelProps) {
  const [host, setHost] = useState(camera.rtspHost ?? '')
  const [port, setPort] = useState(String(camera.rtspPort ?? 554))
  const [path, setPath] = useState(camera.rtspPath ?? '/cam/realmonitor?channel=1&subtype=0')
  const [username, setUsername] = useState(camera.rtspUsername ?? 'admin')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  async function persistConfig() {
    const updated = await configureCameraRtsp(camera.id, {
      host,
      port: Number(port) || 554,
      path,
      username,
      password: password || undefined,
    })
    setPassword('')
    onUpdated(updated)
    return updated
  }

  async function saveConfig() {
    setBusy(true)
    setFeedback(null)
    try {
      await persistConfig()
      setFeedback({
        ok: true,
        title: 'RTSP salvo',
        detail: 'Credenciais gravadas. A senha não é exibida novamente.',
        tip: 'Agora clique em “Testar conexão” ou em “Conectar agora”.',
      })
    } catch (err) {
      setFeedback(
        explainRtspError(err instanceof Error ? err.message : 'Falha ao salvar RTSP'),
      )
    } finally {
      setBusy(false)
    }
  }

  async function connectNow() {
    setBusy(true)
    setFeedback(null)
    try {
      await persistConfig()
      const test = await testCameraRtsp(camera.id)
      if (!test.success) {
        setFeedback(explainRtspError(test.message))
        onUpdated(await fetchCameraById(camera.id))
        return
      }
      const start = await startCameraStream(camera.id)
      onUpdated(await fetchCameraById(camera.id))
      if (start.success) {
        setFeedback({
          ok: true,
          title: 'Câmera conectada',
          detail: start.message,
          tip: 'Status deve ir para Conectado. Se cair, o app tenta reconectar sozinho.',
        })
      } else {
        setFeedback(explainRtspError(start.message))
      }
    } catch (err) {
      setFeedback(
        explainRtspError(err instanceof Error ? err.message : 'Falha ao conectar a câmera'),
      )
    } finally {
      setBusy(false)
    }
  }

  async function run(action: 'test' | 'start' | 'stop') {
    setBusy(true)
    setFeedback(null)
    try {
      const result =
        action === 'test'
          ? await testCameraRtsp(camera.id)
          : action === 'start'
            ? await startCameraStream(camera.id)
            : await stopCameraStream(camera.id)

      onUpdated({
        ...camera,
        streamState: result.streamState,
        lastError: result.success ? null : result.message,
      })

      if (result.success) {
        setFeedback({
          ok: true,
          title:
            action === 'test'
              ? 'Conexão OK'
              : action === 'start'
                ? 'Stream iniciado'
                : 'Stream parado',
          detail: result.message,
          tip:
            action === 'test'
              ? 'Pode clicar em “Iniciar stream” ou “Conectar agora”.'
              : action === 'start'
                ? 'Aguarde o status mudar para Conectado. Quedas são reconectadas automaticamente.'
                : 'Stream interrompido.',
        })
      } else {
        setFeedback(explainRtspError(result.message))
      }

      onUpdated(await fetchCameraById(camera.id))
    } catch (err) {
      setFeedback(
        explainRtspError(err instanceof Error ? err.message : 'Falha na operação de stream'),
      )
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

  const shownError =
    feedback && !feedback.ok
      ? feedback
      : !feedback && camera.lastError
        ? explainRtspError(camera.lastError)
        : null

  return (
    <section className="rounded-xl border border-sg-border bg-sg-card/90 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-semibold">RTSP Intelbras</h3>
          <p className="text-xs text-sg-muted">
            Use o IP da câmera/DVR na rede local. A senha é criptografada e não aparece de novo depois de salvar.
          </p>
        </div>
        <Badge tone={streamTone}>{streamStateLabel(camera.streamState ?? 'IDLE')}</Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <TextField
          label="Host / IP"
          value={host}
          onChange={setHost}
          placeholder="Ex.: 192.168.1.50"
          hint="IP da câmera na rede. Não use código RSV/série."
        />
        <TextField
          label="Porta RTSP"
          value={port}
          onChange={setPort}
          placeholder="554"
          hint="Na maioria das Intelbras é 554."
        />
        <div className="md:col-span-2">
          <TextField
            label="Path"
            value={path}
            onChange={setPath}
            placeholder="/cam/realmonitor?channel=1&subtype=0"
            hint="channel = número da câmera no DVR. subtype=0 principal, 1 = substream."
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {PATH_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                disabled={busy}
                onClick={() => setPath(preset.path)}
                className="rounded-md border border-sg-border px-2 py-1 text-[11px] text-sg-muted transition hover:border-sg-blue/50 hover:text-sg-text disabled:opacity-50"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
        <TextField
          label="Usuário"
          value={username}
          onChange={setUsername}
          placeholder="admin"
          hint="Login da câmera/DVR (não o login do SmartGuard)."
        />
        <TextField
          label={camera.rtspConfigured ? 'Senha (deixe vazio para manter)' : 'Senha'}
          type="password"
          value={password}
          onChange={setPassword}
          placeholder={camera.rtspConfigured ? '•••••••• (já salva)' : 'Senha da câmera/DVR'}
          hint="Mesma senha usada no app ou navegador da Intelbras."
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || !host.trim() || !username.trim() || (!camera.rtspConfigured && !password)}
          onClick={() => void connectNow()}
          className="rounded-lg bg-sg-green px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {busy ? 'Conectando…' : 'Conectar agora'}
        </button>
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

      <div className="mt-3 space-y-2 text-xs text-sg-muted">
        {camera.lastTestedAt ? <p>Último teste: {formatDateTime(camera.lastTestedAt)}</p> : null}
        {camera.lastSeenAt ? <p>Último heartbeat: {formatDateTime(camera.lastSeenAt)}</p> : null}

        {feedback?.ok ? (
          <div className="rounded-lg border border-sg-green/40 bg-sg-green/10 px-3 py-2 text-sg-green">
            <p className="font-medium">{feedback.title}</p>
            <p className="mt-1 text-sg-text">{feedback.detail}</p>
            <p className="mt-1 text-sg-muted">{feedback.tip}</p>
          </div>
        ) : null}

        {shownError ? (
          <div
            role="alert"
            className="rounded-lg border border-sg-red/50 bg-sg-red/10 px-3 py-2 text-sg-red"
          >
            <p className="font-semibold">Erro ao conectar: {shownError.title}</p>
            <p className="mt-1 text-sg-text">{shownError.detail}</p>
            <p className="mt-1 text-sg-muted">O que fazer: {shownError.tip}</p>
          </div>
        ) : null}
      </div>
    </section>
  )
}
