// Small HTTP helpers for API Gateway HTTP API (payload v2) events.

export const DEFAULT_ALLOWED_ORIGINS = Object.freeze(['https://r6coaching.com', 'https://www.r6coaching.com', 'http://localhost:5173'])

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
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
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
export function matchPath(pattern, path) {
  const p = pattern.split('/').filter(Boolean)
  const a = path.split('/').filter(Boolean)
  if (p.length !== a.length) return null
  const params = {}
  for (let i = 0; i < p.length; i += 1) {
    if (p[i].startsWith('{') && p[i].endsWith('}')) params[p[i].slice(1, -1)] = decodeURIComponent(a[i])
    else if (p[i] !== a[i]) return null
  }
  return params
}
