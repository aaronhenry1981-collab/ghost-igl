export const HUB_PATH = '/operator-hub'
export const HUB_ENDPOINT = '/content/operator-hub'
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function hubPathFor(slug) {
  return typeof slug === 'string' && SLUG.test(slug) && slug.length <= 48
    ? `${HUB_PATH}/${slug}` : HUB_PATH
}

export function isOperatorHubPath(path) {
  return path === HUB_PATH || (typeof path === 'string' && path.startsWith(`${HUB_PATH}/`))
}

export function hubAuthHref(slug, signUp = false) {
  return `/auth?${signUp ? 'mode=signup&' : ''}redirect=${encodeURIComponent(hubPathFor(slug))}`
}

export function foldSearch(value) {
  return String(value ?? '').toLowerCase().normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '').replace(/ø/g, 'o')
    .replace(/[^a-z0-9]+/g, ' ').trim()
}

export function filterOperators(operators, side, query) {
  const terms = foldSearch(query).split(' ').filter(Boolean)
  return operators.filter((op) => {
    if (side !== 'all' && op.side !== side) return false
    const text = foldSearch([op.name, op.role, op.gadget].join(' '))
    return terms.every((term) => text.includes(term))
  })
}

export function operatorRecommendations(operator) {
  return {
    siteFit: operator.sites.length ? null : operator.when,
    setupFit: operator.loadout ? null
      : `Pick a primary you can control at your usual range and secondary utility that supports ${operator.name}’s ${operator.role.toLowerCase()} role.`,
  }
}

export function isHubPayload(payload) {
  return payload?.schemaVersion === 1 && Array.isArray(payload.operators) && payload.operators.length > 0 &&
    typeof payload.scope?.patch === 'string' && typeof payload.scope?.verifiedOn === 'string' &&
    payload.operators.every((item) => item && typeof item.name === 'string' && SLUG.test(item.slug) &&
      ['attack', 'defense'].includes(item.side) && Array.isArray(item.sites))
}

export class HubRequestError extends Error {
  constructor(code) { super(code); this.code = code }
}

export async function fetchOperatorHub({ apiBase, token, signal, transport = fetch }) {
  if (!apiBase || !token) throw new HubRequestError('session')
  const response = await transport(`${apiBase.replace(/\/+$/, '')}${HUB_ENDPOINT}`, {
    method: 'GET', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    credentials: 'omit', redirect: 'error', cache: 'no-store', signal,
  })
  if (response.status === 401) throw new HubRequestError('session')
  if (response.status === 403) throw new HubRequestError('verify')
  if (!response.ok) throw new HubRequestError('unavailable')
  const data = await response.json()
  if (!isHubPayload(data)) throw new HubRequestError('unavailable')
  return data
}

export function formatCheckedDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))
    : ''
}
