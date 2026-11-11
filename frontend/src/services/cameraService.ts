import { api } from './api'
import type { Camera } from '../types/dashboard'

export async function fetchCameras(): Promise<Camera[]> {
  const { data } = await api.get<Camera[]>('/cameras')
  return data
}

export async function fetchCameraById(id: number): Promise<Camera> {
  const { data } = await api.get<Camera>(`/cameras/${id}`)
  return data
}
