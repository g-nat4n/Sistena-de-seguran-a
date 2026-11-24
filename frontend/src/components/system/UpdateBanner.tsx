import { useEffect, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'

type UpdateStatus = {
  checking?: boolean
  available?: boolean
  downloaded?: boolean
  version?: string | null
  message?: string | null
  error?: string | null
}

type DesktopApi = {
  checkForUpdates?: () => Promise<unknown>
  installUpdate?: () => Promise<{ ok: boolean }>
  getUpdateStatus?: () => Promise<UpdateStatus>
  onUpdateStatus?: (cb: (status: UpdateStatus) => void) => (() => void) | void
}

export function UpdateBanner() {
  const [status, setStatus] = useState<UpdateStatus | null>(null)
  const desktop = (window as unknown as { smartguardDesktop?: DesktopApi }).smartguardDesktop

  useEffect(() => {
    if (!desktop?.onUpdateStatus && !desktop?.getUpdateStatus) return
    void desktop.getUpdateStatus?.().then((s) => setStatus(s))
    const unsub = desktop.onUpdateStatus?.((s) => setStatus(s))
    return () => {
      if (typeof unsub === 'function') unsub()
    }
  }, [desktop])

  if (!desktop || !status) return null
  if (!status.available && !status.downloaded && !status.error) return null

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2 text-sm md:px-6 ${
        status.error
          ? 'border-sg-amber/40 bg-sg-amber/10 text-sg-amber'
          : 'border-sg-blue/40 bg-sg-blue/10 text-sg-text'
      }`}
    >
      <p className="text-xs md:text-sm">
        {status.message ||
          (status.downloaded
            ? `Atualização ${status.version || ''} pronta.`
            : status.available
              ? `Nova versão ${status.version || ''} disponível.`
              : status.error)}
      </p>
      <div className="flex items-center gap-2">
        {!status.downloaded ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-sg-border px-3 py-1 text-xs hover:text-sg-text"
            onClick={() => void desktop.checkForUpdates?.()}
          >
            <RefreshCw size={12} />
            Verificar
          </button>
        ) : (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg bg-sg-blue px-3 py-1 text-xs font-semibold text-white"
            onClick={() => void desktop.installUpdate?.()}
          >
            <Download size={12} />
            Reiniciar e atualizar
          </button>
        )}
      </div>
    </div>
  )
}
