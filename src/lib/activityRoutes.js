// Which route visits count as coaching activity for the player home and CRM.
// Only public identifiers (map, site, side) are recorded; never free text.
const SLUG = /^[a-z0-9][a-z0-9-]{0,39}$/

export function activityForPath(pathname) {
  const parts = String(pathname || '').split('/').filter(Boolean)
  if (parts[0] === 'strats' && parts.length >= 3 && SLUG.test(parts[1]) && SLUG.test(parts[2])) {
    const side = parts[3] === 'attack' || parts[3] === 'defense' ? parts[3] : null
    return { type: 'strat_viewed', ref: { mapId: parts[1], siteId: parts[2], side } }
  }
  if (parts[0] === 'match-prep') {
    return { type: 'match_prep_opened', ref: parts[1] && SLUG.test(parts[1]) ? { mapId: parts[1] } : null }
  }
  if (parts[0] === 'live' && parts.length === 1) return { type: 'live_coach_opened', ref: null }
  return null
}

export function activityKey(activity, day = new Date().toISOString().slice(0, 10)) {
  const ref = activity.ref ? [activity.ref.mapId, activity.ref.siteId, activity.ref.side].filter(Boolean).join('.') : '-'
  return `${day}|${activity.type}|${ref}`
}
