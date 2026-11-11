interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-sg-red/30 bg-sg-red/5 p-6 text-center">
      <p className="text-sm text-sg-red">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-sg-border bg-sg-card px-3 py-1.5 text-sm text-sg-text transition hover:border-sg-blue"
        >
          Tentar novamente
        </button>
      ) : null}
    </div>
  )
}
