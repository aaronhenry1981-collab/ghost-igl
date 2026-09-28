import MAPS from '../../data/maps'

const DAY = 86400000

export function formatDay(iso) {
  const ms = Date.parse(iso || '')
  if (!Number.isFinite(ms)) return null
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatDateTime(iso) {
  const ms = Date.parse(iso || '')
  if (!Number.isFinite(ms)) return null
  return new Date(ms).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function formatRelative(iso, now = Date.now()) {
  const ms = Date.parse(iso || '')
  if (!Number.isFinite(ms)) return null
  const days = Math.floor((now - ms) / DAY)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 14) return `${days} days ago`
  return formatDay(iso)
}

export function greeting(now = new Date()) {
  const h = now.getHours()
  if (h < 5) return 'Late night'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function mapLabel(mapId) {
  const map = MAPS.find((m) => m.id === mapId)
  return map?.name || String(mapId || '').replace(/-/g, ' ')
}

export function siteLabel(mapId, siteId) {
  const map = MAPS.find((m) => m.id === mapId)
  const site = map?.sites?.find((s) => s.id === siteId)
  return site?.name || String(siteId || '').replace(/-/g, ' ')
}

export function sideLabel(side) {
  if (side === 'attack') return 'Attack'
  if (side === 'defense') return 'Defense'
  return null
}
