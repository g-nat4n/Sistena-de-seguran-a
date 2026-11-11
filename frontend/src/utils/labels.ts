export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    NEW: 'Novo',
    UNDER_REVIEW: 'Em análise',
    CONFIRMED: 'Confirmado',
    DISCARDED: 'Descartado',
    ONLINE: 'Online',
    OFFLINE: 'Offline',
    MAINTENANCE: 'Manutenção',
    OPERACIONAL: 'Operacional',
    ATENCAO: 'Atenção',
    PARCIAL: 'Parcial',
    OFFLINE_MONITOR: 'Offline',
    SEM_CAMERAS: 'Sem câmeras',
  }
  return map[status] ?? status
}

export function priorityLabel(priority: string): string {
  const map: Record<string, string> = {
    LOW: 'Baixa',
    MEDIUM: 'Média',
    HIGH: 'Alta',
    CRITICAL: 'Crítica',
  }
  return map[priority] ?? priority
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso))
}
