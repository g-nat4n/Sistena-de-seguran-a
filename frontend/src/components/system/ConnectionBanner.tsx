import { useEffect, useRef, useState } from 'react'
import { fetchHealth, sendHeartbeat } from '../../services/adminService'

type State = 'online' | 'offline' | 'reconnected'

export function ConnectionBanner() {
  const [state, setState] = useState<State>('online')
  const wasOffline = useRef(false)
  const noticeTimer = useRef<number | null>(null)

  useEffect(() => {
    const clientId =
      (window as unknown as { smartguardDesktop?: { getConfig?: () => Promise<{ clientId?: string }> } })
        .smartguardDesktop
        ? undefined
        : `web-${Math.random().toString(36).slice(2)}`

    let activeClientId = clientId || 'web-client'

    ;(async () => {
      try {
        const desktop = (window as unknown as { smartguardDesktop?: { getConfig: () => Promise<{ clientId: string }> } }).smartguardDesktop
        if (desktop?.getConfig) {
          const cfg = await desktop.getConfig()
          if (cfg.clientId) activeClientId = cfg.clientId
        }
      } catch {
        // ignore
      }
    })()

    const tick = async () => {
      try {
        await fetchHealth()
        if (wasOffline.current) {
          wasOffline.current = false
          setState('reconnected')
          if (noticeTimer.current) window.clearTimeout(noticeTimer.current)
          noticeTimer.current = window.setTimeout(() => setState('online'), 4000)
        } else if (state !== 'reconnected') {
          setState('online')
        }
        try {
          await sendHeartbeat(activeClientId)
        } catch {
          // heartbeat requires auth; ignore on login page
        }
      } catch {
        wasOffline.current = true
        setState('offline')
      }
    }

    tick()
    const id = window.setInterval(tick, 8000)
    return () => {
      window.clearInterval(id)
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current)
    }
  }, [])

  if (state === 'online') return null

  const offline = state === 'offline'
  return (
    <div
      className={`px-4 py-2 text-center text-sm ${
        offline ? 'bg-sg-red/20 text-red-200' : 'bg-sg-green/20 text-emerald-200'
      }`}
    >
      {offline
        ? 'Servidor desconectado. Tentando reconectar automaticamente…'
        : 'Conexão com o servidor restabelecida.'}
    </div>
  )
}
