import { api } from './api'

export interface DetectionConfigItem {
  id: number
  alertType: string
  alertTypeLabel: string
  defaultPriority: string
  enabled: boolean
  monitoringArea: string
  notes: string
}

export interface StoreSettings {
  id: number
  name: string
  address: string
  phone: string
  businessHoursStart: string
  businessHoursEnd: string
  detectionConfigs: DetectionConfigItem[]
}

export async function fetchStoreSettings(): Promise<StoreSettings> {
  const { data } = await api.get<StoreSettings>('/settings/store')
  return data
}
