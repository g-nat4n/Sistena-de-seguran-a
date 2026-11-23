export type AppNotification = {
  id: string
  title: string
  body: string
  alertId?: string
  createdAt: string
  read: boolean
}

const STORAGE_KEY = 'smartguard_app_notifications'
const MAX_ITEMS = 50
export const NOTIFICATIONS_CHANGED = 'smartguard-notifications-changed'

function readAll(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as AppNotification[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(items: AppNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)))
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_CHANGED))
}

export function listNotifications(): AppNotification[] {
  return readAll()
}

export function unreadNotificationCount(): number {
  return readAll().filter((n) => !n.read).length
}

export function addNotification(input: {
  title: string
  body: string
  alertId?: number | string
}): AppNotification {
  const item: AppNotification = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: String(input.title || 'ATENÇÃO'),
    body: String(input.body || ''),
    alertId: input.alertId != null ? String(input.alertId) : undefined,
    createdAt: new Date().toISOString(),
    read: false,
  }
  const next = [item, ...readAll().filter((n) => n.id !== item.id)]
  writeAll(next)
  return item
}

export function markNotificationRead(id: string) {
  writeAll(readAll().map((n) => (n.id === id ? { ...n, read: true } : n)))
}

export function markAllNotificationsRead() {
  writeAll(readAll().map((n) => ({ ...n, read: true })))
}

export function clearNotifications() {
  writeAll([])
}
