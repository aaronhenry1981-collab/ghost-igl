import { currentIdToken, isCustomerSuccessConfigured } from '../../lib/customerSuccess'

// Support API client (contract: docs/player-success/API-CONTRACT.md, generated
// from the real backend by scripts/support/generate-fixtures.mjs).
//
// `createSupportClient(transport)` exposes typed methods over any transport
// with `request(method, path, { body, auth, signal, timeoutMs })`:
//   - live:    Cognito ID token → customer-success API (same base URL and
//              header as crmApi.js / lib/customerSuccess.js), with timeouts
//   - CRM:     wraps the CRM console's injected `api` (get/post/put)
//   - fixture: dev preview only (fixtures/transport.js), fictional data
// The player methods take no player identifier: the server derives identity
// from the verified token, so the client cannot ask for someone else's case.

const CS_API_URL = String(import.meta.env.VITE_CUSTOMER_SUCCESS_API_URL || '').replace(/\/$/, '')
const DEFAULT_TIMEOUT_MS = 15_000
const TRIAGE_TIMEOUT_MS = 8_000

export function supportError(message, { status = 0, code = null, detail = null } = {}) {
  const err = new Error(message)
  err.status = status
  err.code = code
  err.detail = detail
  return err
}

// Errors the UI branches on. With features.support off the API has no
// support routes at all, so every call gets the app's catch-all 404 body
// `{ error: 'not found' }`; a missing case or article is a 404 with its own
// message ('case not found', 'article not found') and is NOT "not enabled".
export function isNotEnabled(err) {
  return err?.code === 'not_enabled' || err?.code === 'not_configured' || (err?.status === 404 && !err?.code && err?.detail?.error === 'not found')
}
export function isVersionConflict(err) {
  return err?.status === 409 && err?.code === 'version_conflict'
}
export function isUploadDisabled(errOrResult) {
  return errOrResult?.code === 'upload_disabled' || errOrResult?.status === 'upload_disabled' || errOrResult?.error === 'upload_disabled'
}
export function isSignedOut(err) {
  return err?.code === 'signed_out' || err?.status === 401
}

export function errorMessage(err, fallback = 'Something went wrong on our side.') {
  if (!err) return fallback
  if (err.code === 'timeout') return 'That took too long. Check your connection and try again.'
  if (err.code === 'network') return "Couldn't reach Recon. Check your connection and try again."
  if (isSignedOut(err)) return 'Your session expired. Sign in again.'
  if (err.status === 403) return "You don't have access to this."
  if (isVersionConflict(err)) return 'This case changed since you opened it. Reload and try again.'
  if (err.status === 409) return err.message || "That can't be done in the case's current state. Reload and try again."
  if (err.status === 429) return 'Too many requests. Give it a minute.'
  return err.message || fallback
}

export function createLiveSupportTransport({ baseUrl = CS_API_URL, getToken = currentIdToken, fetchImpl = (...a) => fetch(...a) } = {}) {
  return {
    mode: 'live',
    configured: Boolean(baseUrl),
    async request(method, path, { body, auth = true, signal, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
      if (!baseUrl) throw supportError('Support is not configured on this deployment.', { code: 'not_configured' })
      let token = null
      if (auth) {
        token = await getToken().catch(() => null)
        if (!token) throw supportError('Sign in to continue.', { status: 401, code: 'signed_out' })
      }
      const controller = new AbortController()
      const onAbort = () => controller.abort(signal.reason)
      if (signal) {
        if (signal.aborted) controller.abort(signal.reason)
        else signal.addEventListener('abort', onAbort, { once: true })
      }
      let timedOut = false
      const timer = setTimeout(() => { timedOut = true; controller.abort() }, timeoutMs)
      let res
      try {
        res = await fetchImpl(`${baseUrl}${path}`, {
          method,
          signal: controller.signal,
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          },
          body: body !== undefined ? JSON.stringify(body) : undefined,
        })
      } catch (e) {
        if (timedOut) throw supportError('Request timed out.', { code: 'timeout' })
        if (e?.name === 'AbortError') throw e
        throw supportError('Network error.', { code: 'network' })
      } finally {
        clearTimeout(timer)
        signal?.removeEventListener?.('abort', onAbort)
      }
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw supportError(payload.message || payload.error || `Request failed (${res.status})`, {
          status: res.status,
          code: payload.code || (typeof payload.error === 'string' && /^[a-z_]+$/.test(payload.error) ? payload.error : null),
          detail: payload,
        })
      }
      return payload
    },
  }
}

// Adapts the CRM console's injected api ({get, post, put}) so the Support
// area inside /admin/crm uses the same auth and dev plumbing as other tabs.
export function transportFromCrmApi(api) {
  return {
    mode: api?.mode || 'crm',
    configured: api?.configured !== false,
    async request(method, path, { body } = {}) {
      if (method === 'GET') return api.get(path)
      if (method === 'POST') return api.post(path, body || {})
      if (method === 'PUT') return api.put(path, body || {})
      if (method === 'PATCH' && api.patch) return api.patch(path, body || {})
      throw supportError(`${method} is not supported by this client.`, { code: 'unsupported' })
    },
  }
}

