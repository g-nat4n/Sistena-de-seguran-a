import { useEffect, useState } from 'react'
import { Activity, Database, HardDrive, Network, RefreshCw, Server } from 'lucide-react'
import { controlService, createBackup, fetchServerStatus, type ServerStatus } from '../services/adminService'
import { useAuth } from '../contexts/AuthContext'

function formatUptime(seconds?: number) {
  if (!seconds && seconds !== 0) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h}h ${m}m ${s}s`
}

export function ServerStatusPage() {
  const { user } = useAuth()
  const isAdmin = user?.roles?.includes('ADMIN')
  const [status, setStatus] = useState<ServerStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const load = async () => {
    try {
      setError(null)
      setStatus(await fetchServerStatus())
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : 'Falha ao carregar status')
    }
  }

  useEffect(() => {
    load()
    const id = window.setInterval(load, 10000)
    return () => window.clearInterval(id)
  }, [])

  const run = async (fn: () => Promise<unknown>, okMsg: string) => {
    setBusy(true)
    setMessage(null)
    try {
      await fn()
      setMessage(okMsg)
      await load()
    } catch (ex) {
      setMessage(ex instanceof Error ? ex.message : 'Operação falhou')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-sg-text">Status do servidor</h1>
          <p className="mt-1 text-sm text-sg-muted">Monitoramento contínuo e saúde da instalação local</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg border border-sg-border bg-sg-card px-3 py-2 text-sm text-sg-text"
        >
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {error && <p className="rounded-lg border border-sg-red/40 bg-sg-red/10 px-3 py-2 text-sm text-red-200">{error}</p>}
      {message && <p className="rounded-lg border border-sg-border bg-sg-card px-3 py-2 text-sm text-sg-muted">{message}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Server} label="Servidor" value={status?.status === 'UP' ? 'Online' : status?.status || '—'} />
        <Stat icon={Database} label="Banco" value={status?.database || '—'} />
        <Stat icon={Network} label="IP local" value={status?.localIp || '—'} />
        <Stat icon={Activity} label="Porta API" value={String(status?.apiPort ?? '—')} />
        <Stat icon={HardDrive} label="Câmeras ativas" value={`${status?.camerasOnline ?? 0}/${status?.camerasTotal ?? 0}`} />
        <Stat icon={Activity} label="Streams" value={String(status?.streamsActive ?? 0)} />
        <Stat icon={Network} label="Clientes (5 min)" value={String(status?.connectedClients ?? 0)} />
        <Stat icon={Server} label="Uptime" value={formatUptime(status?.uptimeSeconds)} />
      </div>

      <div className="rounded-xl border border-sg-border bg-sg-card/60 p-4 text-sm text-sg-muted">
        <p><span className="text-sg-text">Modo:</span> {status?.mode || '—'}</p>
        <p className="mt-1"><span className="text-sg-text">Vision:</span> {status?.vision || '—'}</p>
        <p className="mt-1 break-all"><span className="text-sg-text">Banco:</span> {status?.databaseFile || '—'}</p>
        <p className="mt-1"><span className="text-sg-text">Última inicialização:</span> {status?.startedAt || '—'}</p>
      </div>

      {isAdmin && (
        <div className="flex flex-wrap gap-2">
          <button disabled={busy} type="button" className="rounded-lg bg-sg-blue px-3 py-2 text-sm text-white disabled:opacity-50"
            onClick={() => run(() => createBackup(), 'Backup criado em ProgramData\\SmartGuard\\data\\backups')}>
            Backup agora
          </button>
          <button disabled={busy} type="button" className="rounded-lg border border-sg-border px-3 py-2 text-sm text-sg-text disabled:opacity-50"
            onClick={() => run(() => controlService('restart'), 'Reinício do serviço solicitado')}>
            Reiniciar serviço
          </button>
          <button disabled={busy} type="button" className="rounded-lg border border-sg-border px-3 py-2 text-sm text-sg-text disabled:opacity-50"
            onClick={() => run(() => controlService('status'), 'Status dos serviços consultado')}>
            Status serviços Windows
          </button>
        </div>
      )}
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Server
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-sg-border bg-sg-card/70 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs text-sg-muted">
        <Icon size={14} className="text-sg-blue" />
        {label}
      </div>
      <p className="font-display text-lg font-semibold text-sg-text">{value}</p>
    </div>
  )
}
