import { cloneElement, useId } from 'react'

/** Champ de formulaire : label associé, aide, erreur liée par aria-describedby. */
export default function Field({ label, error, hint, required, children }) {
  const id = useId()
  const describedBy = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(' ') || undefined
  return (
    <div className="mb-4">
      <label htmlFor={id} className="label">
        {label}{required && <span aria-hidden="true" className="text-risk-critique"> *</span>}
        {required && <span className="sr-only"> (obligatoire)</span>}
      </label>
      {cloneElement(children, {
        id, 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': describedBy,
        'aria-required': required ? 'true' : undefined,
      })}
      {hint && !error && <p id={`${id}-hint`} className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="mt-1 text-sm font-medium text-risk-critique">{error}</p>}
    </div>
  )
}
