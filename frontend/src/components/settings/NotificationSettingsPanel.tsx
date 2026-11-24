import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { TextField } from '../ui/TextField'
import { useAuth } from '../../contexts/AuthContext'
import {
  fetchNotificationSettings,
  saveNotificationSettings,
  testNotificationSettings,
  type NotificationSettings,
} from '../../services/settingsService'

function splitList(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function joinList(items: string[]): string {
  return [...new Set(items.map((s) => s.trim()).filter(Boolean))].join(', ')
}

export function NotificationSettingsPanel() {
  const { user } = useAuth()
  const [form, setForm] = useState<NotificationSettings | null>(null)
  const [emails, setEmails] = useState<string[]>([])
  const [chats, setChats] = useState<string[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [newChat, setNewChat] = useState('')
  const [botToken, setBotToken] = useState('')
  const [smtpPassword, setSmtpPassword] = useState('')
  const [showTransport, setShowTransport] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetchNotificationSettings()
      .then((data) => {
        setForm(data)
        setEmails(splitList(data.emailTo))
        setChats(splitList(data.telegramChatIds))
        if (!data.smtpHost || !data.telegramBotTokenSet) setShowTransport(true)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Falha ao carregar'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <p className="text-sm text-sg-muted">Carregando notificações…</p>
  }
  if (!form) {
    return <p className="text-sm text-sg-red">{error || 'Não foi possível carregar'}</p>
  }

  function patch(partial: Partial<NotificationSettings>) {
    setForm((prev) => (prev ? { ...prev, ...partial } : prev))
  }

  function addEmail() {
    const value = newEmail.trim().toLowerCase()
    if (!value || !value.includes('@')) {
      setError('Digite um e-mail válido')
      return
    }
    setEmails((prev) => joinList([...prev, value]).split(', ').filter(Boolean))
    setNewEmail('')
    setError(null)
    patch({ emailEnabled: true })
  }

  function addChat() {
    const value = newChat.trim()
    if (!value) {
      setError('Digite o Chat ID do Telegram')
      return
    }
    setChats((prev) => joinList([...prev, value]).split(', ').filter(Boolean))
    setNewChat('')
    setError(null)
    patch({ telegramEnabled: true })
  }

  return (
    <section className="mt-4 rounded-xl border border-sg-border bg-sg-card/90 p-4">
      <h2 className="font-display text-lg font-semibold">Quem recebe os alertas</h2>
      <p className="mt-1 text-xs text-sg-muted">
        Cadastre só o <strong className="text-sg-text">e-mail</strong> ou o{' '}
        <strong className="text-sg-text">Chat ID do Telegram</strong> de quem deve receber.
        A configuração técnica do envio (SMTP / bot) fica abaixo, uma vez só.
      </p>

      <label className="mt-4 block text-xs text-sg-muted">
        Prioridade mínima
        <select
          className="mt-1 w-full max-w-xs rounded-lg border border-sg-border bg-sg-bg px-3 py-2 text-sm text-sg-text"
          value={form.minPriority}
          onChange={(e) => patch({ minPriority: e.target.value })}
        >
          <option value="CRITICAL">Só CRITICAL</option>
          <option value="HIGH">HIGH e CRITICAL</option>
          <option value="MEDIUM">MEDIUM ou superior</option>
          <option value="LOW">Todas</option>
        </select>
      </label>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-sg-border bg-sg-bg/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-sm font-medium text-sg-text">
              <input
                type="checkbox"
                checked={form.emailEnabled}
                onChange={(e) => patch({ emailEnabled: e.target.checked })}
              />
              E-mail
            </label>
            {user?.email ? (
              <button
                type="button"
                className="text-[11px] text-sg-blue underline"
                onClick={() => {
                  setEmails((prev) => joinList([...prev, user.email]).split(', ').filter(Boolean))
                  patch({ emailEnabled: true })
                }}
              >
                Usar meu e-mail
              </button>
            ) : null}
          </div>
          <p className="mt-1 text-[11px] text-sg-muted">Só coloque o e-mail da pessoa. Ex.: dono@loja.com</p>

          <div className="mt-3 flex gap-2">
            <div className="min-w-0 flex-1">
              <TextField
                label="E-mail para receber alertas"
                type="email"
                value={newEmail}
                onChange={setNewEmail}
                placeholder="seu@email.com"
              />
            </div>
            <button
              type="button"
              onClick={addEmail}
              className="mt-5 inline-flex h-10 items-center gap-1 rounded-lg bg-sg-blue px-3 text-sm font-semibold text-white"
            >
              <Plus size={14} />
              Add
            </button>
          </div>

          <ul className="mt-3 space-y-1">
            {emails.length === 0 ? (
              <li className="text-xs text-sg-muted">Nenhum e-mail cadastrado ainda.</li>
            ) : (
              emails.map((email) => (
                <li
                  key={email}
                  className="flex items-center justify-between gap-2 rounded-lg border border-sg-border px-3 py-2 text-sm"
                >
                  <span className="truncate">{email}</span>
                  <button
                    type="button"
                    className="text-sg-muted hover:text-sg-red"
                    onClick={() => setEmails((prev) => prev.filter((e) => e !== email))}
                    aria-label={`Remover ${email}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-lg border border-sg-border bg-sg-bg/40 p-3">
          <label className="flex items-center gap-2 text-sm font-medium text-sg-text">
            <input
              type="checkbox"
              checked={form.telegramEnabled}
              onChange={(e) => patch({ telegramEnabled: e.target.checked })}
            />
            Telegram
          </label>
          <p className="mt-1 text-[11px] text-sg-muted">
            Abra o bot, pegue seu Chat ID (@userinfobot) e cadastre aqui — igual ao e-mail, só o destino.
          </p>

          <div className="mt-3 flex gap-2">
            <div className="min-w-0 flex-1">
              <TextField
                label="Chat ID do Telegram"
                value={newChat}
                onChange={setNewChat}
                placeholder="123456789"
              />
            </div>
            <button
              type="button"
              onClick={addChat}
              className="mt-5 inline-flex h-10 items-center gap-1 rounded-lg bg-sg-blue px-3 text-sm font-semibold text-white"
            >
              <Plus size={14} />
              Add
            </button>
          </div>

          <ul className="mt-3 space-y-1">
            {chats.length === 0 ? (
              <li className="text-xs text-sg-muted">Nenhum Chat ID cadastrado ainda.</li>
            ) : (
              chats.map((chat) => (
                <li
                  key={chat}
                  className="flex items-center justify-between gap-2 rounded-lg border border-sg-border px-3 py-2 text-sm"
                >
                  <span className="truncate">{chat}</span>
                  <button
                    type="button"
                    className="text-sg-muted hover:text-sg-red"
                    onClick={() => setChats((prev) => prev.filter((c) => c !== chat))}
                    aria-label={`Remover ${chat}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <button
        type="button"
        className="mt-4 text-xs font-semibold text-sg-blue underline"
        onClick={() => setShowTransport((v) => !v)}
      >
        {showTransport ? 'Ocultar configuração de envio' : 'Configuração de envio (SMTP / bot) — uma vez'}
      </button>

      {showTransport ? (
        <div className="mt-3 grid gap-4 rounded-lg border border-sg-border bg-sg-bg/30 p-3 xl:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium text-sg-text">Telegram · bot</p>
            <p className="text-[11px] text-sg-muted">Crie no @BotFather e cole o token (vale para todos os Chat IDs).</p>
            <TextField
              label={form.telegramBotTokenSet ? `Token (salvo: ${form.telegramBotTokenMasked})` : 'Token do bot'}
              value={botToken}
              onChange={setBotToken}
              placeholder={form.telegramBotTokenSet ? 'Em branco = manter' : '123456:ABC...'}
              revealable
              type="password"
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-sg-text">E-mail · SMTP</p>
            <p className="text-[11px] text-sg-muted">
              Servidor que envia. Gmail: smtp.gmail.com, porta 587, senha de app.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <TextField label="Host" value={form.smtpHost} onChange={(v) => patch({ smtpHost: v })} placeholder="smtp.gmail.com" />
              <TextField
                label="Porta"
                value={String(form.smtpPort)}
                onChange={(v) => patch({ smtpPort: Number(v) || 587 })}
                placeholder="587"
              />
              <TextField
                label="Usuário"
                value={form.smtpUsername}
                onChange={(v) => patch({ smtpUsername: v })}
                placeholder="seu@email.com"
              />
              <TextField
                label={form.smtpPasswordSet ? 'Senha (vazio = manter)' : 'Senha'}
                type="password"
                revealable
                value={smtpPassword}
                onChange={setSmtpPassword}
              />
              <TextField
                label="Remetente"
                value={form.emailFrom}
                onChange={(v) => patch({ emailFrom: v })}
                placeholder="alertas@loja.com"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-sg-muted">
              <input
                type="checkbox"
                checked={form.smtpStartTls}
                onChange={(e) => patch({ smtpStartTls: e.target.checked })}
              />
              STARTTLS
            </label>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          className="rounded-lg bg-sg-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          onClick={async () => {
            setSaving(true)
            setMessage(null)
            setError(null)
            try {
              const emailTo = joinList(emails)
              const telegramChatIds = joinList(chats)
              const saved = await saveNotificationSettings({
                telegramEnabled: form.telegramEnabled && chats.length > 0,
                telegramBotToken: botToken || undefined,
                telegramChatIds,
                emailEnabled: form.emailEnabled && emails.length > 0,
                smtpHost: form.smtpHost,
                smtpPort: form.smtpPort,
                smtpUsername: form.smtpUsername,
                smtpPassword: smtpPassword || undefined,
                smtpStartTls: form.smtpStartTls,
                emailFrom: form.emailFrom || form.smtpUsername || emails[0] || '',
                emailTo,
                minPriority: form.minPriority,
              })
              setForm(saved)
              setEmails(splitList(saved.emailTo))
              setChats(splitList(saved.telegramChatIds))
              setBotToken('')
              setSmtpPassword('')
              setMessage('Destinos salvos. Use “Enviar teste” para validar.')
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Falha ao salvar')
            } finally {
              setSaving(false)
            }
          }}
        >
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
        <button
          type="button"
          disabled={testing}
          className="rounded-lg border border-sg-border px-4 py-2 text-sm text-sg-text disabled:opacity-60"
          onClick={async () => {
            setTesting(true)
            setMessage(null)
            setError(null)
            try {
              const results = await testNotificationSettings()
              setMessage(results.join(' · '))
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Falha no teste')
            } finally {
              setTesting(false)
            }
          }}
        >
          {testing ? 'Enviando…' : 'Enviar teste'}
        </button>
      </div>

      {message ? <p className="mt-3 text-sm text-sg-green">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-sg-red">{error}</p> : null}
    </section>
  )
}
