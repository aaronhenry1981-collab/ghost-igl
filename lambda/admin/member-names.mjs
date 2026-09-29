// Member names (profiles table: first_name, last_name). Used by the admin
// name route and tools/backfill-member-names.mjs.
//
// Rules:
//   - A name edit only ever touches the profile's name fields: never email,
//     billing, subscriptions or entitlements. The email stays the key.
//   - Names are stored as the person wrote them (no re-capitalising), with
//     whitespace collapsed. Either part may be empty (single-name members).
//   - The backfill only SPLITS an unambiguous "Given Family" string taken
//     from Cognito or Stripe. Anything else (one word, three or more words,
//     digits, @, odd characters, or two sources that disagree) is kept for
//     review, never guessed. Names are never derived from an email address.

export const NAME_MAX = 100
const CONTROL = /[\u0000-\u001f\u007f-\u009f]/
const NAME_TOKEN = /^[\p{L}\p{M}][\p{L}\p{M}'’.-]*$/u

/** Trimmed, whitespace-collapsed, NFC. Throws on control characters or > 100 chars. */
export function cleanNamePart(value, label = 'name') {
  if (value == null) return ''
  if (typeof value !== 'string') throw new Error(`${label} must be text`)
  const s = value.normalize('NFC').replace(/\s+/g, ' ').trim()
  if (CONTROL.test(s)) throw new Error(`${label} contains control characters`)
  if (s.length > NAME_MAX) throw new Error(`${label} is longer than ${NAME_MAX} characters`)
  if (s.includes('@')) throw new Error(`${label} looks like an email address`)
  return s
}

/** Validated { first, last } for an edit. Both empty = clear the name. */
export function validateNameEdit(body) {
  return { first: cleanNamePart(body?.first_name, 'First name'), last: cleanNamePart(body?.last_name, 'Last name') }
}

/** Split a full-name string from Cognito `name` or a Stripe customer name. */
export function splitFullName(raw) {
  let s
  try { s = cleanNamePart(raw) } catch (err) { return { status: 'ambiguous', raw: String(raw || '').slice(0, 120), reason: err.message } }
  if (!s) return { status: 'empty' }
  if (/\d/.test(s)) return { status: 'ambiguous', raw: s, reason: 'contains digits' }
  const tokens = s.split(' ')
  if (!tokens.every((t) => NAME_TOKEN.test(t))) return { status: 'ambiguous', raw: s, reason: 'unusual characters' }
  if (tokens.length === 2) return { status: 'split', first: tokens[0], last: tokens[1] }
  if (tokens.length === 1) return { status: 'ambiguous', raw: s, reason: 'one word: a single name or a handle' }
  return { status: 'ambiguous', raw: s, reason: `${tokens.length} words: which part is the family name is unclear` }
}

/**
 * Backfill decision for one member. `existing` = profile { first_name,
 * last_name }; `sources` = [{ source: 'cognito' | 'stripe', given, family,
 * full }]. Existing names always win.
 *   { action: 'keep' }                         names already present
 *   { action: 'set', first, last, source }     one reliable answer
 *   { action: 'review', candidates }           ambiguous or conflicting
 *   { action: 'missing' }                      nothing usable
 */
export function decideName(existing, sources) {
  if (existing?.first_name || existing?.last_name) return { action: 'keep' }
  const answers = []
  const candidates = []
  for (const src of sources) {
    if (src.given || src.family) {
      let first = ''
      let last = ''
      try {
        first = cleanNamePart(src.given || '')
        last = cleanNamePart(src.family || '')
      } catch (err) {
        candidates.push({ source: src.source, value: `${src.given || ''} ${src.family || ''}`.trim(), reason: err.message })
        continue
      }
      if (first || last) answers.push({ source: src.source, first, last })
      continue
    }
    if (!src.full) continue
    const r = splitFullName(src.full)
    if (r.status === 'split') answers.push({ source: src.source, first: r.first, last: r.last })
    else if (r.status === 'ambiguous') candidates.push({ source: src.source, value: r.raw, reason: r.reason })
  }
  // Same name from several sources = one answer; the first source (Cognito,
  // what the person typed at sign-up) is the one kept.
  const distinct = []
  for (const a of answers) {
    const key = `${a.first.toLowerCase()}|${a.last.toLowerCase()}`
    if (!distinct.some((d) => `${d.first.toLowerCase()}|${d.last.toLowerCase()}` === key)) distinct.push(a)
  }
  if (distinct.length > 1) {
    return { action: 'review', candidates: [...distinct.map((a) => ({ source: a.source, value: `${a.first} ${a.last}`.trim(), reason: 'sources disagree' })), ...candidates] }
  }
  if (distinct.length === 1) return { action: 'set', first: distinct[0].first, last: distinct[0].last, source: distinct[0].source }
  if (candidates.length) return { action: 'review', candidates }
  return { action: 'missing' }
}

/** Name fields a member record exposes to the admin UI. */
export function nameFieldsOf(profile) {
  let review = null
  if (profile?.name_review) {
    try { review = JSON.parse(profile.name_review) } catch { review = null }
  }
  return {
    first_name: profile?.first_name || null,
    last_name: profile?.last_name || null,
    name_source: profile?.name_source || ((profile?.first_name || profile?.last_name) ? 'member' : null),
    name_updated_at: profile?.name_updated_at || null,
    name_review: review,
  }
}
