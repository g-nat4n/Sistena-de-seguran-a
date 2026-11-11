import { PageHeader } from '../components/ui/PageHeader'
import { Badge } from '../components/ui/Badge'

interface PlaceholderPageProps {
  title: string
  description: string
  phase: string
}

export function PlaceholderPage({ title, description, phase }: PlaceholderPageProps) {
  return (
    <div>
      <PageHeader title={title} description={description} action={<Badge tone="blue">{phase}</Badge>} />
      <div className="rounded-xl border border-dashed border-sg-border bg-sg-card/50 p-8 text-center">
        <p className="font-display text-xl font-semibold text-sg-text">Em construção nesta etapa</p>
        <p className="mx-auto mt-2 max-w-lg text-sm text-sg-muted">
          A estrutura de navegação já está pronta. Esta tela será implementada na próxima fase do MVP,
          conectada à API e aos dados simulados.
        </p>
      </div>
    </div>
  )
}
