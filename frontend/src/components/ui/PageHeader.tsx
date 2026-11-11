import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description: string
  action?: ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-sg-text md:text-3xl">
          {title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-sg-muted">{description}</p>
      </div>
      {action}
    </div>
  )
}
