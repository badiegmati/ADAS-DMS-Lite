import Breadcrumbs from '../a11y/Breadcrumbs'
import useDocumentTitle from '../../hooks/useDocumentTitle'

/** En-tête de page : un seul h1, fil d'Ariane, titre du document, actions à droite. */
export default function PageHeader({ title, subtitle, breadcrumbs, actions }) {
  useDocumentTitle(title)
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <Breadcrumbs items={breadcrumbs} />
        <h1 className="text-gradient font-display text-2xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        <span className="mt-2 block h-1 w-14 rounded-full bg-gradient-to-r from-accent to-transparent" aria-hidden="true" />
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  )
}
