import { useEffect, useState } from 'react'
import { fetchDashboardSummary } from '../services/dashboardService'
import type { DashboardSummary } from '../types/dashboard'

export function useDashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const summary = await fetchDashboardSummary()
        if (active) setData(summary)
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar dashboard')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [])

  return { data, loading, error }
}
