import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  NOTIFICATIONS_CHANGED,
  clearNotifications,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  unreadNotificationCount,
  type AppNotification,
} from '../../services/notificationStore'

function timeLabel(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'Agora'
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} h`
  return `${Math.floor(h / 24)} d`
}

export function NotificationCenter() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AppNotification[]>(() => listNotifications())
  const [unread, setUnread] = useState(() => unreadNotificationCount())
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const refresh = () => {
      setItems(listNotifications())
      setUnread(unreadNotificationCount())
    }
    window.addEventListener(NOTIFICATIONS_CHANGED, refresh)
    return () => window.removeEventListener(NOTIFICATIONS_CHANGED, refresh)
  }, [])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  function openItem(item: AppNotification) {
    markNotificationRead(item.id)
    setOpen(false)
    const id = item.alertId != null ? Number(item.alertId) : NaN
    if (Number.isFinite(id)) navigate('/alertas', { state: { openAlertId: id } })
    else navigate('/alertas')
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label="Notificações"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg border border-sg-border p-2 text-sg-muted transition hover:border-sg-blue/50 hover:text-sg-text"
      >
        <Bell size={16} />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-sg-red px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-sg-border bg-[#0f172a] shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
          <div className="flex items-center justify-between border-b border-sg-border px-4 py-3">
            <div>
              <p className="font-display text-sm font-bold text-sg-text">Notificações</p>
              <p className="text-[11px] text-sg-muted">
                {unread > 0 ? `${unread} não lida${unread > 1 ? 's' : ''}` : 'Tudo lido'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                title="Marcar todas como lidas"
                onClick={() => markAllNotificationsRead()}
                className="rounded-lg p-2 text-sg-muted hover:bg-white/5 hover:text-sg-text"
              >
                <CheckCheck size={15} />
              </button>
              <button
                type="button"
                title="Limpar"
                onClick={() => clearNotifications()}
                className="rounded-lg p-2 text-sg-muted hover:bg-white/5 hover:text-sg-text"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-sg-muted">
                Nenhuma notificação ainda.
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openItem(item)}
                  className={`flex w-full gap-3 border-b border-sg-border/70 px-4 py-3 text-left transition hover:bg-white/[0.03] ${
                    item.read ? 'opacity-75' : 'bg-sg-red/[0.06]'
                  }`}
                >
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-sg-red/70 bg-sg-red/15 text-sg-red">
                    ⚠
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded-full border border-sg-red/60 bg-sg-red/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-red-100">
                        Atenção
                      </span>
                      {!item.read ? (
                        <span className="h-2 w-2 rounded-full bg-sg-blue" />
                      ) : null}
                      <span className="ml-auto text-[10px] text-sg-muted">{timeLabel(item.createdAt)}</span>
                    </div>
                    <p className="truncate text-sm font-semibold text-sg-text">
                      {item.title.replace(/^🚨\s*/, '')}
                    </p>
                    <p className="mt-0.5 line-clamp-2 whitespace-pre-wrap text-xs text-sg-muted">
                      {item.body}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false)
              navigate('/alertas')
            }}
            className="w-full border-t border-sg-border px-4 py-3 text-center text-xs font-semibold text-sg-blue hover:bg-white/[0.03]"
          >
            Ver Central de Alertas
          </button>
        </div>
      ) : null}
    </div>
  )
}
