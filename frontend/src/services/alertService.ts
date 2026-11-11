import { api } from './api'
import type { AlertFilters, AlertItem, AlertStatus } from '../types/alerts'

function toQuery(filters: AlertFilters): string {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value)
  })
  const query = params.toString()
  return query ? `?${query}` : ''
}

export async function fetchAlerts(filters: AlertFilters = {}): Promise<AlertItem[]> {
  const { data } = await api.get<AlertItem[]>(`/alerts${toQuery(filters)}`)
  return data
}

export async function fetchAlertById(id: number): Promise<AlertItem> {
  const { data } = await api.get<AlertItem>(`/alerts/${id}`)
  return data
}

export async function updateAlertStatus(
  id: number,
  status: AlertStatus,
  notes?: string,
): Promise<AlertItem> {
  const { data } = await api.patch<AlertItem>(`/alerts/${id}/status`, { status, notes })
  return data
}
