import { api } from './api'
import type { AlertItem, AlertPriority, AlertType } from '../types/alerts'

export interface SimulateEventPayload {
  type: AlertType
  priority?: AlertPriority
  cameraId?: number
  description?: string
  evidenceUrl?: string
}

export async function simulateEvent(payload: SimulateEventPayload): Promise<AlertItem> {
  const { data } = await api.post<AlertItem>('/simulation/events', payload)
  return data
}

export async function simulateBatch(quantity = 3): Promise<AlertItem[]> {
  const { data } = await api.post<AlertItem[]>(`/simulation/events/batch?quantity=${quantity}`)
  return data
}
