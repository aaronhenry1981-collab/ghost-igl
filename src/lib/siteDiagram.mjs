const FALLBACK_ZONES = {
  attack: ['Entry lane', 'Intel checkpoint', 'Objective edge', 'Plant position'],
  defense: ['Site core', 'Breach denial', 'Power position', 'Retake lane'],
}

export function buildDiagramZones(strat = {}, side = 'attack', phases = []) {
  const callouts = Array.isArray(strat.callouts) ? strat.callouts.filter(Boolean) : []
  const operators = Array.isArray(strat.operators) ? strat.operators.filter(Boolean) : []
  const fallback = FALLBACK_ZONES[side] || FALLBACK_ZONES.attack

  return Array.from({ length: 4 }, (_, index) => {
    const operator = operators[index % Math.max(operators.length, 1)] || null
    return {
      id: `${side}-${index + 1}`,
      phase: phases[index] || `Step ${index + 1}`,
      label: callouts[index] || fallback[index],
      operator: operator?.name || null,
      role: operator?.role || null,
    }
  })
}

export function diagramSummary(zones = [], side = 'attack') {
  const labels = zones.map((zone) => zone.label).filter(Boolean).join(', ')
  return `${side === 'defense' ? 'Defensive priority zones' : 'Attack execution path'}: ${labels}. Schematic only; not an exact floor plan.`
}

const COUNT_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight']

// Alt text for the diagram's backdrop image, so image search sees what the
// diagram shows: "Attack execution path diagram for Bank CEO Office showing
// four operator jobs: CEO (Thermite), ...". Screen readers keep using the
// wrapper's aria-label (diagramSummary), since role="img" hides the children.
export function diagramAlt(zones = [], side = 'attack', mapName = '', siteName = '') {
  const jobs = zones.filter((zone) => zone.operator)
  const count = COUNT_WORDS[jobs.length] || String(jobs.length)
  const kind = side === 'defense' ? 'Defense setup' : 'Attack execution path'
  const place = [mapName, siteName].filter(Boolean).join(' ') || 'this site'
  const list = jobs.map((zone) => `${zone.label} (${zone.operator})`).join(', ')
  return `${kind} diagram for ${place} showing ${count} operator job${jobs.length === 1 ? '' : 's'}${list ? `: ${list}` : ''}`
}
