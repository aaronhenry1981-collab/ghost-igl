// URL builders so the same screens work at /support and in the dev preview
// (/__dev/support?as=…). `keep` is carried on every link (dev scenario only).
export function supportPaths({ base = '', keep = {} } = {}) {
  const withQuery = (path, params = {}) => {
    const q = new URLSearchParams()
    for (const [k, v] of Object.entries({ ...params, ...keep })) if (v !== undefined && v !== null && v !== '') q.set(k, v)
    const s = q.toString()
    return s ? `${path}?${s}` : path
  }
  return {
    support: (params) => withQuery(`${base}/support`, params),
    caseUrl: (n) => withQuery(`${base}/support/cases/${encodeURIComponent(n)}`),
    help: (params) => withQuery(`${base}/help`, params),
    article: (slug) => withQuery(`${base}/help/${encodeURIComponent(slug)}`),
    signIn: (redirect) => `/auth?redirect=${encodeURIComponent(redirect)}`,
    // Article links to /support or /help stay inside the current surface.
    internal: (href) => {
      if (!/^\/(support|help)(\/|\?|$)/.test(href)) return href
      const [path, query = ''] = href.split('?')
      return withQuery(`${base}${path}`, Object.fromEntries(new URLSearchParams(query)))
    },
  }
}

export const LIVE_PATHS = supportPaths()
