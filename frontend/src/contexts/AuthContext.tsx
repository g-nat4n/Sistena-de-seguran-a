import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchMe, getToken, login as loginRequest, logout as logoutRequest } from '../services/authService'
import type { AuthUser } from '../types/auth'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hasRole: (...roles: string[]) => boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function bootstrap() {
      if (!getToken()) {
        setLoading(false)
        return
      }
      try {
        setUser(await fetchMe())
      } catch {
        logoutRequest()
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    void bootstrap()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(email, password) {
        const response = await loginRequest(email, password)
        setUser({
          id: response.userId,
          name: response.name,
          email: response.email,
          roles: response.roles,
        })
      },
      logout() {
        logoutRequest()
        setUser(null)
      },
      hasRole(...roles) {
        if (!user) return false
        return roles.some((role) => user.roles.includes(role))
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
