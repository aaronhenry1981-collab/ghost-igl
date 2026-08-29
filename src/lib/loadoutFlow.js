export function normalizeOperatorName(value) {
  return String(value || '').trim().toLowerCase()
}

export function findOperatorLoadout(loadouts, requestedOperator) {
  const target = normalizeOperatorName(requestedOperator)
  if (!target || !loadouts || typeof loadouts !== 'object') return null

  for (const [sectionId, section] of Object.entries(loadouts)) {
    const operators = Array.isArray(section?.operators) ? section.operators : []
    const operator = operators.find((entry) => normalizeOperatorName(entry?.name) === target)
    if (operator) return { sectionId, section, operator }
  }

  return null
}

export function operatorContextUrl(operatorName, context = {}) {
  const params = new URLSearchParams()
  params.set('operator', String(operatorName || '').trim())
  for (const key of ['map', 'site', 'side']) {
    if (context[key]) params.set(key, context[key])
  }
  return `/loadouts?${params.toString()}`
}
