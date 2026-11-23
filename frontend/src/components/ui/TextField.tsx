import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hint?: string
  type?: string
  required?: boolean
  /** Mostra botão olho para revelar senha (só faz sentido com type=password). */
  revealable?: boolean
  autoComplete?: string
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = 'text',
  required,
  revealable = false,
  autoComplete,
}: TextFieldProps) {
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === 'password'
  const showToggle = revealable && isPassword
  const inputType = showToggle && revealed ? 'text' : type

  return (
    <label className="flex flex-col gap-1 text-xs text-sg-muted">
      {label}
      <div className="relative">
        <input
          type={inputType}
          value={value}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-lg border border-sg-border bg-sg-bg px-3 py-2 text-sm text-sg-text outline-none transition placeholder:text-sg-muted/70 focus:border-sg-blue ${
            showToggle ? 'pr-10' : ''
          }`}
        />
        {showToggle ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label={revealed ? 'Ocultar senha' : 'Mostrar senha'}
            onClick={() => setRevealed((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-sg-muted transition hover:text-sg-text"
          >
            {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        ) : null}
      </div>
      {hint ? <span className="text-[11px] leading-snug text-sg-muted/90">{hint}</span> : null}
    </label>
  )
}
