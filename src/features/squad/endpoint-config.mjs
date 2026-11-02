export function squadEndpoints(http, socket) {
  if (!http && !socket) return null
  if (!http || !socket) throw new Error('Both reviewed squad endpoints are required; partial connection is not allowed')
  const h = new URL(http), s = new URL(socket), host = /^[a-z0-9]{10}\.execute-api\.us-east-1\.amazonaws\.com$/
  const old = new Set(['u0k402df6j', 'gc3tzbeeoi', 'lsg71ctsxb', 'uz6jlkc7aa'])
  if (h.protocol !== 'https:' || s.protocol !== 'wss:' || !host.test(h.hostname) || !host.test(s.hostname) || h.pathname.replace(/\/$/, '') !== '/prod' || s.pathname.replace(/\/$/, '') !== '/prod' || [h, s].some(url => url.username || url.password || url.search || url.hash || url.port || old.has(url.hostname.split('.')[0]))) throw new Error('The dedicated reviewed squad API endpoints are required')
  return { http: h.href.replace(/\/$/, ''), socket: s.href.replace(/\/$/, '') }
}
