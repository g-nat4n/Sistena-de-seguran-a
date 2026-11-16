import { api } from './api'

export interface UploadedEvidence {
  filename: string
  mediaType: string
  url: string
  sizeBytes: number
}

export async function uploadEvidence(blob: Blob, filename: string): Promise<UploadedEvidence> {
  const form = new FormData()
  form.append('file', blob, filename)

  const { data } = await api.post<UploadedEvidence>('/evidence/upload', form, {
    timeout: 60000,
  })
  return data
}
