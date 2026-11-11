import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  tone?: 'neutral' | 'green' | 'blue' | 'red' | 'amber'
}

const tones = {
  neutral: 'bg-slate-700/50 text-sg-muted border-sg-border',
  green: 'bg-sg-green/15 text-sg-green border-sg-green/30',
  blue: 'bg-sg-blue/15 text-sg-blue border-sg-blue/30',
  red: 'bg-sg-red/15 text-sg-red border-sg-red/30',
  amber: 'bg-sg-amber/15 text-sg-amber border-sg-amber/30',
}

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  )
}
