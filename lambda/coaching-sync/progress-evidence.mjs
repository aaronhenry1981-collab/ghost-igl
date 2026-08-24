// Pure evidence rules: deliberately independent of AWS so promotion logic can
// be tested offline and shared without creating credentials or network calls.
export const PROGRESS_SKILL_IDS = new Set([
  'crosshair-head-height', 'drone-before-entry', 'controlled-peeks', 'lean-discipline',
  'spawn-discipline', 'objective-priority', 'trade-spacing', 'save-midround-drone',
  'roam-purpose', 'drone-entry-partner', 'deny-drones', 'information-discipline',
  'roam-timing', 'flank-control', 'recalculate-advantage', 'session-discipline',
  'death-audit', 'win-condition', 'clock-management', 'post-plant', 'anti-strat',
  'peek-craft', 'information-mastery', 'training-blocks',
])

const RANK_RE = /^(Copper|Bronze|Silver|Gold|Platinum|Emerald|Diamond|Champion)\s+(V|IV|III|II|I)$/i

export function normalizeObservedRank(value) {
  const match = String(value || '').trim().match(RANK_RE)
  if (!match) return null
  const tier = `${match[1][0].toUpperCase()}${match[1].slice(1).toLowerCase()}`
  return `${tier} ${match[2].toUpperCase()}`
}

export function sanitizeProgressEvidence(value) {
  if (!value || typeof value !== 'object' || !PROGRESS_SKILL_IDS.has(value.skillId)) return null
  const result = value.result === 'proved' || value.result === 'missed' ? value.result : null
  const confidence = Number(value.confidence)
  const evidence = String(value.evidence || '').trim().slice(0, 220)
  if (!result || !Number.isFinite(confidence) || confidence < 0.82 || confidence > 1 || evidence.length < 12) return null
  return {
    skillId: value.skillId,
    result,
    confidence: Math.round(confidence * 100) / 100,
    evidence,
    source: String(value.source || 'coach').slice(0, 30),
  }
}

export function aggregateProgressEvidence(items) {
  const skills = {}
  const recent = []
  let observedRank = null
  const ordered = [...items].sort((a, b) => String(a.ts || '').localeCompare(String(b.ts || '')))
  for (const event of ordered) {
    const evidence = sanitizeProgressEvidence(event.progressEvidence)
    if (evidence) {
      const row = {
        ...evidence,
        ts: event.ts,
        sessionId: event.sessionId,
        map: event.gameState?.map || null,
        side: event.gameState?.side || null,
      }
      const skill = (skills[evidence.skillId] ||= { proved: 0, missed: 0, recent: [] })
      skill[evidence.result] += 1
      skill.recent.push(row)
      if (skill.recent.length > 10) skill.recent.shift()
      recent.push(row)
      if (recent.length > 40) recent.shift()
    }
    const rankLine = String(event.coachAction?.spokenLine || '')
    const rankMatch = rankLine.match(/^rank observed:\s*(.+)$/i)
    if (rankMatch) observedRank = normalizeObservedRank(rankMatch[1]) || observedRank
  }
  return { skills, recent, observedRank }
}
