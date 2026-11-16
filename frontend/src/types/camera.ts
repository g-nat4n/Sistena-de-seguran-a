export type CameraStatus = 'ONLINE' | 'OFFLINE' | 'MAINTENANCE'
export type CameraType = 'DOME' | 'BULLET' | 'PTZ' | 'FISHEYE' | 'SIMULATED'
export type StreamState =
  | 'IDLE'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'ERROR'
  | 'STOPPED'

export interface Camera {
  id: number
  name: string
  identifier: string
  location: string
  type: CameraType | string
  description: string | null
  status: CameraStatus | string
  demoMediaUrl: string | null
  rtspConfigured: boolean
  rtspHost?: string | null
  rtspPort?: number | null
  rtspPath?: string | null
  rtspUsername?: string | null
  streamState?: StreamState | string
  lastSeenAt?: string | null
  lastTestedAt?: string | null
  lastError?: string | null
  updatedAt: string
}

export interface CameraFormData {
  name: string
  identifier: string
  location: string
  type: CameraType
  description: string
  status: CameraStatus
  demoMediaUrl: string
}

export interface CameraRtspConfig {
  host: string
  port: number
  path: string
  username: string
  password?: string
}

export interface StreamActionResult {
  cameraId: number
  streamState: string
  success: boolean
  message: string
}
