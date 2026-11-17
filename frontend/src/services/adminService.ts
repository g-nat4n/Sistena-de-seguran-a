import { api } from './api'

export type ServerStatus = {
  status: string
  service: string
  mode: string
  database: string
  databaseFile?: string
  vision: string
  serverOnline?: boolean
  localIp?: string
  bindAddress?: string
  apiPort?: number
  startedAt?: string
  uptimeSeconds?: number
  connectedClients?: number
  camerasTotal?: number
  camerasOnline?: number
  streamsActive?: number
  evidenceDir?: string
  backupDir?: string
  dbExists?: boolean
}

export async function fetchServerStatus() {
  const { data } = await api.get<ServerStatus>('/admin/status')
  return data
}

export async function fetchHealth() {
  const { data } = await api.get('/health')
  return data
}

export async function createBackup() {
  const { data } = await api.post('/admin/backup')
  return data as { filename: string; path: string; sizeBytes: number }
}

export async function controlService(action: 'start' | 'stop' | 'restart' | 'status') {
  const { data } = await api.post(`/admin/service/${action}`)
  return data
}

export async function sendHeartbeat(clientId: string) {
  await api.post('/admin/heartbeat', { clientId })
}

export async function createUser(payload: {
  name: string
  email: string
  password: string
  roles: string[]
}) {
  const { data } = await api.post('/auth/users', payload)
  return data
}
