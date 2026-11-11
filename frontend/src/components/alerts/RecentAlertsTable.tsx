import { Badge } from '../ui/Badge'
import type { RecentAlertItem } from '../../types/dashboard'
import { formatDateTime, priorityLabel, statusLabel } from '../../utils/labels'

function priorityTone(priority: string) {
  if (priority === 'CRITICAL' || priority === 'HIGH') return 'red' as const
  if (priority === 'MEDIUM') return 'amber' as const
  return 'neutral' as const
}

function statusTone(status: string) {
  if (status === 'CONFIRMED') return 'red' as const
  if (status === 'UNDER_REVIEW') return 'amber' as const
  if (status === 'DISCARDED') return 'neutral' as const
  return 'blue' as const
}

export function RecentAlertsTable({ items }: { items: RecentAlertItem[] }) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-sg-muted">Nenhum evento recente.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-sg-border text-xs uppercase tracking-wide text-sg-muted">
          <tr>
            <th className="px-3 py-2 font-medium">ID</th>
            <th className="px-3 py-2 font-medium">Tipo</th>
            <th className="px-3 py-2 font-medium">Câmera</th>
            <th className="px-3 py-2 font-medium">Prioridade</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Quando</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-sg-border/60 transition hover:bg-white/[0.02]">
              <td className="px-3 py-3 font-medium text-sg-blue">{item.publicId}</td>
              <td className="px-3 py-3">
                <div className="flex flex-col gap-1">
                  <span>{item.typeLabel}</span>
                  {item.simulated ? (
                    <Badge tone="neutral">Simulado</Badge>
                  ) : null}
                </div>
              </td>
              <td className="px-3 py-3">
                <div className="flex flex-col">
                  <span>{item.cameraName}</span>
                  <span className="text-xs text-sg-muted">{item.location}</span>
                </div>
              </td>
              <td className="px-3 py-3">
                <Badge tone={priorityTone(item.priority)}>{priorityLabel(item.priority)}</Badge>
              </td>
              <td className="px-3 py-3">
                <Badge tone={statusTone(item.status)}>{statusLabel(item.status)}</Badge>
              </td>
              <td className="px-3 py-3 text-sg-muted">{formatDateTime(item.occurredAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
