export function LoadingState({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-sg-muted">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-sg-border border-t-sg-blue" />
      <p className="text-sm">{label}</p>
    </div>
  )
}
