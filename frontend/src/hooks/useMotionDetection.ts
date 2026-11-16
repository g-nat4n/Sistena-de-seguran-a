import { useEffect, useRef, useState, type RefObject } from 'react'
import type { AlertType } from '../types/alerts'
import {
  classifyMotion,
  compareFrames,
  extractGrayscaleFrame,
  type MotionSample,
} from '../utils/motionDetection'

export type AutoMotionAlertType = Extract<
  AlertType,
  'SUSPICIOUS_MOVEMENT' | 'UNUSUAL_DWELL' | 'AFTER_HOURS_MOVEMENT'
>

export interface MotionAlertEvent {
  type: AutoMotionAlertType
  sample: MotionSample
}

interface UseMotionDetectionOptions {
  videoRef: RefObject<HTMLVideoElement | null>
  enabled: boolean
  /** Se true, movimento também dispara alerta de fora do horário. */
  afterHours?: boolean
  intervalMs?: number
  sustainCycles?: number
  dwellSeconds?: number
  cooldownMs?: number
  onAlert?: (event: MotionAlertEvent) => void
}

/**
 * Avalia todas as regras comportamentais disponíveis no protótipo de webcam,
 * sem o operador escolher tipo de alerta.
 */
export function useMotionDetection({
  videoRef,
  enabled,
  afterHours = false,
  intervalMs = 400,
  sustainCycles = 5,
  dwellSeconds = 35,
  cooldownMs = 45000,
  onAlert,
}: UseMotionDetectionOptions) {
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState<'idle' | 'low' | 'suspicious'>('idle')
  const [lastTriggerAt, setLastTriggerAt] = useState<number | null>(null)
  const [activeRules, setActiveRules] = useState<string[]>([
    'Movimentação suspeita',
    'Permanência incomum',
    'Fora do horário (se aplicável)',
  ])

  const previousRef = useRef<Uint8ClampedArray | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streakRef = useRef(0)
  const idleStreakRef = useRef(0)
  const activityStartedRef = useRef<number | null>(null)
  const dwellAlertedRef = useRef(false)
  const lastByTypeRef = useRef<Partial<Record<AutoMotionAlertType, number>>>({})
  const callbackRef = useRef(onAlert)
  const afterHoursRef = useRef(afterHours)

  useEffect(() => {
    callbackRef.current = onAlert
  }, [onAlert])

  useEffect(() => {
    afterHoursRef.current = afterHours
    setActiveRules(
      afterHours
        ? ['Movimentação suspeita', 'Permanência incomum', 'Fora do horário']
        : ['Movimentação suspeita', 'Permanência incomum'],
    )
  }, [afterHours])

  useEffect(() => {
    if (!enabled) {
      previousRef.current = null
      streakRef.current = 0
      idleStreakRef.current = 0
      activityStartedRef.current = null
      dwellAlertedRef.current = false
      setScore(0)
      setLevel('idle')
      return
    }

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas')
    }

    const canEmit = (type: AutoMotionAlertType, now: number) => {
      const last = lastByTypeRef.current[type] ?? 0
      return now - last >= cooldownMs
    }

    const emit = (type: AutoMotionAlertType, sample: MotionSample, now: number) => {
      if (!canEmit(type, now)) return
      lastByTypeRef.current[type] = now
      setLastTriggerAt(now)
      callbackRef.current?.({ type, sample })
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

      const now = Date.now()

      if (nextLevel === 'idle') {
        idleStreakRef.current += 1
        streakRef.current = 0
        if (idleStreakRef.current >= 4) {
          activityStartedRef.current = null
          dwellAlertedRef.current = false
        }
      } else {
        idleStreakRef.current = 0
        if (activityStartedRef.current == null) {
          activityStartedRef.current = now
        }
      }

      // Regra 1: movimentação suspeita (mudança forte e sustentada na cena)
      if (nextLevel === 'suspicious') {
        streakRef.current += 1
      } else {
        streakRef.current = 0
      }

      // Movimento forte sustentado: 1 alerta (fora do horário tem prioridade)
      if (streakRef.current >= sustainCycles && sample.score >= 0.22) {
        streakRef.current = 0
        if (afterHoursRef.current) {
          emit('AFTER_HOURS_MOVEMENT', sample, now)
        } else {
          emit('SUSPICIOUS_MOVEMENT', sample, now)
        }
      }

      // Permanência: só com atividade leve/forte contínua (não idle)
      if (
        activityStartedRef.current != null &&
        !dwellAlertedRef.current &&
        nextLevel !== 'idle' &&
        now - activityStartedRef.current >= dwellSeconds * 1000
      ) {
        dwellAlertedRef.current = true
        emit('UNUSUAL_DWELL', sample, now)
      }
    }, intervalMs)

    return () => window.clearInterval(timer)
  }, [enabled, videoRef, intervalMs, sustainCycles, dwellSeconds, cooldownMs])

  return {
    score,
    level,
    lastTriggerAt,
    scorePercent: Math.round(score * 100),
    activeRules,
  }
}