const enc = encodeURIComponent

export function createSupportClient(transport) {
  const req = (method, path, opts) => transport.request(method, path, opts)
  const post = (path, body, opts = {}) => req('POST', path, { ...opts, body })
  const get = (path, opts) => req('GET', path, opts)
  const qs = (params) => {
    const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')).toString()
    return s ? `?${s}` : ''
  }
  const me = (n) => `/cs/me/support/cases/${enc(n)}`
  const staff = (n) => `/cs/admin/support/cases/${enc(n)}`

  return {
    mode: transport.mode,
    configured: transport.configured !== false,

    // ---- Player (own data only) ----
    // body: { text, category?, context?: { page?, feature?, platform?, appVersion? } }
    triage: ({ text, category, context } = {}, { signal } = {}) => post('/cs/me/support/triage', { text, ...(category ? { category } : {}), ...(context ? { context } : {}) }, { signal, timeoutMs: TRIAGE_TIMEOUT_MS }),
    createCase: ({ text, category, subcategory, answers, context, clientRequestId }) => post('/cs/me/support/cases', { text, category, subcategory, answers, context, clientRequestId }),
    listCases: () => get('/cs/me/support/cases'),
    getCase: (caseNumber) => get(me(caseNumber)),
    sendMessage: (caseNumber, { text, clientRequestId }) => post(`${me(caseNumber)}/messages`, { text, clientRequestId }),
    requestAttachment: (caseNumber, { name, mime, size }) => post(`${me(caseNumber)}/attachments`, { name, mime, size }),
    confirmResolved: (caseNumber) => post(`${me(caseNumber)}/resolve-confirm`, {}),
    reopen: (caseNumber, { text } = {}) => post(`${me(caseNumber)}/reopen`, text ? { text } : {}),
    submitCsat: (caseNumber, { rating, comment }) => post(`${me(caseNumber)}/csat`, comment ? { rating, comment } : { rating }),

    // ---- Help Center (public, reviewed articles only) ----
    listArticles: (q = '') => get(`/cs/help/articles${qs({ q: String(q || '').trim() })}`, { auth: false }),
    getArticle: (slug) => get(`/cs/help/articles/${enc(slug)}`, { auth: false }),

    // ---- Staff (role-checked server-side, §5) ----
    queue: (view) => get(`/cs/admin/support/queue${qs({ view })}`),
    staffCase: (caseNumber) => get(staff(caseNumber)),
    staffReply: (caseNumber, { text, clientRequestId }) => post(`${staff(caseNumber)}/messages`, { text, clientRequestId }),
    staffNote: (caseNumber, { text, clientRequestId }) => post(`${staff(caseNumber)}/notes`, { text, clientRequestId }),
    // `version` = case.version the screen shows; a stale one is a 409
    // version_conflict. The escalation hand-off is built by the server.
    setStatus: (caseNumber, { status, version }) => post(`${staff(caseNumber)}/status`, { status, version }),
    assign: (caseNumber, { assignee, version }) => post(`${staff(caseNumber)}/assign`, { assignee, version }),
    escalate: (caseNumber, { team, reason, version }) => post(`${staff(caseNumber)}/escalate`, { team, reason, version }),
    linkIncident: (caseNumber, { incidentId, version }) => post(`${staff(caseNumber)}/link-incident`, { incidentId, version }),
    resolve: (caseNumber, { summary, code, learning, version }) => post(`${staff(caseNumber)}/resolve`, { summary, code, learning, version }),
    requestAction: (caseNumber, { kind, reason }) => post(`${staff(caseNumber)}/action-requests`, { kind, reason }),
    incidents: () => get('/cs/admin/support/incidents'),
    incident: (id) => get(`/cs/admin/support/incidents/${enc(id)}`),
    addIncidentTimeline: (id, { text, kind = 'note' }) => post(`/cs/admin/support/incidents/${enc(id)}/timeline`, { kind, text }),
    metrics: ({ from, to } = {}) => get(`/cs/admin/support/metrics${qs({ from, to })}`),
    unmatchedEmail: () => get('/cs/admin/support/email/unmatched'),
    assignUnmatchedEmail: (id, { caseNumber }) => post(`/cs/admin/support/email/unmatched/${enc(id)}/assign`, { caseNumber }),
  }
}

// Player portal client. null when the customer-success API is not configured
// (the page then shows an honest "not live yet" state with the email path).
export function createLiveSupportApi() {
  if (!isCustomerSuccessConfigured()) return null
  return createSupportClient(createLiveSupportTransport())
}

// Help Center reads are public; a client exists whenever the API is configured.
export const createLiveHelpApi = createLiveSupportApi
