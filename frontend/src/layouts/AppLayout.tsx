import { NavLink, Outlet } from 'react-router-dom'
import {
  Activity,
  Bell,
  Camera,
  History,
  LayoutDashboard,
  Settings,
  Shield,
  Sparkles,
  Video,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/monitoramento', label: 'Monitoramento', icon: Video },
  { to: '/alertas', label: 'Central de Alertas', icon: Bell },
  { to: '/historico', label: 'Histórico', icon: History },
  { to: '/cameras', label: 'Câmeras', icon: Camera },
  { to: '/simulador', label: 'Simulador', icon: Sparkles },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
]

export function AppLayout() {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[260px] border-r border-sg-border bg-[#0a1220]/95 backdrop-blur-md transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-sg-border px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sg-blue/15 text-sg-blue">
            <Shield size={18} />
          </div>
          <div>
            <p className="font-display text-sm font-bold tracking-wide text-sg-text">SmartGuard AI</p>
            <p className="text-[11px] text-sg-muted">Monitoramento inteligente</p>
          </div>
        </div>

        <nav className="space-y-1 p-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  isActive
                    ? 'bg-sg-blue/15 text-sg-text shadow-[inset_0_0_0_1px_rgba(59,130,246,0.35)]'
                    : 'text-sg-muted hover:bg-white/[0.03] hover:text-sg-text'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-sg-border p-4">
          <div className="rounded-lg border border-sg-border bg-sg-card/70 p-3">
            <div className="mb-1 flex items-center gap-2 text-xs text-sg-muted">
              <Activity size={13} className="text-sg-green" />
              Modo MVP
            </div>
            <p className="text-xs leading-relaxed text-sg-muted">
              Eventos e câmeras são simulados. Sem reconhecimento facial.
            </p>
          </div>
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-sg-border bg-[#0b1120]/80 px-4 backdrop-blur-md md:px-6">
          <button
            type="button"
            className="rounded-lg border border-sg-border px-3 py-1.5 text-sm text-sg-muted lg:hidden"
            onClick={() => setOpen(true)}
          >
            Menu
          </button>
          <div className="hidden items-center gap-2 text-sm text-sg-muted lg:flex">
            <span className="inline-flex h-2 w-2 animate-pulse-dot rounded-full bg-sg-green" />
            Sistema em operação simulada
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm font-medium text-sg-text">Operação Demo</p>
            <p className="text-xs text-sg-muted">Loja demonstrativa</p>
          </div>
        </header>

        <main className="px-4 py-6 md:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
