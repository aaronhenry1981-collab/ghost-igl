const PLAYER_DATA_API_URL = String(import.meta.env.VITE_PLAYER_DATA_API_URL || '').replace(/\/$/, '')

export function isPlayerDataConfigured() {
  return Boolean(PLAYER_DATA_API_URL)
}

async function playerDataFetch(token, path, options = {}) {
  if (!PLAYER_DATA_API_URL) return null
  if (!token) throw new Error('Player data request requires an authenticated token')

  const response = await fetch(`${PLAYER_DATA_API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || `Player data request failed (${response.status})`)
  return payload
}

export function bootstrapPlayerData(token) {
  return playerDataFetch(token, '/player-data/me')
}

export function getPlayerData(token) {
  return playerDataFetch(token, '/player-data/me')
}

export function linkPlayerIdentity(token, identity) {
  return playerDataFetch(token, '/player-data/identities', {
    method: 'POST',
    body: JSON.stringify(identity),
  })
}

export function ingestManualPlayerSnapshot(token, snapshot) {
  return playerDataFetch(token, '/player-data/snapshots', {
    method: 'POST',
    body: JSON.stringify({ ...snapshot, source: 'manual' }),
  })
}

export function addPlayerTimelineEvent(token, event) {
  return playerDataFetch(token, '/player-data/events', {
    method: 'POST',
    body: JSON.stringify(event),
  })
}

export function getPlayerHistory(token, field, limit = 50) {
  const params = new URLSearchParams({ field, limit: String(limit) })
  return playerDataFetch(token, `/player-data/history?${params}`)
}

export function getPlayerTimeline(token, limit = 50) {
  const params = new URLSearchParams({ limit: String(limit) })
  return playerDataFetch(token, `/player-data/timeline?${params}`)
}

export function getPlayerDataProviders(token) {
  return playerDataFetch(token, '/player-data/providers')
}

export function exportPlayerDataSection(token, section = 'profile', { limit = 100, cursor = null } = {}) {
  const params = new URLSearchParams({ section, limit: String(limit) })
  if (cursor) params.set('cursor', cursor)
  return playerDataFetch(token, `/player-data/export?${params}`)
}
