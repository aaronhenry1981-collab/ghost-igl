import { useCallback, useEffect, useState } from 'react'

// Load one CRM resource. Remount (key) the consumer when `path` changes so a
// previous player's data can never flash on the next player's page.
export function useCrmResource(api, path) {
  const [state, setState] = useState({ status: path ? 'loading' : 'idle', data: null, error: null })
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    if (!path) return undefined
    let cancelled = false
    api.get(path)
      .then((data) => { if (!cancelled) setState({ status: 'ready', data, error: null }) })
      .catch((error) => { if (!cancelled) setState({ status: 'error', data: null, error }) })
    return () => { cancelled = true }
  }, [api, path, version])

  return { ...state, reload }
}
