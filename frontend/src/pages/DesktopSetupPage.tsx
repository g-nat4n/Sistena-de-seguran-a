import { useEffect, useState } from 'react'

type Cfg = {
  mode: string
  apiPort: number
  keepApiOnExit: boolean
  dataDir?: string
}

export function DesktopSetupPage() {
  const [cfg, setCfg] = useState<Cfg>({
    mode: 'standalone',
    apiPort: 8080,
    keepApiOnExit: true,
  })
  const [saved, setSaved] = useState<string | null>(null)
  const desktop = (window as unknown as {
    smartguardDesktop?: {
      getConfig: () => Promise<Cfg>
      saveConfig: (c: Partial<Cfg>) => Promise<Cfg>
      openDataDir: () => Promise<void>
    }
  }).smartguardDesktop

  useEffect(() => {
    desktop?.getConfig?.().then((c) => setCfg({
      mode: 'standalone',
      apiPort: Number(c.apiPort) || 8080,
      keepApiOnExit: c.keepApiOnExit !== false,
      dataDir: c.dataDir,
    }))
  }, [])

  if (!desktop) {
    return (
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold">Instalação local</h1>
        <p className="text-sm text-sg-muted">
          Esta tela é do aplicativo Windows. Cada PC mantém banco e logins próprios.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="font-display text-2xl font-bold">Este computador</h1>
      <p className="text-sm text-sg-muted">
        O SmartGuard roda <strong>local neste PC</strong>: banco SQLite criptografado + usuários só desta instalação.
        Outro computador = outra instalação, outro banco, outros logins.
      </p>

      <div className="rounded-xl border border-sg-border bg-sg-card/70 p-4 text-sm text-sg-muted">
        <p><span className="text-sg-text">Modo:</span> standalone (independente)</p>
        <p className="mt-1 break-all"><span className="text-sg-text">Pasta de dados:</span> {cfg.dataDir || '%ProgramData%\\SmartGuard\\data'}</p>
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
        Manter API/banco rodando ao fechar a janela (recomendado na loja)
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
      {saved && <p className="text-sm text-sg-green">{saved}</p>}
    </div>
  )
}
