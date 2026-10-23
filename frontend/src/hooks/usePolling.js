import { useEffect, useRef } from 'react'

/**
 * Exécute `callback` immédiatement puis toutes les `intervalMs` millisecondes.
 * Utilisé pour le rafraîchissement automatique des dashboards (5 s) et de la
 * messagerie (5 s), sans dépendre d'une websocket.
 */
export default function usePolling(callback, intervalMs = 5000, enabled = true) {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) return undefined

    savedCallback.current()
    const id = setInterval(() => savedCallback.current(), intervalMs)

    return () => clearInterval(id)
  }, [intervalMs, enabled])
}