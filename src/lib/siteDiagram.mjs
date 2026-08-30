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
