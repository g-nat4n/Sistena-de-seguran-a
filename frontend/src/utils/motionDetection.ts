/**
 * Detecção de movimento por diferença de frames (protótipo).
 * Não identifica pessoas, rostos ou biometria.
 */

export interface MotionSample {
  score: number
  changedPixels: number
  totalPixels: number
}

const SAMPLE_WIDTH = 160
const SAMPLE_HEIGHT = 90

export function extractGrayscaleFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): Uint8ClampedArray | null {
  if (video.videoWidth === 0 || video.videoHeight === 0) return null

  canvas.width = SAMPLE_WIDTH
  canvas.height = SAMPLE_HEIGHT
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null

  ctx.drawImage(video, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT)
  const image = ctx.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT)
  const gray = new Uint8ClampedArray(SAMPLE_WIDTH * SAMPLE_HEIGHT)

  for (let i = 0, j = 0; i < image.data.length; i += 4, j += 1) {
    gray[j] = Math.round(image.data[i] * 0.299 + image.data[i + 1] * 0.587 + image.data[i + 2] * 0.114)
  }

  return gray
}

export function compareFrames(
  previous: Uint8ClampedArray,
  current: Uint8ClampedArray,
  pixelThreshold = 28,
): MotionSample {
  const totalPixels = Math.min(previous.length, current.length)
  let changedPixels = 0

  for (let i = 0; i < totalPixels; i += 1) {
    if (Math.abs(previous[i] - current[i]) >= pixelThreshold) {
      changedPixels += 1
    }
  }

  return {
    changedPixels,
    totalPixels,
    score: totalPixels === 0 ? 0 : changedPixels / totalPixels,
  }
}

export function classifyMotion(score: number): 'idle' | 'low' | 'suspicious' {
  if (score >= 0.12) return 'suspicious'
  if (score >= 0.04) return 'low'
  return 'idle'
}
