import { useState } from 'react'
import type { AlertItem, AlertStatus } from '../../types/alerts'
import { Badge } from '../ui/Badge'
import { ALERT_STATUS_OPTIONS, formatDateTime, priorityLabel, statusLabel } from '../../utils/labels'
import { updateAlertStatus } from '../../services/alertService'

interface AlertDetailPanelProps {
  alert: AlertItem
  onUpdated: (alert: AlertItem) => void
  onClose: () => void
}

export function AlertDetailPanel({ alert, onUpdated, onClose }: AlertDetailPanelProps) {
  const [status, setStatus] = useState(alert.status)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const updated = await updateAlertStatus(alert.id, status as AlertStatus, notes || undefined)
      onUpdated(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar status')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-sg-border bg-sg-card shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-sg-border p-4">
          <div>
            <p className="font-display text-xl font-semibold">{alert.publicId}</p>
            <p className="text-sm text-sg-muted">{alert.typeLabel}</p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-sg-muted hover:text-sg-text">
            Fechar
          </button>
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-2">
          <div className="space-y-3">
            {alert.evidenceUrl ? (
              <img
                src={alert.evidenceUrl}
                alt="Evidência ilustrativa simulada"
                className="aspect-video w-full rounded-lg object-cover"
              />
            ) : null}
            <p className="text-sm leading-relaxed text-sg-text">{alert.description}</p>
            <div className="flex flex-wrap gap-2">
              <Badge tone="amber">{priorityLabel(alert.priority)}</Badge>
              <Badge tone="blue">{statusLabel(alert.status)}</Badge>
              {alert.simulated ? <Badge tone="neutral">Evento simulado</Badge> : null}
            </div>
            <p className="text-xs text-sg-muted">
              {alert.cameraName} · {alert.cameraLocation} · {formatDateTime(alert.occurredAt)}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-sg-muted">Atualizar status</p>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-sg-border bg-sg-bg px-3 py-2 text-sm"
              >
                {ALERT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observação da análise (opcional)"
                className="mt-2 min-h-24 w-full rounded-lg border border-sg-border bg-sg-bg px-3 py-2 text-sm"
              />
              {error ? <p className="mt-2 text-xs text-sg-red">{error}</p> : null}
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className="mt-3 rounded-lg bg-sg-blue px-4 py-2 text-sm font-medium text-white transition hover:bg-sg-blue/90 disabled:opacity-60"
              >
                {saving ? 'Salvando...' : 'Salvar status'}
              </button>
            </div>

            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-sg-muted">Histórico de status</p>
              <div className="space-y-2">
                {(alert.history ?? []).length === 0 ? (
                  <p className="text-xs text-sg-muted">Sem alterações registradas.</p>
                ) : (
                  alert.history.map((item) => (
                    <div key={item.id} className="rounded-lg border border-sg-border bg-sg-bg/60 p-2 text-xs">
                      <p className="text-sg-text">
                        {item.previousStatus ? statusLabel(item.previousStatus) : '—'} → {statusLabel(item.newStatus)}
                      </p>
                      <p className="text-sg-muted">
                        {item.changedByName} · {formatDateTime(item.changedAt)}
                      </p>
                      {item.notes ? <p className="mt-1 text-sg-muted">{item.notes}</p> : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
