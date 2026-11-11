import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  accent?: 'blue' | 'green' | 'red' | 'amber'
  delay?: number
}

const accentMap = {
  blue: 'text-sg-blue bg-sg-blue/10',
  green: 'text-sg-green bg-sg-green/10',
  red: 'text-sg-red bg-sg-red/10',
  amber: 'text-sg-amber bg-sg-amber/10',
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = 'blue',
  delay = 0,
}: StatCardProps) {
  return (
    <article
      className="animate-fade-up rounded-xl border border-sg-border bg-sg-card/90 p-4 shadow-[0_0_0_1px_rgba(38,52,73,0.35)] backdrop-blur-sm transition hover:border-sg-blue/40"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-sg-muted">{title}</p>
          <p className="mt-2 font-display text-3xl font-bold text-sg-text">{value}</p>
          {subtitle ? <p className="mt-1 text-xs text-sg-muted">{subtitle}</p> : null}
        </div>
        <div className={`rounded-lg p-2.5 ${accentMap[accent]}`}>
          <Icon size={20} />
        </div>
      </div>
    </article>
  )
}
