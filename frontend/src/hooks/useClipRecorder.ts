import { useCallback, useEffect, useRef } from 'react'

interface UseClipRecorderOptions {
  stream: MediaStream | null
  enabled: boolean
  /** Janela máxima mantida em memória antes do evento. */
  preRollMs?: number
  timesliceMs?: number
}

function pickMimeType(): string | undefined {
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ]
  if (typeof MediaRecorder === 'undefined') return undefined
  return candidates.find((type) => MediaRecorder.isTypeSupported(type))
}

/**
 * Mantém um buffer contínuo do stream e exporta um clipe (pré + pós evento).
 */
export function useClipRecorder({
  stream,
  enabled,
  preRollMs = 8000,
  timesliceMs = 1000,
}: UseClipRecorderOptions) {
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<{ blob: Blob; at: number }[]>([])
  const mimeTypeRef = useRef<string>('video/webm')

  useEffect(() => {
    chunksRef.current = []
    recorderRef.current?.stop()
    recorderRef.current = null

    if (!enabled || !stream || typeof MediaRecorder === 'undefined') {
      return
    }

    const mimeType = pickMimeType()
    mimeTypeRef.current = mimeType ?? 'video/webm'

    let recorder: MediaRecorder
    try {
      recorder = mimeType
        ? new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 1_200_000 })
        : new MediaRecorder(stream)
    } catch {
      return
    }

    recorderRef.current = recorder
    recorder.ondataavailable = (event) => {
      if (!event.data || event.data.size === 0) return
      const now = Date.now()
      chunksRef.current.push({ blob: event.data, at: now })
      const cutoff = now - preRollMs - timesliceMs
      chunksRef.current = chunksRef.current.filter((chunk) => chunk.at >= cutoff)
    }

    try {
      recorder.start(timesliceMs)
    } catch {
      recorderRef.current = null
      return
    }

    return () => {
      if (recorder.state !== 'inactive') {
        try {
          recorder.stop()
        } catch {
          /* ignore */
        }
      }
      recorderRef.current = null
    }
  }, [enabled, stream, preRollMs, timesliceMs])

  const captureClip = useCallback(
    async (postRollMs = 2500): Promise<Blob | null> => {
      const recorder = recorderRef.current
      if (!recorder || recorder.state === 'inactive') {
        return null
      }

      await new Promise<void>((resolve) => {
        const finish = () => resolve()
        const onData = () => {
          recorder.removeEventListener('dataavailable', onData)
          window.setTimeout(finish, postRollMs)
        }
        recorder.addEventListener('dataavailable', onData)
        try {
          recorder.requestData()
        } catch {
          window.setTimeout(finish, postRollMs)
        }
      })

      // coleta mais um chunk pós-evento
      await new Promise<void>((resolve) => {
        const onData = () => {
          recorder.removeEventListener('dataavailable', onData)
          resolve()
        }
        recorder.addEventListener('dataavailable', onData)
        try {
          recorder.requestData()
        } catch {
          resolve()
        }
        window.setTimeout(resolve, 400)
      })

      const parts = chunksRef.current.map((item) => item.blob)
      if (parts.length === 0) return null
      return new Blob(parts, { type: mimeTypeRef.current })
    },
    [],
  )

  return { captureClip }
}
