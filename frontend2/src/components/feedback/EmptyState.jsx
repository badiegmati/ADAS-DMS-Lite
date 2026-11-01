import { Inbox } from 'lucide-react'

/** État vide pédagogique : explique pourquoi c'est vide et propose une action. */
export default function EmptyState({ icon: Icon = Inbox, title, text, action }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-accent">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </span>
      <h3 className="text-lg font-semibold">{title}</h3>
      {text && <p className="max-w-md text-muted">{text}</p>}
      {action}
    </div>
  )
}
