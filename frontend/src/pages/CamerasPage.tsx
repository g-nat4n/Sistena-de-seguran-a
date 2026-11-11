import { useEffect, useState, type FormEvent } from 'react'
import { Badge } from '../components/ui/Badge'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { PageHeader } from '../components/ui/PageHeader'
import { SelectField } from '../components/ui/SelectField'
import { TextField } from '../components/ui/TextField'
import {
  createCamera,
  deleteCamera,
  fetchCameras,
  updateCamera,
} from '../services/cameraService'
import type { Camera, CameraFormData, CameraStatus, CameraType } from '../types/camera'
import { cameraTypeLabel, statusLabel } from '../utils/labels'

const emptyForm: CameraFormData = {
  name: '',
  identifier: '',
  location: '',
  type: 'SIMULATED',
  description: '',
  status: 'ONLINE',
  demoMediaUrl: '',
}

export function CamerasPage() {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [form, setForm] = useState<CameraFormData>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setCameras(await fetchCameras())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar câmeras')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function startEdit(camera: Camera) {
    setEditingId(camera.id)
    setForm({
      name: camera.name,
      identifier: camera.identifier,
      location: camera.location,
      type: camera.type as CameraType,
      description: camera.description ?? '',
      status: camera.status as CameraStatus,
      demoMediaUrl: camera.demoMediaUrl ?? '',
    })
    setMessage(null)
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      if (editingId) {
        await updateCamera(editingId, form)
        setMessage('Câmera atualizada com sucesso.')
      } else {
        await createCamera(form)
        setMessage('Câmera cadastrada com sucesso.')
      }
      resetForm()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar câmera')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Excluir esta câmera? Só funciona se não houver alertas vinculados.')) return
    setError(null)
    try {
      await deleteCamera(id)
      setMessage('Câmera removida.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir câmera')
    }
  }

  return (
    <div>
      <PageHeader
        title="Gerenciamento de Câmeras"
        description="Cadastro manual sem exigir endereço RTSP. Ideal para o MVP com câmeras fictícias."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-sg-border bg-sg-card/90 p-4">
          <h2 className="font-display text-lg font-semibold">
            {editingId ? 'Editar câmera' : 'Nova câmera'}
          </h2>
          <TextField label="Nome" value={form.name} required onChange={(name) => setForm((p) => ({ ...p, name }))} />
          <TextField
            label="Identificação"
            value={form.identifier}
            required
            onChange={(identifier) => setForm((p) => ({ ...p, identifier }))}
          />
          <TextField
            label="Localização"
            value={form.location}
            required
            onChange={(location) => setForm((p) => ({ ...p, location }))}
          />
          <SelectField
            label="Tipo"
            value={form.type}
            allowEmpty={false}
            options={[
              { value: 'SIMULATED', label: 'Simulada' },
              { value: 'DOME', label: 'Dome' },
              { value: 'BULLET', label: 'Bullet' },
              { value: 'PTZ', label: 'PTZ' },
              { value: 'FISHEYE', label: 'Olho de peixe' },
            ]}
            onChange={(type) => setForm((p) => ({ ...p, type: type as CameraType }))}
          />
          <SelectField
            label="Status"
            value={form.status}
            allowEmpty={false}
            options={[
              { value: 'ONLINE', label: 'Online' },
              { value: 'OFFLINE', label: 'Offline' },
              { value: 'MAINTENANCE', label: 'Manutenção' },
            ]}
            onChange={(status) => setForm((p) => ({ ...p, status: status as CameraStatus }))}
          />
          <TextField
            label="Descrição"
            value={form.description}
            onChange={(description) => setForm((p) => ({ ...p, description }))}
          />
          <TextField
            label="URL de mídia demonstrativa"
            value={form.demoMediaUrl}
            placeholder="https://..."
            onChange={(demoMediaUrl) => setForm((p) => ({ ...p, demoMediaUrl }))}
          />
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-sg-blue px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Cadastrar'}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-sg-border px-4 py-2 text-sm text-sg-muted"
              >
                Cancelar
              </button>
            ) : null}
          </div>
          {message ? <p className="text-sm text-sg-green">{message}</p> : null}
          {error ? <p className="text-sm text-sg-red">{error}</p> : null}
        </form>

        <div className="rounded-xl border border-sg-border bg-sg-card/90 p-4">
          <h2 className="mb-3 font-display text-lg font-semibold">Câmeras cadastradas</h2>
          {loading ? <LoadingState /> : null}
          {!loading && error && cameras.length === 0 ? <ErrorState message={error} onRetry={() => void load()} /> : null}
          <div className="space-y-3">
            {cameras.map((camera) => (
              <div
                key={camera.id}
                className="flex flex-col gap-3 rounded-lg border border-sg-border p-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{camera.name}</p>
                    <Badge tone={camera.status === 'ONLINE' ? 'green' : 'amber'}>{statusLabel(camera.status)}</Badge>
                  </div>
                  <p className="text-xs text-sg-muted">
                    {camera.identifier} · {camera.location} · {cameraTypeLabel(camera.type)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(camera)}
                    className="rounded-lg border border-sg-border px-3 py-1.5 text-xs hover:border-sg-blue"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(camera.id)}
                    className="rounded-lg border border-sg-red/40 px-3 py-1.5 text-xs text-sg-red hover:bg-sg-red/10"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
