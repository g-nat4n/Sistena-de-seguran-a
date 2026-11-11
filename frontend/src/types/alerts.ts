export type AlertStatus = 'NEW' | 'UNDER_REVIEW' | 'CONFIRMED' | 'DISCARDED'
export type AlertPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type AlertType =
  | 'POSSIBLE_CONCEALMENT'
  | 'SUSPICIOUS_MOVEMENT'
  | 'RESTRICTED_AREA_ENTRY'
  | 'UNUSUAL_DWELL'
  | 'AFTER_HOURS_MOVEMENT'

export interface AlertEvidence {
  id: number
  mediaUrl: string
  mediaType: string
  caption: string
  createdAt: string
}

export interface OccurrenceHistoryItem {
  id: number
  previousStatus: string | null
  newStatus: string
  notes: string
  changedByName: string
  changedAt: string
}

export interface AlertItem {
  id: number
  publicId: string
  type: AlertType | string
  typeLabel: string
  priority: AlertPriority | string
  status: AlertStatus | string
  description: string
  simulated: boolean
  occurredAt: string
  updatedAt: string
  cameraId: number
  cameraName: string
  cameraLocation: string
  cameraIdentifier: string
  evidenceUrl?: string | null
  evidences: AlertEvidence[]
  history: OccurrenceHistoryItem[]
}

export interface AlertFilters {
  type?: string
  priority?: string
  status?: string
  cameraId?: string
  from?: string
  to?: string
  search?: string
}
