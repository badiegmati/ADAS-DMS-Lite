import { useCallback, useEffect, useRef, useState } from 'react'
import { errorMessage } from '../api/axios'

/**
 * Charge des données, avec rafraîchissement périodique optionnel.
 * Renvoie { data, loading, error, refresh, updatedAt }.
 *  - loading n'est vrai que pour le 1er chargement (puis refreshing)
 *  - le polling est suspendu quand l'onglet est masqué
 */
export default function usePolling(fetcher, { interval = 0, deps = [], enabled = true } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher
  const alive = useRef(true)

  const load = useCallback(async (silent = false) => {
    if (!enabled) return
    if (silent) setRefreshing(true)
    try {
      const result = await fetcherRef.current()
      if (!alive.current) return
      setData(result)
      setError(null)
      setUpdatedAt(new Date())
    } catch (e) {
      if (!alive.current) return
      setError(errorMessage(e))
    } finally {
      if (alive.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [enabled])

  useEffect(() => {
    alive.current = true
    setLoading(true)
    load(false)
    return () => { alive.current = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, ...deps])

  useEffect(() => {
    if (!interval || !enabled) return undefined
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') load(true)
    }, interval)
    return () => clearInterval(id)
  }, [interval, enabled, load])

  const refresh = useCallback(() => load(true), [load])
  const retry = useCallback(() => { setLoading(true); load(false) }, [load])

  return { data, loading, refreshing, error, refresh, retry, updatedAt, setData }
}
