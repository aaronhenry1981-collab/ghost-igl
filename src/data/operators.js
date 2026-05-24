// Aggregate operator presence across every strat (computed once at module load).
// Shape: { [opName]: { name, roles: Set, sites: [{ mapId, siteId, side, priority, role }] } }

import MAPS from './maps'
import STRATS from './strats'

function buildOperatorIndex() {
  const index = {}

  for (const mapId of Object.keys(STRATS)) {
    const map = MAPS.find((m) => m.id === mapId)
    if (!map) continue
    for (const siteId of Object.keys(STRATS[mapId])) {
      const site = map.sites.find((s) => s.id === siteId)
      if (!site) continue
      for (const side of ['attack', 'defense']) {
        const strat = STRATS[mapId][siteId]?.[side]
        if (!strat) continue
        for (const op of strat.operators || []) {
          if (!index[op.name]) {
            index[op.name] = {
              name: op.name,
              roles: new Set(),
              sites: [],
              essentialCount: 0,
              recommendedCount: 0,
              flexCount: 0,
              sidesSeen: new Set(),
            }
          }
          const entry = index[op.name]
          entry.roles.add(op.role)
          entry.sidesSeen.add(side)
          entry.sites.push({
            mapId,
            mapName: map.name,
            siteId,
            siteName: site.name,
            side,
            priority: op.priority,
            role: op.role,
          })
          if (op.priority === 'essential') entry.essentialCount++
          else if (op.priority === 'recommended') entry.recommendedCount++
          else entry.flexCount++
        }
      }
    }
  }

  // Convert to plain array, sort by essential count desc
  const arr = Object.values(index).map((o) => ({
    ...o,
    roles: [...o.roles],
    sidesSeen: [...o.sidesSeen],
    totalSites: o.sites.length,
  }))
  arr.sort((a, b) => {
    if (b.essentialCount !== a.essentialCount) return b.essentialCount - a.essentialCount
    if (b.totalSites !== a.totalSites) return b.totalSites - a.totalSites
    return a.name.localeCompare(b.name)
  })
  return arr
}

const OPERATORS = buildOperatorIndex()

export function findOperator(name) {
  if (!name) return null
  const lower = name.toLowerCase()
  return OPERATORS.find((o) => o.name.toLowerCase() === lower) || null
}

export default OPERATORS
