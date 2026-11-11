export type CameraStatus = 'ONLINE' | 'OFFLINE' | 'MAINTENANCE'
export type CameraType = 'DOME' | 'BULLET' | 'PTZ' | 'FISHEYE' | 'SIMULATED'

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
