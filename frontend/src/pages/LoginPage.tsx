import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { TextField } from '../components/ui/TextField'
import { fetchBootstrapInfo, type BootstrapInfo } from '../services/authService'

type Tab = 'login' | 'register'

export function LoginPage() {
  const { user, login, register, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [info, setInfo] = useState<BootstrapInfo | null>(null)
  const [tab, setTab] = useState<Tab>('register')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void fetchBootstrapInfo()
      .then((data) => {
        setInfo(data)
        setTab(data.needsSetup || data.registrationOpen ? 'register' : 'login')
      })
      .catch(() => {
        setInfo({
          needsSetup: true,
          registrationOpen: true,
          hasLocalUsers: false,
          message: 'Primeiro acesso: cadastre o administrador.',
        })
        setTab('register')
      })
  }, [])

  if (!loading && user) {
    return <Navigate to="/" replace />
  }

  const canRegister = Boolean(info?.needsSetup || info?.registrationOpen)

  async function handleLogin(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const cleanEmail = email.trim().toLowerCase()
      await login(cleanEmail, password)
      const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRegister(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      if (password !== confirmPassword) throw new Error('As senhas não coincidem')
      // Reconsulta o estado: evita cadastrar "primeiro admin" com banco já inicializado
      const latest = await fetchBootstrapInfo()
      setInfo(latest)
      if (!latest.needsSetup && !latest.registrationOpen) {
        setTab('login')
        throw new Error('Já existe administrador neste PC. Use a aba Entrar.')
      }
      const cleanEmail = email.trim().toLowerCase()
      await register({ name: name.trim(), email: cleanEmail, password })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no cadastro')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-sg-border bg-sg-card/90 p-6 shadow-2xl backdrop-blur">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sg-blue/15 text-sg-blue">
            <Shield size={20} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">SmartGuard AI</h1>
            <p className="text-sm text-sg-muted">
              {info?.needsSetup ? 'Configuração inicial deste PC' : 'Acesso local'}
            </p>
          </div>
        </div>

        <p className="mb-4 rounded-lg border border-sg-border bg-sg-bg/50 px-3 py-2 text-xs text-sg-muted">
          {info?.message ?? 'Carregando…'} Cada instalação é independente.
        </p>

        {!info?.needsSetup && (
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-sg-border bg-sg-bg/40 p-1">
            <button
              type="button"
              onClick={() => { setTab('login'); setError(null) }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                tab === 'login' ? 'bg-sg-blue text-white' : 'text-sg-muted hover:text-sg-text'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              disabled={!canRegister}
              onClick={() => { setTab('register'); setError(null) }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                tab === 'register' ? 'bg-sg-blue text-white' : 'text-sg-muted hover:text-sg-text'
              }`}
            >
              Cadastrar
            </button>
          </div>
        )}

        {(tab === 'login' && !info?.needsSetup) ? (
          <form onSubmit={handleLogin} className="space-y-3">
            <TextField
              label="E-mail"
              type="email"
              value={email}
              required
              placeholder="Ex.: admin@loja.com"
              onChange={setEmail}
            />
            <TextField
              label="Senha"
              type="password"
              revealable
              value={password}
              required
              placeholder="Sua senha de acesso"
              autoComplete="current-password"
              onChange={setPassword}
            />
            {error ? <p className="text-sm text-sg-red">{error}</p> : null}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-sg-blue px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? 'Entrando...' : 'Entrar'}
            </button>
            {!canRegister && (
              <p className="text-xs text-sg-muted">
                Novos cadastros estão fechados. O administrador libera em Configurações.
              </p>
            )}
            {(window as unknown as { smartguardDesktop?: { resetLocalData: () => Promise<unknown> } }).smartguardDesktop ? (
              <button
                type="button"
                className="w-full text-left text-xs text-sg-muted underline hover:text-sg-text"
                onClick={async () => {
                  const desktop = (window as unknown as {
                    smartguardDesktop?: { resetLocalData: () => Promise<unknown> }
                  }).smartguardDesktop
                  if (!desktop) return
                  const ok = window.confirm(
                    'Isso apaga os usuários desta instalação e volta para o cadastro do administrador. Continuar?',
                  )
                  if (!ok) return
                  try {
                    await desktop.resetLocalData()
                    window.alert('Dados apagados. Feche e abra o SmartGuard de novo.')
                    window.location.reload()
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Falha ao zerar dados')
                  }
                }}
              >
                Não reconhece estes usuários? Zerar esta instalação
              </button>
            ) : null}
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            {info?.needsSetup && (
              <p className="text-xs text-sg-muted">
                O primeiro usuário deste PC será o <strong className="text-sg-text">administrador</strong>.
              </p>
            )}
            <TextField
              label="Seu nome"
              value={name}
              required
              placeholder="Ex.: João Silva"
              onChange={setName}
            />
            <TextField
              label="E-mail"
              type="email"
              value={email}
              required
              placeholder="Ex.: admin@loja.com"
              onChange={setEmail}
            />
            <TextField
              label="Senha"
              type="password"
              revealable
              value={password}
              required
              placeholder="Crie uma senha"
              hint="Guarde esta senha: é o login deste PC."
              autoComplete="new-password"
              onChange={setPassword}
            />
            <TextField
              label="Confirmar senha"
              type="password"
              revealable
              value={confirmPassword}
              required
              placeholder="Digite a senha novamente"
              autoComplete="new-password"
              onChange={setConfirmPassword}
            />
            {error ? <p className="text-sm text-sg-red">{error}</p> : null}
            <button
              type="submit"
              disabled={submitting || (!canRegister && !info?.needsSetup)}
              className="w-full rounded-lg bg-sg-blue px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting
                ? 'Salvando...'
                : info?.needsSetup
                  ? 'Criar administrador e entrar'
                  : 'Criar conta e entrar'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
