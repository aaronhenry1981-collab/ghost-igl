// The /start round-plan demo: the same public plan data /strats shows a
// signed-out player, for the free maps only, so the preview can never show
// more than the free product actually gives.
import PUBLIC_STRATS from '../data/public-strats.generated.js'
import { isVerifiedName, verifiedFor } from '../data/verified-callouts.js'
import { FREE_MAPS } from '../config/planFacts.js'

export const SIDES = Object.freeze(['attack', 'defense'])
export const DEFAULT_SELECTION = Object.freeze({ mapId: 'bank', siteId: 'ceo', side: 'attack' })

function isFreeSite(mapId, siteId, side) {
  const map = FREE_MAPS.find((item) => item.id === mapId)
  return !!(map?.sites.some((site) => site.id === siteId) && SIDES.includes(side) && PUBLIC_STRATS[mapId]?.[siteId]?.[side])
}

// Which plan the demo opens on. A campaign link can choose one with
// ?map=&site=&side= (for example a Coastline video linking to Coastline).
// Anything that is not a free map and site falls back to the default, so a
// link can never present a locked plan as free.
export function resolveDemoSelection(params, fallback = DEFAULT_SELECTION) {
  const get = (key) => (typeof params?.get === 'function' ? params.get(key) : params?.[key]) || ''
  const mapId = get('map').toLowerCase()
  const siteId = get('site').toLowerCase()
  const side = get('side').toLowerCase() || fallback.side
  if (isFreeSite(mapId, siteId, side)) return { mapId, siteId, side }
  const firstSite = FREE_MAPS.find((item) => item.id === mapId)?.sites[0]?.id
  if (firstSite && isFreeSite(mapId, firstSite, side)) return { mapId, siteId: firstSite, side }
  return { ...fallback }
}

// The same guard for a selection the player makes in the demo controls.
export function validDemoSelection({ mapId, siteId, side } = {}, fallback = DEFAULT_SELECTION) {
  return resolveDemoSelection({ map: mapId, site: siteId, side }, fallback)
}

export function demoPlan({ mapId, siteId, side }) {
  const map = FREE_MAPS.find((item) => item.id === mapId)
  const site = map?.sites.find((item) => item.id === siteId)
  const strat = PUBLIC_STRATS[mapId]?.[siteId]?.[side]
  if (!map || !site || !strat) return null
  const evidence = verifiedFor(mapId)
  return {
    mapId,
    siteId,
    side,
    mapName: map.name,
    siteName: site.name,
    floor: site.floor,
    operators: strat.operators.map(({ name, role, priority }) => ({ name, role, priority })),
    plan: strat.strategy,
    callouts: strat.callouts.map((name) => ({ name, verified: isVerifiedName(mapId, name) })),
    footage: evidence ? { frames: evidence.framesRead, sessions: evidence.sessions } : null,
  }
}

export function planPath({ mapId, siteId, side }) {
  return `/strats/${mapId}/${siteId}/${side}`
}

// Signed-out players create a free account and land on the plan they picked.
export function freePlanSignupPath(selection) {
  return `/auth?mode=signup&redirect=${encodeURIComponent(planPath(selection))}`
}
