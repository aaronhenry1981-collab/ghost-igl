export class StaleAccountError extends Error {
  constructor() { super('The signed-in account changed. Open the squad again.'); this.name = 'StaleAccountError' }
}
export function createRemoteSquadAdapter({ baseUrl, getIdentity, getCurrentSubject,
  fetchImpl = globalThis.fetch, online = () => globalThis.navigator?.onLine !== false,
  viewCache, timeoutMs = 10_000, trustedOrigins = [] }) {
  if (!getIdentity || !getCurrentSubject) throw new Error('An account-bound authentication adapter is required')
  const base = baseUrl ? new URL(baseUrl) : null
  if (base && (base.username || base.password || base.search || base.hash || !trustedOrigins.includes(base.origin) || (base.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(base.hostname)))) throw new Error('The squad endpoint is not an approved HTTPS origin')
  let generation = 0, boundSubject = null
  const pending = new Set()
  const clearCache = subject => { try { viewCache?.clear(subject); return true } catch { return false } }
  async function request(path, { method = 'GET', body } = {}) {
    if (!base) throw new Error('The website is not connected to a squad backend. Local demo rooms cannot connect phones.')
    if (!online()) throw new Error('Offline — cached viewing only. Reconnect before making a squad decision.')
    const beforeIdentity = generation, identity = await getIdentity()
    if (beforeIdentity !== generation || identity?.subject !== getCurrentSubject()) throw new StaleAccountError()
    if (boundSubject && boundSubject !== identity?.subject) {
      generation++; pending.forEach(controller => controller.abort()); pending.clear(); clearCache(boundSubject)
    }
    boundSubject = identity?.subject || null
    const mine = generation
    const current = () => mine === generation && identity?.subject === getCurrentSubject()
    if (!identity?.subject || !identity.token) throw new Error('Sign in to your existing Recon account.')
    if (!current()) throw new StaleAccountError()
    const controller = new AbortController(); pending.add(controller)
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await fetchImpl(`${base.href.replace(/\/$/, '')}${path}`, {
        method, signal: controller.signal, cache: 'no-store', credentials: 'omit',
        headers: { Authorization: `Bearer ${identity.token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      })
      if (!current()) throw new StaleAccountError()
      const payload = await response.json()
      if (!current()) throw new StaleAccountError()
      if (!response.ok) { const error = new Error(payload.error || `Squad request failed (${response.status})`); error.status = response.status; error.code = payload.code; throw error }
      if (payload.room) { try { viewCache?.save(identity.subject, payload) } catch { payload.cacheStatus = 'unavailable' } }
      return payload
    } catch (error) {
      if (!current()) throw new StaleAccountError()
      if (method !== 'GET' && !error.status) {
        const uncertain = new Error('The change may have reached the server. Refresh the squad before repeating it.'); uncertain.uncertain = true; uncertain.cause = error; throw uncertain
      }
      throw error
    } finally { clearTimeout(timer); pending.delete(controller) }
  }
  return {
    kind: 'authenticated_http', realtimeConnected: false,
    grant: () => request('/squads/me/grant'),
    profile: () => request('/squads/me/profile'),
    history: () => request('/squads/me/history'),
    create: (alias, requestId) => request('/squads', { method: 'POST', body: { alias, requestId } }),
    join: body => request('/squads/join', { method: 'POST', body }),
    snapshot: roomId => request(`/squads/${encodeURIComponent(roomId)}`),
    command: (roomId, command) => request(`/squads/${encodeURIComponent(roomId)}/commands`, { method: 'POST', body: command }),
    socketTicket: (roomId, requestId) => request(`/squads/${encodeURIComponent(roomId)}/socket-ticket`, { method: 'POST', body: { requestId } }),
    rotateInvite: (roomId, requestId) => request(`/squads/${encodeURIComponent(roomId)}/invite`, { method: 'POST', body: { requestId } }),
    updateProfile: (roomId, fields) => request(`/squads/${encodeURIComponent(roomId)}/profile`, { method: 'PUT', body: fields }),
    cached: roomId => { const subject = getCurrentSubject(); return subject ? viewCache?.read(subject, roomId) || null : null },
    disconnect({ clearAccountCache = true } = {}) {
      const subject = boundSubject || getCurrentSubject(); generation++; boundSubject = null; pending.forEach(controller => controller.abort()); pending.clear()
      return { cacheCleared: !subject || !clearAccountCache || clearCache(subject) }
    },
  }
}
