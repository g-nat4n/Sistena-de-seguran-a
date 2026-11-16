import { api } from './api'
import type { Camera, CameraFormData, CameraRtspConfig, StreamActionResult } from '../types/camera'

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

export async function configureCameraRtsp(id: number, payload: CameraRtspConfig): Promise<Camera> {
  const { data } = await api.put<Camera>(`/cameras/${id}/rtsp`, payload)
  return data
}

export async function testCameraRtsp(id: number): Promise<StreamActionResult> {
  const { data } = await api.post<StreamActionResult>(`/cameras/${id}/rtsp/test`)
  return data
}

export async function startCameraStream(id: number): Promise<StreamActionResult> {
  const { data } = await api.post<StreamActionResult>(`/cameras/${id}/stream/start`)
  return data
}

export async function stopCameraStream(id: number): Promise<StreamActionResult> {
  const { data } = await api.post<StreamActionResult>(`/cameras/${id}/stream/stop`)
  return data
}
