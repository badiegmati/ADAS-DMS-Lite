import { useEffect } from 'react'

/** Titre de page dynamique (WCAG 2.4.2) : « Page — ADAS-DMS Lite ». */
export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — ADAS-DMS Lite` : 'ADAS-DMS Lite'
  }, [title])
}
