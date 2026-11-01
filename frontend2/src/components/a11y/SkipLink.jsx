/** Lien d'évitement : premier élément focusable de la page (WCAG 2.4.1). */
export default function SkipLink({ target = '#contenu' }) {
  return (
    <a
      href={target}
      className="sr-only-focusable fixed left-4 top-4 z-[100] rounded-xl bg-accent px-4 py-2 font-semibold text-bg"
    >
      Aller au contenu principal
    </a>
  )
}
