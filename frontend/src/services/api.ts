import axios from 'axios'
import { clearToken, getToken } from './tokenStorage'

function resolveBaseUrl() {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const fromQuery = params.get('api')
    if (fromQuery) return fromQuery
    const injected = (window as unknown as { __SMARTGUARD_API_BASE_URL__?: string }).__SMARTGUARD_API_BASE_URL__
    if (injected) return injected
  }
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
}

export const api = axios.create({
  baseURL: resolveBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

if (typeof window !== 'undefined') {
  const desktop = (window as unknown as {
    smartguardDesktop?: { onConfig?: (cb: (cfg: { apiBaseUrl: string }) => void) => void }
  }).smartguardDesktop
  desktop?.onConfig?.((cfg) => {
    if (cfg?.apiBaseUrl) {
      api.defaults.baseURL = cfg.apiBaseUrl
      ;(window as unknown as { __SMARTGUARD_API_BASE_URL__?: string }).__SMARTGUARD_API_BASE_URL__ = cfg.apiBaseUrl
    }
  })
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken()
    }
    const message =
      error.response?.data?.message ??
      error.message ??
      'Falha ao comunicar com a API'
    return Promise.reject(new Error(message))
  },
)
