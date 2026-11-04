export const GROUNDING_RULES = `These are selected still images, not continuous video or a match history.
Separate visible observations from uncertainty in per_image.observations and per_image.uncertainties.
All tactical scores must be null: there is no validated scoring rubric for these stills.
Use only user-supplied map/site context for those labels; otherwise map/site=null. Always leave round_phase="unknown" for this still-image review. Do not identify a map from decor or a catalog. User context is a supplied claim, not visual proof.
Never infer a plant from DEFUSE/DROP prompts, bomb markers or a distance label. These do not establish post-plant. An 8:52 timer and solo custom-game caption do not establish ranked match phase or outcomes.
A single frame cannot establish movement, previous actions, a successful plant, missing off-screen utility, repeated habits, or what caused a win/death. Leave both patterns arrays empty for one frame. Multiple selected frames still do not prove a repeated match habit.
Do not treat instructional captions as observed player behavior. Give conditional suggestions linked to visible observations, and explicitly state what is unknown. Empty advice arrays are preferable to invention. Do not invent precision such as centimetres of aim correction.
No reviewed current-build surface evidence is supplied to this still-image endpoint. Do not assert floor/wall/ceiling/hatch material or destructibility, or recommend breaching those surfaces or creating vertical angles. A selected map/site, a caption, apparent texture, multiple stills or a model's own claim of verification cannot authorize those claims. Leave the advice empty or say exactly "Surface destructibility is not verified." A general verification task may say "Verify surface destructibility in the current game build before planning any breach or vertical play." Safe abstention may say "Do not breach the floor until its destructibility is verified." Do not append an assumed opening, lineup or operator action to an uncertainty statement or move it to another field using pronouns such as "open it".
Keep supplied map/site names exactly as supplied, label their provenance as user_context, and report any apparent conflict as uncertainty rather than replacing them.`

