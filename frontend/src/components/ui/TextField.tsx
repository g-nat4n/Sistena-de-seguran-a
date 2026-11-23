interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hint?: string
  type?: string
  required?: boolean
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = 'text',
  required,
}: TextFieldProps) {
  return (
    <label className="flex flex-col gap-1 text-xs text-sg-muted">
      {label}
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-sg-border bg-sg-bg px-3 py-2 text-sm text-sg-text outline-none transition placeholder:text-sg-muted/70 focus:border-sg-blue"
      />
      {hint ? <span className="text-[11px] leading-snug text-sg-muted/90">{hint}</span> : null}
    </label>
  )
}
