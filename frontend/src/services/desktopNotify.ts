export type DesktopNotifyPayload = {
  title: string
  body: string
  alertId?: number | string
}

type DesktopBridge = {
  showNotification?: (payload: DesktopNotifyPayload) => Promise<{ ok: boolean }>
  onNotificationClick?: (cb: (data: { alertId?: string }) => void) => void
}

function desktopBridge(): DesktopBridge | undefined {
  return (window as unknown as { smartguardDesktop?: DesktopBridge }).smartguardDesktop
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (desktopBridge()?.showNotification) return true
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export async function showAlertNotification(payload: DesktopNotifyPayload): Promise<void> {
  const desktop = desktopBridge()
  if (desktop?.showNotification) {
    await desktop.showNotification(payload)
    return
  }

  const allowed = await ensureNotificationPermission()
  if (!allowed) return

  const note = new Notification(payload.title, {
    body: payload.body,
    tag: payload.alertId != null ? `smartguard-alert-${payload.alertId}` : 'smartguard-alert',
    requireInteraction: true,
    silent: false,
  })
  note.onclick = () => {
    window.focus()
    if (payload.alertId != null) {
      window.location.hash = `#/alertas`
      window.dispatchEvent(
        new CustomEvent('smartguard-open-alert', { detail: { alertId: payload.alertId } }),
      )
    }
    note.close()
  }
}
