import { useEffect, useState } from 'react'
import { AlertDetailPanel } from '../components/alerts/AlertDetailPanel'
import { Badge } from '../components/ui/Badge'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { PageHeader } from '../components/ui/PageHeader'
import { SelectField } from '../components/ui/SelectField'
import { TextField } from '../components/ui/TextField'
import { fetchAlertById, fetchAlerts } from '../services/alertService'
import { fetchCameras } from '../services/cameraService'
import type { AlertFilters, AlertItem } from '../types/alerts'
import type { Camera } from '../types/camera'
import {
  ALERT_PRIORITY_OPTIONS,
  ALERT_STATUS_OPTIONS,
  ALERT_TYPE_OPTIONS,
  formatDateTime,
  priorityLabel,
  statusLabel,
} from '../utils/labels'

export function AlertsPage() {
  const [filters, setFilters] = useState<AlertFilters>({})
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [cameras, setCameras] = useState<Camera[]>([])
  const [selected, setSelected] = useState<AlertItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load(nextFilters = filters) {
    setLoading(true)
    setError(null)
    try {
      const [alertData, cameraData] = await Promise.all([fetchAlerts(nextFilters), fetchCameras()])
      setAlerts(alertData)
      setCameras(cameraData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar alertas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function openDetails(id: number) {
    try {
      setSelected(await fetchAlertById(id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao abrir alerta')
    }
  }

  function priorityTone(priority: string) {
    if (priority === 'CRITICAL' || priority === 'HIGH') return 'red' as const
    if (priority === 'MEDIUM') return 'amber' as const
    return 'neutral' as const
  }

  return (
    <div>
      <PageHeader
        title="Central de Alertas"
        description="Eventos comportamentais simulados. O sistema não identifica pessoas nem declara crimes automaticamente."
      />

      <div className="mb-4 grid gap-3 rounded-xl border border-sg-border bg-sg-card/80 p-4 md:grid-cols-3 xl:grid-cols-6">
        <SelectField
          label="Tipo"
          value={filters.type ?? ''}
          options={ALERT_TYPE_OPTIONS}
          onChange={(type) => setFilters((prev) => ({ ...prev, type }))}
        />
        <SelectField
          label="Prioridade"
          value={filters.priority ?? ''}
          options={ALERT_PRIORITY_OPTIONS}
          onChange={(priority) => setFilters((prev) => ({ ...prev, priority }))}
        />
        <SelectField
          label="Status"
          value={filters.status ?? ''}
          options={ALERT_STATUS_OPTIONS}
          onChange={(status) => setFilters((prev) => ({ ...prev, status }))}
        />
        <SelectField
          label="Câmera"
          value={filters.cameraId ?? ''}
          options={cameras.map((c) => ({ value: String(c.id), label: c.name }))}
          onChange={(cameraId) => setFilters((prev) => ({ ...prev, cameraId }))}
        />
        <TextField
          label="De"
          type="datetime-local"
          value={filters.from ? filters.from.slice(0, 16) : ''}
          onChange={(from) =>
            setFilters((prev) => ({ ...prev, from: from ? new Date(from).toISOString() : undefined }))
          }
        />
        <TextField
          label="Até"
          type="datetime-local"
          value={filters.to ? filters.to.slice(0, 16) : ''}
          onChange={(to) =>
            setFilters((prev) => ({ ...prev, to: to ? new Date(to).toISOString() : undefined }))
          }
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void load(filters)}
          className="rounded-lg bg-sg-blue px-4 py-2 text-sm font-medium text-white hover:bg-sg-blue/90"
        >
          Aplicar filtros
        </button>
        <button
          type="button"
          onClick={() => {
            setFilters({})
            void load({})
          }}
          className="rounded-lg border border-sg-border px-4 py-2 text-sm text-sg-muted hover:text-sg-text"
        >
          Limpar
        </button>
      </div>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}

      {!loading && !error ? (
        <div className="overflow-x-auto rounded-xl border border-sg-border bg-sg-card/90">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-sg-border text-xs uppercase text-sg-muted">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Câmera</th>
                <th className="px-3 py-2">Prioridade</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Quando</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id} className="border-b border-sg-border/70 hover:bg-white/[0.02]">
                  <td className="px-3 py-3 font-medium text-sg-blue">{alert.publicId}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1">
                      <span>{alert.typeLabel}</span>
                      {alert.simulated ? <Badge tone="neutral">Simulado</Badge> : null}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div>
                      <p>{alert.cameraName}</p>
                      <p className="text-xs text-sg-muted">{alert.cameraLocation}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={priorityTone(alert.priority)}>{priorityLabel(alert.priority)}</Badge>
                  </td>
                  <td className="px-3 py-3">{statusLabel(alert.status)}</td>
                  <td className="px-3 py-3 text-sg-muted">{formatDateTime(alert.occurredAt)}</td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => void openDetails(alert.id)}
                      className="rounded-lg border border-sg-border px-3 py-1.5 text-xs hover:border-sg-blue"
                    >
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {alerts.length === 0 ? (
            <p className="p-8 text-center text-sm text-sg-muted">Nenhum alerta para os filtros selecionados.</p>
          ) : null}
        </div>
      ) : null}

      {selected ? (
        <AlertDetailPanel
          alert={selected}
          onClose={() => setSelected(null)}
          onUpdated={(updated) => {
            setSelected(updated)
            setAlerts((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)))
          }}
        />
      ) : null}
    </div>
  )
}
