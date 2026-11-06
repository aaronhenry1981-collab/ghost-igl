const PREFIX = 'recon-squad-preview-shell-v1-'
export function createShellCache({ scope, assets, assetHashes, version, cacheStorage, fetchImpl }) {
  const base = new URL(scope)
  if (base.pathname !== '/squad-preview/' || !/^[a-f0-9]{12,64}$/.test(version)) throw new Error('A dedicated preview scope and content version are required')
  if (assets.some(path => typeof path !== 'string' || !/^[a-zA-Z0-9_./-]+$/.test(path))) throw new Error('Shell asset paths must be explicit relative public files')
  const urls = assets.map(path => new URL(path, base))
  if (urls.some(url => url.origin !== base.origin || !url.pathname.startsWith(base.pathname) || url.search || url.hash || url.username || url.password || /\/(?:api|auth|login|billing)(?:\/|$)/.test(url.pathname))) throw new Error('Only explicit public preview shell files may be cached')
  const allowed = new Set(urls.map(url => url.href)), index = new URL('index.html', base).href, name = PREFIX + version
  if (!allowed.has(index)) throw new Error('The public preview index must be listed')
  if (!assetHashes || assets.some(path => !/^[a-f0-9]{64}$/.test(assetHashes[path] || ''))) throw new Error('Every shell file requires its reviewed content hash')
  const hashes = new Map(assets.map((path, i) => [urls[i].href, assetHashes[path]]))
  async function verify(response, url) {
    if (!response?.ok) throw new Error('The preview shell could not be loaded')
    const digest = await crypto.subtle.digest('SHA-256', await response.clone().arrayBuffer())
    const actual = [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('')
    if (actual !== hashes.get(url)) throw new Error('The downloaded shell does not match this release')
  }
  return {
    async install() {
      const cache = await cacheStorage.open(name)
      try {
        await cache.addAll([...allowed].map(url => new Request(url, { credentials: 'omit', cache: 'reload', redirect: 'error' })))
        for (const url of allowed) await verify(await cache.match(url), url)
      } catch (error) { await cacheStorage.delete(name); throw error }
    },
    async activate() {
      const keys = (await cacheStorage.keys()).filter(key => key.startsWith(PREFIX)), previous = keys.filter(key => key !== name).at(-1)
      await Promise.all(keys.filter(key => key !== name && key !== previous).map(key => cacheStorage.delete(key)))
    },
    handle(request) {
      const url = new URL(request.url)
      if (request.method !== 'GET' || url.origin !== base.origin || url.search) return null
      if (url.hash) {
        const plain = new URL(url); plain.hash = ''
        // Only the launcher's explicit display-mode fragment may reuse the
        // public navigation shell. Never normalize private or asset URLs.
        if (request.mode !== 'navigate' || url.hash !== '#local-demo' || ![base.href, index].includes(plain.href)) return null
        url.hash = ''
      }
      const navigation = request.mode === 'navigate' && [base.href, index].includes(url.href)
      if (!navigation && !allowed.has(url.href)) return null
      return (async () => {
        const cache = await cacheStorage.open(name)
        // A worker serves the HTML from its own installed release. New HTML
        // belongs to a waiting worker together with its matching hashed assets.
        const key = navigation ? index : url.href, cached = await cache.match(key)
        if (cached) return cached
        const response = await fetchImpl(new Request(key, { credentials: 'omit', redirect: 'error', cache: 'reload' }))
        await verify(response, key)
        await cache.put(key, response.clone()); return response
      })()
    },
  }
}
