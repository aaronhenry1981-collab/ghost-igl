import { readFileSync } from 'node:fs'

const PRIVATE_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'private, no-store',
  Vary: 'Origin',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
}
const JWT = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i
const MAX_TOKEN_LENGTH = 8192
const HUB_PATH = '/content/operator-hub'

export function isOperatorHubRequestPath(path) {
  return path === HUB_PATH || path === '/prod' + HUB_PATH
}

function selectText(row, keys, optional = false) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('Invalid hub row')
  return Object.fromEntries(keys.map(key => {
    const value = row[key]
    if (optional && value == null) return [key, null]
    if (typeof value !== 'string' || !value.trim() || value.length > 4000) throw new Error('Invalid hub text')
    return [key, value]
  }))
}

export function encodeOperatorHubCatalog(raw) {
  if (raw?.schemaVersion !== 1 || !Array.isArray(raw.operators) || !raw.operators.length || raw.operators.length > 100) {
    throw new Error('Invalid hub catalog')
  }
  const scope = selectText(raw.scope, ['patch', 'verifiedOn', 'rosterUrl', 'patchUrl'])
  const operators = raw.operators.map(row => ({
    ...selectText(row, ['slug', 'name', 'side', 'role', 'gadget', 'when', 'how', 'officialUrl']),
    ...selectText(row, ['teamFit', 'counterplay'], true),
    sites: row.sites.map(site => selectText(site, ['mapId', 'siteId', 'mapName', 'siteName', 'side', 'role', 'priority'])),
    loadout: row.loadout == null ? null
      : recommendedLoadout(row.loadout),
  }))
  const result = JSON.stringify({ schemaVersion: 1, scope, operators })
  if (Buffer.byteLength(result) > 512 * 1024) throw new Error('Hub catalog exceeds size limit')
  return result
}

function recommendedLoadout(loadout) {
  const output = {
    ...selectText(loadout, ['rationale', 'source']),
    ...selectText(loadout, ['primary', 'secondary', 'gadget', 'secondaryGadget'], true),
  }
  if (output.source !== 'recon-recommendation') throw new Error('Invalid hub loadout source')
  if (loadout.alternates != null) {
    if (!Array.isArray(loadout.alternates) || loadout.alternates.length > 12 ||
        loadout.alternates.some(value => typeof value !== 'string' || !value.trim() || value.length > 4000)) {
      throw new Error('Invalid hub loadout alternates')
    }
    output.alternates = loadout.alternates
  }
  return output
}

// Immutable common content per Lambda revision. Auth always runs before use.
let deployedBody
function readDeployedBody() {
  return deployedBody ??= encodeOperatorHubCatalog(JSON.parse(readFileSync(new URL('./operator-hub-content.json', import.meta.url), 'utf8')))
}

export function createOperatorHubHandler({ verifyToken, allowedOrigins, loadCatalog }) {
  return async function operatorHub(event) {
    const method = event.requestContext?.http?.method || ''
    const origin = event.headers?.origin || event.headers?.Origin || ''
    const headers = { ...PRIVATE_HEADERS }
    if (allowedOrigins.includes(origin)) headers['Access-Control-Allow-Origin'] = origin
    const reply = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) })

    if (method === 'OPTIONS') {
      return { statusCode: 204, headers: {
        ...headers, 'Access-Control-Allow-Headers': 'Authorization', 'Access-Control-Allow-Methods': 'GET,OPTIONS',
      }, body: '' }
    }
    if (method !== 'GET') return reply(405, { error: 'Method not allowed' })

    const authorization = event.headers?.authorization || event.headers?.Authorization || ''
    const token = typeof authorization === 'string' && authorization.length <= MAX_TOKEN_LENGTH && JWT.exec(authorization)?.[1]
    if (!token) return reply(401, { error: 'Authentication required' })

    let claims
    try { claims = await verifyToken(token) }
    catch { return reply(401, { error: 'Authentication required' }) }
    if (typeof claims?.sub !== 'string' || !claims.sub.trim() ||
        typeof claims?.email !== 'string' || !claims.email.trim() || claims.email_verified !== true) {
      return reply(403, { error: 'Verified account required' })
    }
    try { return { statusCode: 200, headers, body: loadCatalog ? encodeOperatorHubCatalog(loadCatalog()) : readDeployedBody() } }
    catch { return reply(503, { error: 'Operator Hub temporarily unavailable' }) }
  }
}
