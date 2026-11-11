import { useEffect, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/PageHeader'
import { SelectField } from '../components/ui/SelectField'
import { TextField } from '../components/ui/TextField'
import { fetchCameras } from '../services/cameraService'
import { simulateBatch, simulateEvent } from '../services/simulationService'
import type { AlertItem, AlertPriority, AlertType } from '../types/alerts'
import type { Camera } from '../types/camera'
import { ALERT_PRIORITY_OPTIONS, ALERT_TYPE_OPTIONS, formatDateTime } from '../utils/labels'

export function SimulatorPage() {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [type, setType] = useState<AlertType>('SUSPICIOUS_MOVEMENT')
  const [priority, setPriority] = useState<AlertPriority | ''>('')
  const [cameraId, setCameraId] = useState('')
  const [description, setDescription] = useState('')
  const [created, setCreated] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetchCameras().then(setCameras).catch(() => setError('Falha ao carregar câmeras'))
  }, [])

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const event = await simulateEvent({
        type,
        priority: priority || undefined,
        cameraId: cameraId ? Number(cameraId) : undefined,
        description: description || undefined,
      })
      setCreated((prev) => [event, ...prev].slice(0, 12))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao gerar evento')
    } finally {
      setLoading(false)
    }
  }

  async function handleBatch() {
    setLoading(true)
    setError(null)
    try {
      const events = await simulateBatch(3)
      setCreated((prev) => [...events, ...prev].slice(0, 12))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao gerar lote')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Simulador de Eventos"
        description="Gera ocorrências fictícias para alimentar a central de alertas. Não usa câmeras físicas nem YOLO."
        action={<Badge tone="amber">Modo simulado</Badge>}
      />

      <div className="mb-4 rounded-xl border border-sg-amber/30 bg-sg-amber/5 px-4 py-3 text-sm text-sg-muted">
        Os eventos criados aqui são claramente marcados como <strong className="text-sg-text">simulados</strong>.
        Não há reconhecimento facial e o sistema não declara crimes automaticamente.
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3 rounded-xl border border-sg-border bg-sg-card/90 p-4">
          <SelectField
            label="Tipo de ocorrência"
            value={type}
            allowEmpty={false}
            options={ALERT_TYPE_OPTIONS}
            onChange={(value) => setType(value as AlertType)}
          />
          <SelectField
            label="Prioridade (opcional)"
            value={priority}
            options={ALERT_PRIORITY_OPTIONS}
            emptyLabel="Automática"
            onChange={(value) => setPriority((value as AlertPriority) || '')}
          />
          <SelectField
            label="Câmera (opcional)"
            value={cameraId}
            options={cameras.map((c) => ({ value: String(c.id), label: `${c.name} (${c.identifier})` }))}
            emptyLabel="Aleatória"
            onChange={setCameraId}
          />
          <TextField
            label="Descrição (opcional)"
            value={description}
            placeholder="Deixe vazio para texto padrão simulado"
            onChange={setDescription}
          />

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => void handleGenerate()}
              className="rounded-lg bg-sg-blue px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? 'Gerando...' : 'Gerar 1 evento'}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => void handleBatch()}
              className="rounded-lg border border-sg-border px-4 py-2 text-sm text-sg-text hover:border-sg-blue"
            >
              Gerar lote (3)
            </button>
          </div>
          {error ? <p className="text-sm text-sg-red">{error}</p> : null}
        </div>

        <div className="rounded-xl border border-sg-border bg-sg-card/90 p-4">
          <h2 className="mb-3 font-display text-lg font-semibold">Últimos gerados nesta sessão</h2>
          <div className="space-y-2">
            {created.map((item) => (
              <div key={item.id} className="rounded-lg border border-sg-border p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-sg-blue">{item.publicId}</span>
                  <Badge tone="neutral">Simulado</Badge>
                </div>
                <p className="mt-1">{item.typeLabel}</p>
                <p className="text-xs text-sg-muted">
                  {item.cameraName} · {formatDateTime(item.occurredAt)}
                </p>
              </div>
            ))}
            {created.length === 0 ? (
              <p className="text-sm text-sg-muted">Nenhum evento gerado ainda nesta sessão.</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
