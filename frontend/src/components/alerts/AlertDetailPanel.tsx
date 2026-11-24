import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { AlertItem, AlertStatus } from '../../types/alerts'
import { Badge } from '../ui/Badge'
import { ALERT_STATUS_OPTIONS, formatDateTime, priorityLabel, statusLabel } from '../../utils/labels'
import { deleteAlert, updateAlertStatus } from '../../services/alertService'

interface AlertDetailPanelProps {
  alert: AlertItem
  onUpdated: (alert: AlertItem) => void
  onClose: () => void
  onDeleted?: (id: number) => void
}

function isVideoEvidence(url: string): boolean {
  const lower = url.toLowerCase()
  return lower.includes('.webm') || lower.includes('.mp4') || lower.includes('video/')
}

export function AlertDetailPanel({ alert, onUpdated, onClose, onDeleted }: AlertDetailPanelProps) {
  const [status, setStatus] = useState(alert.status)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
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

  async function handleDelete() {
    if (!window.confirm(`Excluir o alerta ${alert.publicId}? Esta ação não pode ser desfeita.`)) return
    setDeleting(true)
    setError(null)
    try {
      await deleteAlert(alert.id)
      onDeleted?.(alert.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir alerta')
    } finally {
      setDeleting(false)
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
            {(alert.evidences?.length ? alert.evidences : alert.evidenceUrl
              ? [{ id: 0, mediaUrl: alert.evidenceUrl, mediaType: isVideoEvidence(alert.evidenceUrl) ? 'video' : 'image', caption: '', createdAt: alert.occurredAt }]
              : []
            ).map((ev) => (
              <div key={ev.id || ev.mediaUrl} className="space-y-1">
                {isVideoEvidence(ev.mediaUrl) || ev.mediaType === 'video' ? (
                  <video
                    src={ev.mediaUrl}
                    controls
                    playsInline
                    className="aspect-video w-full rounded-lg bg-black object-contain"
                  />
                ) : (
                  <img
                    src={ev.mediaUrl}
                    alt={ev.caption || 'Evidência do alerta'}
                    className="aspect-video w-full rounded-lg object-cover"
                  />
                )}
                {ev.caption ? <p className="text-[11px] text-sg-muted">{ev.caption}</p> : null}
              </div>
            ))}
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
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={saving || deleting}
                  onClick={() => void handleSave()}
                  className="rounded-lg bg-sg-blue px-4 py-2 text-sm font-medium text-white transition hover:bg-sg-blue/90 disabled:opacity-60"
                >
                  {saving ? 'Salvando...' : 'Salvar status'}
                </button>
                <button
                  type="button"
                  disabled={saving || deleting}
                  onClick={() => void handleDelete()}
                  className="inline-flex items-center gap-1 rounded-lg border border-sg-red/40 px-4 py-2 text-sm text-sg-red hover:bg-sg-red/10 disabled:opacity-60"
                >
                  <Trash2 size={14} />
                  {deleting ? 'Excluindo...' : 'Excluir alerta'}
                </button>
              </div>
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
