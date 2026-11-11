import { AlertTriangle, Camera, CheckCircle2, Eye, Radio, Search } from 'lucide-react'
import { AlertsByHourChart } from '../components/charts/AlertsByHourChart'
import { AlertsByTypeChart } from '../components/charts/AlertsByTypeChart'
import { RecentAlertsTable } from '../components/alerts/RecentAlertsTable'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { PageHeader } from '../components/ui/PageHeader'
import { StatCard } from '../components/ui/StatCard'
import { Badge } from '../components/ui/Badge'
import { useDashboard } from '../hooks/useDashboard'
import { statusLabel } from '../utils/labels'

function monitoringTone(status: string) {
  if (status === 'OPERACIONAL') return 'green' as const
  if (status === 'ATENCAO') return 'amber' as const
  if (status === 'PARCIAL') return 'blue' as const
  return 'red' as const
}

export function DashboardPage() {
  const { data, loading, error } = useDashboard()

  if (loading) return <LoadingState label="Carregando painel operacional..." />
  if (error || !data) {
    return <ErrorState message={error ?? 'Não foi possível carregar o dashboard'} onRetry={() => window.location.reload()} />
  }

  return (
    <div>
      <PageHeader
        title="Dashboard operacional"
        description="Visão geral do monitoramento simulado da loja. Os indicadores refletem eventos fictícios gerados para o MVP."
        action={<Badge tone={monitoringTone(data.monitoringStatus)}>Status: {statusLabel(data.monitoringStatus)}</Badge>}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard title="Câmeras cadastradas" value={data.totalCameras} icon={Camera} accent="blue" delay={0} />
        <StatCard title="Câmeras online" value={data.onlineCameras} icon={Radio} accent="green" delay={40} />
        <StatCard title="Alertas no dia" value={data.alertsToday} icon={AlertTriangle} accent="amber" delay={80} />
        <StatCard title="Em análise" value={data.underReview} icon={Search} accent="blue" delay={120} />
        <StatCard title="Confirmadas" value={data.confirmed} icon={CheckCircle2} accent="red" delay={160} />
        <StatCard
          title="Monitoramento"
          value={statusLabel(data.monitoringStatus)}
          subtitle={`${data.offlineCameras} offline/manutenção`}
          icon={Eye}
          accent="green"
          delay={200}
        />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="animate-fade-up rounded-xl border border-sg-border bg-sg-card/90 p-4" style={{ animationDelay: '120ms' }}>
          <div className="mb-3">
            <h2 className="font-display text-lg font-semibold">Alertas por horário</h2>
            <p className="text-xs text-sg-muted">Distribuição simulada ao longo do dia (UTC).</p>
          </div>
          <AlertsByHourChart data={data.alertsByHour} />
        </div>

        <div className="animate-fade-up rounded-xl border border-sg-border bg-sg-card/90 p-4" style={{ animationDelay: '180ms' }}>
          <div className="mb-3">
            <h2 className="font-display text-lg font-semibold">Tipos de ocorrência</h2>
            <p className="text-xs text-sg-muted">Últimos 7 dias — eventos marcados como simulados.</p>
          </div>
          <AlertsByTypeChart data={data.alertsByType} />
        </div>
      </section>

      <section className="animate-fade-up mt-6 rounded-xl border border-sg-border bg-sg-card/90 p-4" style={{ animationDelay: '220ms' }}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">Últimos eventos</h2>
            <p className="text-xs text-sg-muted">
              Alertas comportamentais. O sistema não identifica pessoas nem declara crimes.
            </p>
          </div>
          <Badge tone="neutral">Fonte: dados simulados</Badge>
        </div>
        <RecentAlertsTable items={data.recentAlerts} />
      </section>
    </div>
  )
}