const labelKey = value => typeof value === 'string' ? value.trim().toLowerCase().replace(/[^a-z0-9]/g, '') : null
const sameLabel = (actual, expected) => expected === null ? actual === null : typeof actual === 'string' && labelKey(actual) === labelKey(expected)
const unsupported = /successfully planted|you(?:'ve| have) planted|post[- ]plant|consistently|recurring habit|every time|you (?:moved|rotated|peeked|rushed|planted|died|won)|you (?:always|repeatedly)|(?:before|after) you (?:moved|rotated|peeked|planted|died)/i
// Permit only explicit uncertainty statements, not an arbitrary "uncertainties"
// field exemption. A contradictory assertion after "but" still fails closed.
function isUncertainSentence(text) {
  return /^(?:i |we )?cannot (?:determine|establish|confirm|verify) whether (?:this|the scene) is (?:a )?post[- ]plant(?: situation| state| phase)?$/i.test(text.trim()) ||
    /^(?:this|a single) (?:still|frame|image) cannot (?:establish|show|confirm) (?:a post[- ]plant state|recurring habits)$/i.test(text.trim()) ||
    /^(?:the )?post[- ]plant (?:status|state|phase) (?:is unknown|cannot be (?:determined|established|confirmed|verified)(?: from (?:this|a single) (?:still|frame|image))?)$/i.test(text.trim()) ||
    /^recurring habits cannot be (?:determined|established|confirmed|verified) from (?:this|a single) (?:still|frame|image)$/i.test(text.trim())
}
function isConditionalAdvice(text) {
  // A bounded hypothetical followed by an imperative is advice, not a claim
  // about the frame. Never exempt the rest of the sentence from claim checks.
  const match = /^if (?:this is a post[- ]plant (?:situation|round)|reviewing a post[- ]plant round), ((?:check|review|compare|practice|consider) .+)$/i.exec(text.trim())
  return !!match && !unsupported.test(match[1])
}
function hasUnsupportedClaim(value, advice = false) {
  if (typeof value === 'string') return value.split(/[.!?\n]+/).some(sentence => unsupported.test(sentence) && !isUncertainSentence(sentence) && !(advice && isConditionalAdvice(sentence)))
  if (Array.isArray(value)) return value.some(item => hasUnsupportedClaim(item, advice))
  return value && typeof value === 'object' ? Object.values(value).some(item => hasUnsupportedClaim(item, advice)) : false
}

// This endpoint has no server-reviewed geometry record. Fail closed on the
// bounded material/breach/vertical vocabulary below instead of treating the
// model's own confidence or client context as verification. This is a narrow
// guard for a reproduced failure, not a general factual-correctness verifier.
const surface = /\b(?:floor|ceiling|wall|hatch|surface)s?\b/i
const surfaceProperty = /\b(?:soft|hard|solid|concrete|wood(?:en)?|metal|reinforced|material|destructib\w*|indestructib\w*|breakab\w*|unbreakab\w*|breachab\w*|penetrab\w*)\b/i
const destructiveAction = /\b(?:open(?:s|ed|ing)?|break(?:s|ing)?|broken|breach(?:es|ed|ing)?|destroy(?:s|ed|ing)?|shoot(?:s|ing)?|shotgun|hammer(?:s|ed|ing)?|punch(?:es|ed|ing)?|drill(?:s|ed|ing)?|blast(?:s|ed|ing)?|blow(?:s|ing)?|blown)\b/i
const verticalAction = /\bvertical\b/i
const geometryAbstentions = new Set([
  'surface destructibility is not verified',
  'floor material and destructibility cannot be verified from this frame',
  'verify surface destructibility in the current game build before planning any breach or vertical play',
])
const geometryUnknown = /^(?:(?:the|this) )?(?:floor|ceiling|wall|hatch|surface)(?:'s)? (?:material(?: and destructibility)?|destructibility|breachability) (?:is unknown|is uncertain|is unverified|is not verified|cannot be (?:verified|confirmed|determined|established))(?: from (?:this|a single) (?:frame|image|still))?$/
const geometryQuestion = /^cannot (?:verify|confirm|determine|establish) whether (?:the|this) (?:floor|ceiling|wall|hatch|surface) is (?:soft|hard|destructible|breachable)(?: from (?:this|a single) (?:frame|image|still))?$/
const geometrySafetyHold = /^(?:do not|don't|never) (?:breach|open|break|destroy|shoot through|hammer|punch|drill|blast) (?:(?:the|this|that) )?(?:floor|ceiling|wall|hatch|surface|it|them)s? (?:until|unless) (?:its|their) (?:destructibility|breachability) (?:is|has been) (?:verified|confirmed)(?: in (?:the )?current (?:game )?build)?$/
const unresolvedGeometryTarget = /\b(?:it|them|this|that|these|those|here|there)\b/i
const geometryText = value => value.normalize('NFKC').replace(/[\u2018\u2019]/g, "'").replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '').toLowerCase()
function hasGeometryReference(value) {
  if (typeof value === 'string') return surface.test(geometryText(value)) || verticalAction.test(geometryText(value))
  if (Array.isArray(value)) return value.some(hasGeometryReference)
  return value && typeof value === 'object' ? Object.values(value).some(hasGeometryReference) : false
}
function hasUnsupportedGeometry(value, geometryContext) {
  if (typeof value === 'string') {
    const text = geometryText(value)
    // Exact whole-item abstentions only. A trailing "but open it" or a
    // semicolon cannot borrow this exemption, including in uncertainties.
    if (geometryAbstentions.has(text) || geometryUnknown.test(text) || geometryQuestion.test(text) || geometrySafetyHold.test(text) || /^do not assume (?:this|the) (?:floor|ceiling|wall|hatch|surface) is destructible$/.test(text)) return false
    return (surface.test(text) && (surfaceProperty.test(text) || destructiveAction.test(text))) ||
      (verticalAction.test(text) && /\b(?:angle|play|hole|opening|pressure|shot|clear|attack|breach|create|practice|shoot)\w*\b/i.test(text)) ||
      (geometryContext && destructiveAction.test(text) && unresolvedGeometryTarget.test(text))
  }
  if (Array.isArray(value)) return value.some(item => hasUnsupportedGeometry(item, geometryContext))
  return value && typeof value === 'object' ? Object.values(value).some(item => hasUnsupportedGeometry(item, geometryContext)) : false
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
    if (!Array.isArray(row.observations) || !row.observations.length || row.observations.some(x => typeof x !== 'string' || !x.trim())) errors.push('visible observations are required')
    if (!Array.isArray(row.uncertainties) || !row.uncertainties.length || row.uncertainties.some(x => typeof x !== 'string' || !x.trim())) errors.push('explicit uncertainties are required')
  }
  if (count === 1 && (value?.patterns?.recurring_weaknesses?.length || value?.patterns?.standout_strengths?.length)) errors.push('one frame cannot establish recurring patterns')
  const factualRows = (value?.per_image || []).map(({ specific_advice: _advice, ...facts }) => facts)
  const advice = [(value?.per_image || []).map(row => row.specific_advice), value?.practice_plan]
  if (hasUnsupportedClaim([value?.session?.headline, factualRows, value?.patterns, value?.character_feedback]) || hasUnsupportedClaim(advice, true)) errors.push('unsupported temporal or repeated-behavior claim')
  // An uncertainty in one field is still context for advice elsewhere. Never
  // infer that "it" is safe to breach merely because its noun was omitted.
  const geometryContent = [value?.session?.headline, factualRows, advice, value?.patterns, value?.character_feedback]
  if (hasUnsupportedGeometry(geometryContent, hasGeometryReference(geometryContent))) errors.push('unverified surface geometry or vertical-breach claim')
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
