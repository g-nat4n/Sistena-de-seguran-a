import { useCallback, useEffect, useRef, useState } from 'react'

export type CameraFacing = 'user' | 'environment'

interface UseDeviceCameraOptions {
  facingMode?: CameraFacing
}

export function useDeviceCamera(options: UseDeviceCameraOptions = {}) {
  const { facingMode = 'environment' } = options
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [active, setActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [deviceId, setDeviceId] = useState<string>('')

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setActive(false)
  }, [])

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return
    const list = await navigator.mediaDevices.enumerateDevices()
    setDevices(list.filter((device) => device.kind === 'videoinput'))
  }, [])

  const start = useCallback(async () => {
    setError(null)

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Este navegador não permite acesso à câmera.')
      return
    }

    stop()

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              facingMode: { ideal: facingMode },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setActive(true)
      await refreshDevices()
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Permissão da câmera negada. Autorize o acesso no navegador.'
          : err instanceof DOMException && err.name === 'NotFoundError'
            ? 'Nenhuma câmera foi encontrada neste dispositivo.'
            : 'Não foi possível iniciar a câmera. No celular, use HTTPS ou localhost.'
      setError(message)
      setActive(false)
    }
  }, [deviceId, facingMode, refreshDevices, stop])

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current
    if (!video || !active) return null

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.72)
  }, [active])

  useEffect(() => () => stop(), [stop])

  return {
    videoRef,
    active,
    error,
    devices,
    deviceId,
    setDeviceId,
    start,
    stop,
    captureFrame,
    refreshDevices,
  }
}
