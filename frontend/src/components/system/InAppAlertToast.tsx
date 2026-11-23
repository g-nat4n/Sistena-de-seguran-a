import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { addNotification } from '../../services/notificationStore'

export type InAppAlertPayload = {
  title: string
  body: string
  alertId?: number | string
}

const EVENT_NAME = 'smartguard-alert-toast'

export function emitInAppAlertToast(payload: InAppAlertPayload) {
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: payload }))
}

export function InAppAlertToast() {
  const navigate = useNavigate()
  const [toast, setToast] = useState<InAppAlertPayload | null>(null)

  useEffect(() => {
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<InAppAlertPayload>).detail
      if (!detail?.title) return
      setToast(detail)
    }
    window.addEventListener(EVENT_NAME, onToast)

    const desktop = (
      window as unknown as {
        smartguardDesktop?: {
          onInAppNotification?: (cb: (data: InAppAlertPayload) => void) => (() => void) | void
        }
      }
    ).smartguardDesktop

    const unsubscribe = desktop?.onInAppNotification?.((data) => {
      if (!data?.title) return
      addNotification({
        title: data.title,
        body: data.body,
        alertId: data.alertId,
      })
      setToast(data)
    })

    return () => {
      window.removeEventListener(EVENT_NAME, onToast)
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 10000)
    return () => window.clearTimeout(timer)
  }, [toast])

  if (!toast) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-end p-4 md:p-6">
      <button
        type="button"
        className="pointer-events-auto w-full max-w-md cursor-pointer rounded-2xl border-[2.5px] border-sg-red bg-gradient-to-br from-sg-red/25 via-sg-card to-sg-bg p-4 pb-5 text-left shadow-[0_18px_40px_rgba(0,0,0,0.45),0_0_28px_rgba(239,68,68,0.25)] transition hover:border-red-400"
        onClick={() => {
          const id = toast.alertId != null ? Number(toast.alertId) : NaN
          setToast(null)
          if (Number.isFinite(id)) navigate('/alertas', { state: { openAlertId: id } })
          else navigate('/alertas')
        }}
      >
        <div className="mb-2 flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-red-400/80 bg-sg-red/30 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-red-100">
            <span className="h-2 w-2 animate-pulse rounded-full bg-sg-red" />
            Atenção
          </span>
          <span
            role="button"
            tabIndex={0}
            aria-label="Fechar"
            className="rounded-lg border border-sg-border p-1 text-sg-muted hover:text-sg-text"
            onClick={(e) => {
              e.stopPropagation()
              setToast(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation()
                setToast(null)
              }
            }}
          >
            <X size={14} />
          </span>
        </div>
        <p className="font-display text-sm font-bold text-sg-text">
          {toast.title.replace(/^🚨\s*/, '')}
        </p>
        <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-sg-muted">{toast.body}</p>
        <p className="mt-3 text-[11px] font-semibold text-sg-blue">SmartGuard AI · toque para abrir</p>
      </button>
    </div>
  )
}
