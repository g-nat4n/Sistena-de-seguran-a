interface SelectFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  allowEmpty?: boolean
  emptyLabel?: string
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  allowEmpty = true,
  emptyLabel = 'Todos',
}: SelectFieldProps) {
  return (
    <label className="flex flex-col gap-1 text-xs text-sg-muted">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-sg-border bg-sg-bg px-3 py-2 text-sm text-sg-text outline-none transition focus:border-sg-blue"
      >
        {allowEmpty ? <option value="">{emptyLabel}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
