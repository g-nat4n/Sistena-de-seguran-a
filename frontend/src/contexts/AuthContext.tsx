import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  fetchMe,
  getToken,
  login as loginRequest,
  logout as logoutRequest,
  registerUser as registerRequest,
  type RegisterPayload,
} from '../services/authService'
import type { AuthUser } from '../types/auth'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
  hasRole: (...roles: string[]) => boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function toUser(response: {
  userId: number
  name: string
  email: string
  roles: string[] | Set<string>
}): AuthUser {
  return {
    id: response.userId,
    name: response.name,
    email: response.email,
    roles: Array.isArray(response.roles) ? response.roles : [...response.roles],
  }
}

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
        setUser(toUser(await loginRequest(email, password)))
      },
      async register(payload) {
        setUser(toUser(await registerRequest(payload)))
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
