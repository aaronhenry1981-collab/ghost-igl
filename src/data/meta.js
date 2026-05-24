// Meta dashboard — aggregate stats across the ranked pool.
// Computed once at module load from OPERATORS + MAPS + BANS + STRATS.

import MAPS from './maps'
import STRATS from './strats'
import BANS from './bans'
import OPERATORS from './operators'

function computeMeta() {
  const rankedMapIds = new Set(MAPS.filter((m) => m.rankedPool && !m.comingSoon).map((m) => m.id))

  // Operator leaderboard — essential / recommended counts, ranked only
  const opBoard = OPERATORS.map((op) => {
    const rankedSites = op.sites.filter((s) => rankedMapIds.has(s.mapId))
    const atkEssential = rankedSites.filter((s) => s.side === 'attack' && s.priority === 'essential').length
    const defEssential = rankedSites.filter((s) => s.side === 'defense' && s.priority === 'essential').length
    const atkTotal = rankedSites.filter((s) => s.side === 'attack').length
    const defTotal = rankedSites.filter((s) => s.side === 'defense').length
    return {
      name: op.name,
      role: op.roles[0],
      atkEssential,
      defEssential,
      essential: atkEssential + defEssential,
      total: rankedSites.length,
      atkTotal,
      defTotal,
      primarySide: atkTotal > 0 && defTotal === 0 ? 'attack' : defTotal > 0 && atkTotal === 0 ? 'defense' : 'both',
    }
  })
    .filter((o) => o.total > 0)
    .sort((a, b) => b.essential - a.essential || b.total - a.total || a.name.localeCompare(b.name))

  // Ban recommendations frequency
  const banCounts = {}
  for (const mapId of Object.keys(BANS)) {
    if (!rankedMapIds.has(mapId)) continue
    for (const side of ['attack', 'defense']) {
      for (const ban of BANS[mapId]?.[side] || []) {
        if (!banCounts[ban.name]) banCounts[ban.name] = { name: ban.name, atkBans: 0, defBans: 0, total: 0, sampleReasons: [] }
        banCounts[ban.name][side === 'attack' ? 'atkBans' : 'defBans']++
        banCounts[ban.name].total++
        if (banCounts[ban.name].sampleReasons.length < 2) {
          banCounts[ban.name].sampleReasons.push({ mapId, side, reason: ban.reason })
        }
      }
    }
  }
  const banBoard = Object.values(banCounts).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))

  // Per-map site counts and "weight" (more essentials = harder to improvise)
  const mapStats = []
  for (const mapId of Object.keys(STRATS)) {
    if (!rankedMapIds.has(mapId)) continue
    const map = MAPS.find((m) => m.id === mapId)
    if (!map) continue
    let atkEssentials = 0
    let defEssentials = 0
    let sites = 0
    for (const siteId of Object.keys(STRATS[mapId])) {
      sites++
      atkEssentials += STRATS[mapId][siteId]?.attack?.operators?.filter((o) => o.priority === 'essential').length || 0
      defEssentials += STRATS[mapId][siteId]?.defense?.operators?.filter((o) => o.priority === 'essential').length || 0
    }
    mapStats.push({
      mapId,
      mapName: map.name,
      sites,
      atkEssentials,
      defEssentials,
      totalEssentials: atkEssentials + defEssentials,
    })
  }
  mapStats.sort((a, b) => b.totalEssentials - a.totalEssentials || a.mapName.localeCompare(b.mapName))

  return {
    opBoard,
    banBoard,
    mapStats,
    totals: {
      rankedMaps: rankedMapIds.size,
      operators: opBoard.length,
      sites: mapStats.reduce((a, m) => a + m.sites, 0),
    },
  }
}

const META = computeMeta()
export default META
