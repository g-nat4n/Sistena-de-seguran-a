import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { TextField } from '../components/ui/TextField'

export function LoginPage() {
  const { user, login, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('admin@smartguard.local')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await login(email, password)
      const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-sg-border bg-sg-card/90 p-6 shadow-2xl backdrop-blur">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sg-blue/15 text-sg-blue">
            <Shield size={20} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">SmartGuard AI</h1>
            <p className="text-sm text-sg-muted">Acesso ao monitoramento simulado</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <TextField label="E-mail" type="email" value={email} required onChange={setEmail} />
          <TextField label="Senha" type="password" value={password} required onChange={setPassword} />
          {error ? <p className="text-sm text-sg-red">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-sg-blue px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-4 rounded-lg border border-sg-border bg-sg-bg/60 p-3 text-xs text-sg-muted">
          <p className="mb-1 font-medium text-sg-text">Contas demo (senha: admin123)</p>
          <p>admin@smartguard.local · ADMIN</p>
          <p>gerente@smartguard.local · MANAGER</p>
          <p>operador@smartguard.local · OPERATOR</p>
        </div>
      </div>
    </div>
  )
}
