import { useEffect, useRef, useState, type RefObject } from 'react'
import {
  classifyMotion,
  compareFrames,
  extractGrayscaleFrame,
  type MotionSample,
} from '../utils/motionDetection'

interface UseMotionDetectionOptions {
  videoRef: RefObject<HTMLVideoElement | null>
  enabled: boolean
  intervalMs?: number
  sustainCycles?: number
  cooldownMs?: number
  onSuspiciousMotion?: (sample: MotionSample) => void
}

export function useMotionDetection({
  videoRef,
  enabled,
  intervalMs = 350,
  sustainCycles = 3,
  cooldownMs = 20000,
  onSuspiciousMotion,
}: UseMotionDetectionOptions) {
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState<'idle' | 'low' | 'suspicious'>('idle')
  const [lastTriggerAt, setLastTriggerAt] = useState<number | null>(null)

  const previousRef = useRef<Uint8ClampedArray | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streakRef = useRef(0)
  const lastTriggerRef = useRef(0)
  const callbackRef = useRef(onSuspiciousMotion)

  useEffect(() => {
    callbackRef.current = onSuspiciousMotion
  }, [onSuspiciousMotion])

  useEffect(() => {
    if (!enabled) {
      previousRef.current = null
      streakRef.current = 0
      setScore(0)
      setLevel('idle')
      return
    }

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas')
    }

    const timer = window.setInterval(() => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas) return

      const current = extractGrayscaleFrame(video, canvas)
      if (!current) return

      if (!previousRef.current) {
        previousRef.current = current
        return
      }

      const sample = compareFrames(previousRef.current, current)
      previousRef.current = current

      const nextLevel = classifyMotion(sample.score)
      setScore(sample.score)
      setLevel(nextLevel)

      if (nextLevel === 'suspicious') {
        streakRef.current += 1
      } else {
        streakRef.current = 0
      }

      const now = Date.now()
      if (
        streakRef.current >= sustainCycles &&
        now - lastTriggerRef.current >= cooldownMs
      ) {
        lastTriggerRef.current = now
        streakRef.current = 0
        setLastTriggerAt(now)
        callbackRef.current?.(sample)
      }
    }, intervalMs)

    return () => window.clearInterval(timer)
  }, [enabled, videoRef, intervalMs, sustainCycles, cooldownMs])

  return {
    score,
    level,
    lastTriggerAt,
    scorePercent: Math.round(score * 100),
  }
}
