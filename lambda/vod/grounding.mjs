export const GROUNDING_RULES = `These are selected still images, not continuous video or a match history.
Separate visible observations from uncertainty in per_image.observations and per_image.uncertainties.
All tactical scores must be null: there is no validated scoring rubric for these stills.
Use only user-supplied map/site context for those labels; otherwise map/site=null. Always leave round_phase="unknown" for this still-image review. Do not identify a map from decor or a catalog. User context is a supplied claim, not visual proof.
Never infer a plant from DEFUSE/DROP prompts, bomb markers or a distance label. These do not establish post-plant. An 8:52 timer and solo custom-game caption do not establish ranked match phase or outcomes.
A single frame cannot establish movement, previous actions, a successful plant, missing off-screen utility, repeated habits, or what caused a win/death. Leave both patterns arrays empty for one frame. Multiple selected frames still do not prove a repeated match habit.
Do not treat instructional captions as observed player behavior. Give conditional suggestions linked to visible observations, and explicitly state what is unknown. Empty advice arrays are preferable to invention. Do not invent precision such as centimetres of aim correction.
Keep supplied map/site names exactly as supplied, label their provenance as user_context, and report any apparent conflict as uncertainty rather than replacing them.`

const labelKey = value => typeof value === 'string' ? value.trim().toLowerCase().replace(/[^a-z0-9]/g, '') : null
const sameLabel = (actual, expected) => expected === null ? actual === null : typeof actual === 'string' && labelKey(actual) === labelKey(expected)
const unsupported = /successfully planted|you(?:'ve| have) planted|post[- ]plant|consistently|recurring habit|every time/i
// Permit only explicit uncertainty statements, not an arbitrary "uncertainties"
// field exemption. A contradictory assertion after "but" still fails closed.
function isUncertainSentence(text) {
  return /^(?:i |we )?cannot (?:determine|establish|confirm|verify) whether (?:this|the scene) is (?:a )?post[- ]plant(?: situation| state| phase)?$/i.test(text.trim()) ||
    /^(?:this|a single) (?:still|frame|image) cannot (?:establish|show|confirm) (?:a post[- ]plant state|recurring habits)$/i.test(text.trim())
}
function hasUnsupportedClaim(value) {
  if (typeof value === 'string') return value.split(/[.!?\n]+/).some(sentence => unsupported.test(sentence) && !isUncertainSentence(sentence))
  if (Array.isArray(value)) return value.some(hasUnsupportedClaim)
  return value && typeof value === 'object' ? Object.values(value).some(hasUnsupportedClaim) : false
}

export function validateGrounding(value, count, context = {}) {
  if (value?.error === 'wrong_game') return []
  const errors = []
  if (value?.session?.score !== null) errors.push('still-image tactical score must be null')
  const map = typeof context.map === 'string' && context.map.trim() ? context.map.trim() : null
  const site = typeof context.site === 'string' && context.site.trim() ? context.site.trim() : null
  if (!sameLabel(value?.session?.detected_map, map)) errors.push('session map must match supplied context or be null')
  for (const row of value?.per_image || []) {
    if (!sameLabel(row.detected?.map, map) || !sameLabel(row.detected?.site, site)) errors.push('map/site must match supplied context or be null')
    if (row.detected?.round_phase !== 'unknown') errors.push('still-image phase must remain unknown')
    if (!Array.isArray(row.observations) || !row.observations.length || row.observations.some(x => typeof x !== 'string')) errors.push('visible observations are required')
    if (!Array.isArray(row.uncertainties) || !row.uncertainties.length || row.uncertainties.some(x => typeof x !== 'string')) errors.push('explicit uncertainties are required')
  }
  if (count === 1 && (value?.patterns?.recurring_weaknesses?.length || value?.patterns?.standout_strengths?.length)) errors.push('one frame cannot establish recurring patterns')
  if (hasUnsupportedClaim([value?.session?.headline, value?.per_image, value?.patterns, value?.practice_plan, value?.character_feedback])) errors.push('unsupported temporal or repeated-behavior claim')
  return errors
}

export function requireGroundedAnalysis(value, count, context) {
  const errors = validateGrounding(value, count, context)
  if (errors.length) {
    const err = new Error(`Grounding validation failed: ${errors.join('; ')}`)
    err.name = 'ModelGroundingError'
    throw err
  }
  return { ...value, evidence_scope: 'selected_stills', scoring_status: 'not_assessed', context_provenance: context?.map ? 'user_context' : 'unknown' }
}
