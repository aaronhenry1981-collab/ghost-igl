// Per-site notices (for example a bomb site Ubisoft moved in a season update
// whose plan has not been re-verified yet). Stored on the site in maps.js so
// every surface reads the same text.
import MAPS from './maps.js'

export function siteNoticeFor(mapId, siteId) {
  const map = MAPS.find((m) => m.id === mapId)
  const site = map?.sites?.find((s) => s.id === siteId)
  return site?.notice || null
}

export function sitesWithNotices() {
  return MAPS.flatMap((m) => (m.sites || []).filter((s) => s.notice).map((s) => ({ mapId: m.id, siteId: s.id, notice: s.notice })))
}
