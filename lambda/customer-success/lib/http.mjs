// Small HTTP helpers for API Gateway HTTP API (payload v2) events.

// Production origins only. Local development passes its own list (see
// scripts/cs-dev-server.mjs); a deployed stack can add one via ALLOWED_ORIGINS.
export const DEFAULT_ALLOWED_ORIGINS = Object.freeze(['https://r6coaching.com', 'https://www.r6coaching.com'])

export function requestOf(event = {}) {
  const method = String(event.requestContext?.http?.method || event.httpMethod || 'GET').toUpperCase()
  const path = String(event.rawPath || event.requestContext?.http?.path || event.path || '/').replace(/\/+$/, '') || '/'
  const headers = Object.fromEntries(Object.entries(event.headers || {}).map(([k, v]) => [k.toLowerCase(), v]))
  let rawBody = event.body || ''
  if (event.isBase64Encoded && rawBody) rawBody = Buffer.from(rawBody, 'base64').toString('utf8')
  return { method, path, headers, rawBody, query: event.queryStringParameters || {}, requestId: event.requestContext?.requestId || null }
}

export function corsHeaders(origin, allowedOrigins = DEFAULT_ALLOWED_ORIGINS) {
  const allowed = allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'Authorization,Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,OPTIONS',
    Vary: 'Origin',
  }
}

export function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      // Everything here is personal or admin data.
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  }
}

export class HttpError extends Error {
  constructor(statusCode, message, code = null) {
    super(message)
    this.statusCode = statusCode
    this.code = code
  }
}

export function parseJsonBody(rawBody, { maxBytes = 8 * 1024 } = {}) {
  if (!rawBody) return {}
  if (Buffer.byteLength(rawBody, 'utf8') > maxBytes) throw new HttpError(413, 'request too large')
  try {
    const parsed = JSON.parse(rawBody)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object')
    return parsed
  } catch {
    throw new HttpError(400, 'request body must be a JSON object')
  }
}

// Match "/cs/admin/players/{key}" style patterns; returns params or null.
// A parameter with malformed percent-encoding ("%E0%A4%A", a lone "%") is a
// 400, not an unhandled URIError (500).
export function matchPath(pattern, path) {
  const p = pattern.split('/').filter(Boolean)
  const a = path.split('/').filter(Boolean)
  if (p.length !== a.length) return null
  const isParam = (seg) => seg.startsWith('{') && seg.endsWith('}')
  // Literals first: only a route that otherwise matches decodes (and can
  // reject) its parameters.
  for (let i = 0; i < p.length; i += 1) if (!isParam(p[i]) && p[i] !== a[i]) return null
  const params = {}
  for (let i = 0; i < p.length; i += 1) {
    if (!isParam(p[i])) continue
    try {
      params[p[i].slice(1, -1)] = decodeURIComponent(a[i])
    } catch (err) {
      if (err instanceof URIError) throw new HttpError(400, 'malformed path encoding')
      throw err
    }
  }
  return params
}
