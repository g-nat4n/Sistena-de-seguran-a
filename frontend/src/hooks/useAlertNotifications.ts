import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAlerts } from '../services/alertService'
import {
  ensureNotificationPermission,
  showAlertNotification,
} from '../services/desktopNotify'
import type { AlertItem } from '../types/alerts'
import { usePolling } from './usePolling'

const SEEN_KEY = 'smartguard_seen_alert_ids'

function readSeenIds(): Set<number> {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as number[]
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

function writeSeenIds(ids: Set<number>) {
  const list = [...ids].slice(-300)
  localStorage.setItem(SEEN_KEY, JSON.stringify(list))
}

function alertTitle(alert: AlertItem): string {
  const priority =
    alert.priority === 'CRITICAL' || alert.priority === 'HIGH' ? '🚨 ' : '🔔 '
  return `${priority}SmartGuard · ${alert.typeLabel || 'Novo alerta'}`
}

function alertBody(alert: AlertItem): string {
  const where = [alert.cameraName, alert.cameraLocation].filter(Boolean).join(' · ')
  const desc = (alert.description || '').trim()
  if (where && desc) return `${where}\n${desc}`
  return where || desc || alert.publicId
}

export function useAlertNotifications(enabled: boolean) {
  const navigate = useNavigate()
  const primed = useRef(false)
  const seen = useRef<Set<number>>(readSeenIds())

  useEffect(() => {
    if (!enabled) return
    void ensureNotificationPermission()

    const desktop = (
      window as unknown as {
        smartguardDesktop?: {
          onNotificationClick?: (cb: (data: { alertId?: string }) => void) => void
        }
      }
    ).smartguardDesktop

    desktop?.onNotificationClick?.((data) => {
      const id = data?.alertId ? Number(data.alertId) : NaN
      if (Number.isFinite(id)) {
        navigate('/alertas', { state: { openAlertId: id } })
      } else {
        navigate('/alertas')
      }
    })

    const onCustom = (event: Event) => {
      const detail = (event as CustomEvent<{ alertId?: number | string }>).detail
      const id = detail?.alertId != null ? Number(detail.alertId) : NaN
      if (Number.isFinite(id)) navigate('/alertas', { state: { openAlertId: id } })
      else navigate('/alertas')
    }
    window.addEventListener('smartguard-open-alert', onCustom)
    return () => window.removeEventListener('smartguard-open-alert', onCustom)
  }, [enabled, navigate])

  usePolling(
    async () => {
      if (!enabled) return
      try {
        const alerts = await fetchAlerts({ status: 'NEW' })
        const currentIds = new Set(alerts.map((a) => a.id))

        if (!primed.current) {
          // Primeira passagem: marca os atuais como vistos (não spammar ao abrir o app)
          for (const id of currentIds) seen.current.add(id)
          writeSeenIds(seen.current)
          primed.current = true
          return
        }

        const fresh = alerts.filter((a) => !seen.current.has(a.id))
        for (const alert of fresh) {
          seen.current.add(alert.id)
          await showAlertNotification({
            title: alertTitle(alert),
            body: alertBody(alert),
            alertId: alert.id,
          })
        }
        if (fresh.length > 0) writeSeenIds(seen.current)
      } catch {
        // silencioso: app offline / token expirado
      }
    },
    5000,
    enabled,
  )
}
