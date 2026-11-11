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
import type { AlertItem } from '../types/alerts'
import type { Camera } from '../types/camera'
import { formatDateTime, priorityLabel, statusLabel } from '../utils/labels'

export function HistoryPage() {
  const [search, setSearch] = useState('')
  const [cameraId, setCameraId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [items, setItems] = useState<AlertItem[]>([])
  const [cameras, setCameras] = useState<Camera[]>([])
  const [selected, setSelected] = useState<AlertItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const filters = {
        search: search || undefined,
        cameraId: cameraId || undefined,
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(to).toISOString() : undefined,
      }
      const [alerts, cameraData] = await Promise.all([fetchAlerts(filters), fetchCameras()])
      setItems(alerts)
      setCameras(cameraData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar histórico')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <PageHeader
        title="Histórico de Ocorrências"
        description="Consulta de eventos simulados, evidências ilustrativas e alterações de status."
      />

      <div className="mb-4 grid gap-3 rounded-xl border border-sg-border bg-sg-card/80 p-4 md:grid-cols-4">
        <TextField label="Pesquisar" value={search} onChange={setSearch} placeholder="ID, câmera ou descrição" />
        <SelectField
          label="Câmera"
          value={cameraId}
          options={cameras.map((c) => ({ value: String(c.id), label: c.name }))}
          onChange={setCameraId}
        />
        <TextField label="Período (de)" type="datetime-local" value={from} onChange={setFrom} />
        <TextField label="Período (até)" type="datetime-local" value={to} onChange={setTo} />
      </div>

      <div className="mb-4">
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg bg-sg-blue px-4 py-2 text-sm font-medium text-white hover:bg-sg-blue/90"
        >
          Buscar
        </button>
      </div>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}

      {!loading && !error ? (
        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-3 rounded-xl border border-sg-border bg-sg-card/90 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-sg-blue">{item.publicId}</p>
                  <Badge tone="neutral">{statusLabel(item.status)}</Badge>
                  <Badge tone="amber">{priorityLabel(item.priority)}</Badge>
                  {item.simulated ? <Badge>Simulado</Badge> : null}
                </div>
                <p className="mt-1 text-sm text-sg-text">{item.typeLabel}</p>
                <p className="mt-1 text-xs text-sg-muted">
                  {item.cameraName} · {formatDateTime(item.occurredAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={async () => setSelected(await fetchAlertById(item.id))}
                className="rounded-lg border border-sg-border px-3 py-1.5 text-sm hover:border-sg-blue"
              >
                Ver detalhes e evidências
              </button>
            </article>
          ))}
          {items.length === 0 ? (
            <p className="rounded-xl border border-sg-border p-8 text-center text-sm text-sg-muted">
              Nenhuma ocorrência encontrada.
            </p>
          ) : null}
        </div>
      ) : null}

      {selected ? (
        <AlertDetailPanel
          alert={selected}
          onClose={() => setSelected(null)}
          onUpdated={(updated) => {
            setSelected(updated)
            setItems((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)))
          }}
        />
      ) : null}
    </div>
  )
}
