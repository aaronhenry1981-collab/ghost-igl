export const ROSTER_KEY = 'recon6-squad-roster-v1'

export function loadRoster() {
  try { return JSON.parse(localStorage.getItem(ROSTER_KEY) || '[]') } catch { return [] }
}

export function saveRoster(list) {
  try { localStorage.setItem(ROSTER_KEY, JSON.stringify(list)) } catch { /* quota */ }
}

/** A saved player's pool for this side, or null if they have not set one. */
export function rosterPool(roster, name, side) {
  if (!name) return null
  const key = String(name).toLowerCase().replace(/[^a-z0-9]/g, '')
  const player = (roster || []).find((item) => item.name.toLowerCase().replace(/[^a-z0-9]/g, '') === key)
  return player && player[side] && player[side].length ? player[side] : null
}
