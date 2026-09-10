import { PROGRESS_TIERS, evidenceStatus, findProgressSkill } from '../data/progressCurriculum.js'
import { emptyMechanicsState, normalizeMechanicsState } from '../data/mechanicsLab.js'

export function normalizeRoadmap(value) {
  const source = value && typeof value === 'object' ? value : {}
  const checks = { ...(source.checks || {}) }

  // Old /climb keys were tier-index (gold-0). Translate them to stable IDs.
  for (const tier of PROGRESS_TIERS) {
    tier.skills.forEach((skill, index) => {
      if (checks[`${tier.id}-${index}`] && checks[skill.id] == null) checks[skill.id] = true
    })
  }

  return {
    checks,
    focusId: source.focusId || null,
    // Legacy builds saved every automatic suggestion as focusId. Only an
    // explicitly manual focus is allowed to stay pinned after new evidence.
    focusMode: source.focusMode === 'manual' ? 'manual' : 'auto',
    selectedTierId: source.selectedTierId || null,
    rankMode: source.rankMode === 'manual' ? 'manual' : 'auto',
    mechanics: normalizeMechanicsState(source.mechanics),
  }
}

export function emptyRoadmap() {
  return {
    checks: {},
    focusId: null,
    focusMode: 'auto',
    selectedTierId: null,
    rankMode: 'auto',
    mechanics: emptyMechanicsState(),
  }
}

export function statusFor(skill, evidenceMap, roadmap) {
  return evidenceStatus(skill, evidenceMap?.[skill.id], !!roadmap.checks?.[skill.id])
}

export function tierCompletion(tier, evidenceMap, roadmap) {
  const score = tier.skills.reduce((total, skill) => {
    const status = statusFor(skill, evidenceMap, roadmap)
    if (status === 'mastered' || status === 'confirmed') return total + 1
    if (status === 'building') return total + 0.5
    return total
  }, 0)
  return Math.round((score / tier.skills.length) * 100)
}

export function pickAutomaticFocus(selectedTier, evidenceMap, roadmap) {
  const ordered = [
    ...selectedTier.skills.filter((skill) => statusFor(skill, evidenceMap, roadmap) === 'needs-work'),
    ...selectedTier.skills.filter((skill) => statusFor(skill, evidenceMap, roadmap) === 'building'),
    ...selectedTier.skills.filter((skill) => ['not-started', 'not-observed'].includes(statusFor(skill, evidenceMap, roadmap))),
  ]
  return ordered[0] || selectedTier.skills[0]
}

export function resolveFocus(roadmap, selectedTier, evidenceMap) {
  if (roadmap.focusMode === 'manual') {
    const saved = findProgressSkill(roadmap.focusId)
    if (saved) return saved
  }
  return pickAutomaticFocus(selectedTier, evidenceMap, roadmap)
}
