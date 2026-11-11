import { useEffect, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { PageHeader } from '../components/ui/PageHeader'
import { useAuth } from '../contexts/AuthContext'
import { fetchUsers } from '../services/authService'
import { fetchStoreSettings, type StoreSettings } from '../services/settingsService'
import type { AuthUser } from '../types/auth'
import { priorityLabel } from '../utils/labels'

export function SettingsPage() {
  const { hasRole } = useAuth()
  const canManage = hasRole('ADMIN', 'MANAGER')
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [users, setUsers] = useState<AuthUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!canManage) {
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const [store, userList] = await Promise.all([fetchStoreSettings(), fetchUsers()])
        setSettings(store)
        setUsers(userList)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao carregar configurações')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [canManage])

  if (!canManage) {
    return (
      <div>
        <PageHeader
          title="Configurações"
          description="Gerencie loja, usuários e áreas de monitoramento."
        />
        <ErrorState message="Acesso restrito a Administrador e Gerente." />
      </div>
    )
  }

  if (loading) return <LoadingState />
  if (error || !settings) return <ErrorState message={error ?? 'Configurações indisponíveis'} />

  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Dados da loja, perfis e prioridades de detecção simulada."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-xl border border-sg-border bg-sg-card/90 p-4">
          <h2 className="font-display text-lg font-semibold">Loja</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div><dt className="text-xs text-sg-muted">Nome</dt><dd>{settings.name}</dd></div>
            <div><dt className="text-xs text-sg-muted">Endereço</dt><dd>{settings.address}</dd></div>
            <div><dt className="text-xs text-sg-muted">Telefone</dt><dd>{settings.phone}</dd></div>
            <div>
              <dt className="text-xs text-sg-muted">Horário comercial</dt>
              <dd>{settings.businessHoursStart} — {settings.businessHoursEnd}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-sg-border bg-sg-card/90 p-4">
          <h2 className="font-display text-lg font-semibold">Usuários e permissões</h2>
          <div className="mt-3 space-y-2">
            {users.map((user) => (
              <div key={user.id} className="rounded-lg border border-sg-border p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{user.name}</p>
                  {user.roles.map((role) => (
                    <Badge key={role} tone="blue">{role}</Badge>
                  ))}
                </div>
                <p className="text-xs text-sg-muted">{user.email}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-4 rounded-xl border border-sg-border bg-sg-card/90 p-4">
        <h2 className="font-display text-lg font-semibold">Áreas / prioridades de monitoramento</h2>
        <p className="mt-1 text-xs text-sg-muted">
          Configurações comportamentais. Sem biometria e sem declaração automática de crime.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-sg-border text-xs uppercase text-sg-muted">
              <tr>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Prioridade</th>
                <th className="px-3 py-2">Área</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {settings.detectionConfigs.map((cfg) => (
                <tr key={cfg.id} className="border-b border-sg-border/70">
                  <td className="px-3 py-3">{cfg.alertTypeLabel}</td>
                  <td className="px-3 py-3">{priorityLabel(cfg.defaultPriority)}</td>
                  <td className="px-3 py-3 text-sg-muted">{cfg.monitoringArea}</td>
                  <td className="px-3 py-3">
                    <Badge tone={cfg.enabled ? 'green' : 'neutral'}>
                      {cfg.enabled ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
