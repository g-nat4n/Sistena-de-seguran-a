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

export async function fetchRegistrationOpen(): Promise<boolean> {
  const { data } = await api.get<{ open: boolean }>('/settings/registration')
  return Boolean(data.open)
}

export async function setRegistrationOpen(open: boolean): Promise<boolean> {
  const { data } = await api.put<{ open: boolean }>('/settings/registration', { open })
  return Boolean(data.open)
}

export interface NotificationSettings {
  telegramEnabled: boolean
  telegramBotTokenMasked: string
  telegramBotTokenSet: boolean
  telegramChatIds: string
  emailEnabled: boolean
  smtpHost: string
  smtpPort: number
  smtpUsername: string
  smtpPasswordSet: boolean
  smtpStartTls: boolean
  emailFrom: string
  emailTo: string
  minPriority: string
}

export type NotificationSettingsPayload = {
  telegramEnabled?: boolean
  telegramBotToken?: string
  telegramChatIds?: string
  emailEnabled?: boolean
  smtpHost?: string
  smtpPort?: number
  smtpUsername?: string
  smtpPassword?: string
  smtpStartTls?: boolean
  emailFrom?: string
  emailTo?: string
  minPriority?: string
}

export async function fetchNotificationSettings(): Promise<NotificationSettings> {
  const { data } = await api.get<NotificationSettings>('/settings/notifications')
  return data
}

export async function saveNotificationSettings(
  payload: NotificationSettingsPayload,
): Promise<NotificationSettings> {
  const { data } = await api.put<NotificationSettings>('/settings/notifications', payload)
  return data
}

export async function testNotificationSettings(): Promise<string[]> {
  const { data } = await api.post<{ ok: boolean; results: string[] }>('/settings/notifications/test')
  return data.results ?? []
}
