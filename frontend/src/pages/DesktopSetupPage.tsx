import { useEffect, useState } from 'react'

type Cfg = {
  mode: string
  apiPort: number
  keepApiOnExit: boolean
  dataDir?: string
  instanceId?: string
  installRoot?: string
}

type DesktopApi = {
  getConfig: () => Promise<Cfg>
  saveConfig: (c: Partial<Cfg>) => Promise<Cfg>
  openDataDir: () => Promise<void>
  resetLocalData: () => Promise<{ ok: boolean }>
}

export function DesktopSetupPage() {
  const [cfg, setCfg] = useState<Cfg>({
    mode: 'standalone',
    apiPort: 8080,
    keepApiOnExit: false,
  })
  const [saved, setSaved] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const desktop = (window as unknown as { smartguardDesktop?: DesktopApi }).smartguardDesktop

  useEffect(() => {
    desktop?.getConfig?.().then((c) =>
      setCfg({
        mode: 'standalone',
        apiPort: Number(c.apiPort) || 8080,
        keepApiOnExit: Boolean(c.keepApiOnExit),
        dataDir: c.dataDir,
        instanceId: c.instanceId,
        installRoot: c.installRoot,
      }),
    )
  }, [desktop])

  if (!desktop) {
    return (
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold">Instalação local</h1>
        <p className="text-sm text-sg-muted">
          Esta tela é do aplicativo Windows. Cada instalação mantém banco e logins próprios.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="font-display text-2xl font-bold">Este computador</h1>
      <p className="text-sm text-sg-muted">
        Cada pasta/instalação do SmartGuard tem <strong>banco e usuários separados</strong>.
        O app não reutiliza login de outra instalação que estava aberta.
      </p>

      <div className="rounded-xl border border-sg-border bg-sg-card/70 p-4 text-sm text-sg-muted">
        <p>
          <span className="text-sg-text">Modo:</span> standalone (independente)
        </p>
        <p className="mt-1 break-all">
          <span className="text-sg-text">Instância:</span> {cfg.instanceId || '—'}
        </p>
        <p className="mt-1 break-all">
          <span className="text-sg-text">Pasta de dados:</span>{' '}
          {cfg.dataDir || '%ProgramData%\\SmartGuard\\instances\\…\\data'}
        </p>
      </div>

      <label className="block text-sm">
        Porta da API local
        <input
          type="number"
          className="mt-1 w-full rounded-lg border border-sg-border bg-sg-card px-3 py-2"
          value={cfg.apiPort}
          onChange={(e) => setCfg({ ...cfg, apiPort: Number(e.target.value) })}
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={cfg.keepApiOnExit}
          onChange={(e) => setCfg({ ...cfg, keepApiOnExit: e.target.checked })}
        />
        Manter API rodando ao fechar a janela (não recomendado se troca de instalação no mesmo PC)
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg bg-sg-blue px-4 py-2 text-sm font-semibold text-white"
          onClick={async () => {
            await desktop.saveConfig({
              mode: 'standalone',
              apiPort: cfg.apiPort,
              keepApiOnExit: cfg.keepApiOnExit,
            })
            setSaved('Salvo. Reinicie o app se mudou a porta.')
          }}
        >
          Salvar
        </button>
        <button
          type="button"
          className="rounded-lg border border-sg-border px-4 py-2 text-sm text-sg-text"
          onClick={() => desktop.openDataDir()}
        >
          Abrir pasta do banco
        </button>
      </div>

      <div className="rounded-xl border border-sg-red/40 bg-sg-red/5 p-4">
        <p className="text-sm font-medium text-sg-red">Zerar esta instalação</p>
        <p className="mt-1 text-xs text-sg-muted">
          Apaga usuários e banco só desta instalação e volta para o cadastro do administrador.
        </p>
        <button
          type="button"
          disabled={busy}
          className="mt-3 rounded-lg border border-sg-red/50 px-4 py-2 text-sm text-sg-red disabled:opacity-50"
          onClick={async () => {
            const ok = window.confirm(
              'Apagar todos os usuários e dados desta instalação? Você vai precisar cadastrar o admin de novo.',
            )
            if (!ok) return
            setBusy(true)
            setSaved(null)
            try {
              await desktop.resetLocalData()
              setSaved('Dados apagados. Feche e abra o SmartGuard de novo.')
              window.setTimeout(() => window.location.reload(), 800)
            } catch (err) {
              setSaved(err instanceof Error ? err.message : 'Falha ao zerar dados')
            } finally {
              setBusy(false)
            }
          }}
        >
          {busy ? 'Apagando…' : 'Apagar dados e recomeçar'}
        </button>
      </div>

      {saved && <p className="text-sm text-sg-green">{saved}</p>}
    </div>
  )
}
