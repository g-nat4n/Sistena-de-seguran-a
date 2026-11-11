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

export function cameraTypeLabel(type: string): string {
  const map: Record<string, string> = {
    DOME: 'Dome',
    BULLET: 'Bullet',
    PTZ: 'PTZ',
    FISHEYE: 'Olho de peixe',
    SIMULATED: 'Simulada',
  }
  return map[type] ?? type
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export const ALERT_TYPE_OPTIONS = [
  { value: 'POSSIBLE_CONCEALMENT', label: 'Possível ocultação de mercadoria' },
  { value: 'SUSPICIOUS_MOVEMENT', label: 'Movimentação suspeita' },
  { value: 'RESTRICTED_AREA_ENTRY', label: 'Entrada em área restrita' },
  { value: 'UNUSUAL_DWELL', label: 'Permanência incomum' },
  { value: 'AFTER_HOURS_MOVEMENT', label: 'Movimentação fora do horário' },
]

export const ALERT_STATUS_OPTIONS = [
  { value: 'NEW', label: 'Novo' },
  { value: 'UNDER_REVIEW', label: 'Em análise' },
  { value: 'CONFIRMED', label: 'Confirmado' },
  { value: 'DISCARDED', label: 'Descartado' },
]

export const ALERT_PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'CRITICAL', label: 'Crítica' },
]
