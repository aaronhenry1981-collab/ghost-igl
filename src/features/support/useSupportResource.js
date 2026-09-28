import { useCallback, useEffect, useState } from 'react'

// Load one support resource: `api[method](...args)`. The key is derived from
// the arguments, so a new case number never flashes the previous case: a
// state that belongs to another key is reported as loading.
export function useSupportResource(api, method, ...args) {
  const key = api && method ? `${method}:${JSON.stringify(args)}` : null
  const [state, setState] = useState({ key: null, status: 'idle', data: null, error: null })
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    if (!key) return undefined
    let cancelled = false
    const parsedArgs = JSON.parse(key.slice(key.indexOf(':') + 1))
    Promise.resolve()
      .then(() => api[method](...parsedArgs))
      .then((data) => { if (!cancelled) setState({ key, status: 'ready', data, error: null }) })
      .catch((error) => { if (!cancelled) setState({ key, status: 'error', data: null, error }) })
    return () => { cancelled = true }
  }, [api, method, key, version])

  if (!key) return { status: 'idle', data: null, error: null, reload }
  if (state.key !== key) return { status: 'loading', data: null, error: null, reload }
  return { ...state, reload }
}
