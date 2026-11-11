import { api } from './api'
import type { Camera, CameraFormData } from '../types/camera'

export async function fetchCameras(): Promise<Camera[]> {
  const { data } = await api.get<Camera[]>('/cameras')
  return data
}

export async function fetchCameraById(id: number): Promise<Camera> {
  const { data } = await api.get<Camera>(`/cameras/${id}`)
  return data
}

export async function createCamera(payload: CameraFormData): Promise<Camera> {
  const { data } = await api.post<Camera>('/cameras', payload)
  return data
}

export async function updateCamera(id: number, payload: CameraFormData): Promise<Camera> {
  const { data } = await api.put<Camera>(`/cameras/${id}`, payload)
  return data
}

export async function deleteCamera(id: number): Promise<void> {
  await api.delete(`/cameras/${id}`)
}
