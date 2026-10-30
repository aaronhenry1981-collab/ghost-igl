import { API_URL, getCurrentUser, getSession, getIdToken } from '../lib/cognito'
import { buildVodCoachingEvent } from './vodEvidence'

function sessionSubject(session) {
  try { return session?.getIdToken()?.decodePayload()?.sub || null }
  catch { return null }
}

function signInAgain() {
  return Object.assign(new Error('Please sign in to the account that created this review.'), { code: 'not_authenticated' })
}

async function saveVodEvidence(event, token) {
  const controller = new AbortController()
  let timer
  const deadline = new Promise(resolve => {
    timer = setTimeout(() => { resolve(false); controller.abort() }, 5000)
  })
  const write = (async () => {
    const response = await fetch(`${API_URL}/me/coaching-events`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ events: [event] }),
    signal: controller.signal,
  })
  if (!response.ok) return false
  const receipt = await response.json().catch(() => null)
  // The batch API can return HTTP 200 with unprocessed writes. Status alone
  // is not a durable-save receipt for the one event we submitted.
    return receipt?.written === 1 && receipt?.received === 1
  })()
  try { return await Promise.race([write, deadline]) }
  catch { return false }
  finally { clearTimeout(timer) }
}

// Retry only the existing evidence event, never the paid review. Its stable
// sessionId/ts key makes a lost-response replay overwrite the same evidence.
export async function retryVodEvidenceApi(analysis, lifecycle = {}) {
  const pending = analysis?.roadmap_retry
  const user = getCurrentUser()
  if (!user || !pending?.event?.sessionId || !pending?.event?.ts) throw signInAgain()
  const session = await getSession(user)
  if (!pending.subject || sessionSubject(session) !== pending.subject) throw signInAgain()
  if (lifecycle.isCurrent && !lifecycle.isCurrent()) throw signInAgain()
  const saved = await saveVodEvidence(pending.event, getIdToken(session))
  if (!saved) throw Object.assign(new Error('Saving is not confirmed yet. Your review is still available. Retry saving later; this does not use another review attempt.'), { code: 'evidence_save_pending' })
  return { ...analysis, roadmap_sync: 'saved', roadmap_retry: undefined }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result || ''
      const comma = String(result).indexOf(',')
      resolve(comma >= 0 ? String(result).slice(comma + 1) : String(result))
    }
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

// Backward-compat single-image API. Calls the new multi-image endpoint with
// a single-element images array — old UI keeps working unchanged.
export async function analyzeScreenshotApi(file, context = {}) {
  return analyzeSessionApi([file], context)
}

// Supported rank/stat intake. Tracker Network does not expose a dependable
// third-party Siege API, so users import a screenshot they can already view.
// The backend uses a separate evidence-only contract and never scrapes TRN.
export async function analyzeRankSnapshotApi(file) {
  return analyzeSessionApi([file], { game_id: 'r6', analysis_type: 'rank_snapshot' })
}

// Multi-image session analysis. Accepts 1-10 files + optional context hints
// (game_id, map, side, operator/character) and returns the session-shaped
// response.
//
// context shape: {
//   game_id?: 'r6' | 'cs2' | 'valorant' | 'ow2' | 'apex' | 'mvr' | 'halo' |
//             'finals' | 'cod' | 'fn' | 'rl',  // defaults server-side to 'r6'
//   map?: 'bank',
//   side?: 'attack',
//   operator?: 'Thermite',  // or 'character' — server accepts both
// }
export async function analyzeSessionApi(files, context = {}, lifecycle = {}) {
  if (!API_URL) throw new Error('API not configured')
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('At least one screenshot is required')
  }
  const cognitoUser = getCurrentUser()
  if (!cognitoUser) {
    const err = new Error('Please sign in to use VOD analysis.')
    err.code = 'not_authenticated'
    throw err
  }
  const session = await getSession(cognitoUser)
  const token = getIdToken(session)
  const subject = sessionSubject(session)
  if (!token || !subject) throw signInAgain()

  // Encode all images in parallel
  const images = await Promise.all(
    files.map(async (file) => ({
      base64: await fileToBase64(file),
      media_type: file.type || 'image/png',
    }))
  )

  // File encoding can outlive logout/reset. Do not start a paid request with
  // a former session after that interruption. Once dispatched, cancellation
  // does not imply the server waived its reserved allowance.
  const currentUser = getCurrentUser()
  if (!currentUser || sessionSubject(await getSession(currentUser)) !== subject) throw signInAgain()
  if (lifecycle.isCurrent && !lifecycle.isCurrent()) {
    throw Object.assign(new Error('Review cancelled before processing started.'), { code: 'review_cancelled' })
  }

  const body = { images }
  // game_id rides at the top level so the Lambda doesn't have to dig into
  // context to route. Default to r6 server-side if missing.
  if (context.game_id) body.game_id = context.game_id
  if (context.analysis_type) body.analysis_type = context.analysis_type

  // Only include context fields the user actually set — empty strings would
  // confuse the AI into thinking the user specified empty values.
  const cleanContext = {}
  if (context.map) cleanContext.map = context.map
  if (context.side) cleanContext.side = context.side
  if (context.operator) cleanContext.operator = context.operator
  if (context.character) cleanContext.character = context.character
  if (context.site) cleanContext.site = context.site
  if (Object.keys(cleanContext).length > 0) body.context = cleanContext

  const res = await fetch(`${API_URL}/vod/analyze`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    const err = new Error(errBody.message || errBody.error || `Analysis failed (${res.status})`)
    err.code = errBody.error
    err.status = res.status
    err.allowance_consumed = errBody.allowance_consumed === true
    if (errBody.usage && typeof errBody.usage === 'object' && !Array.isArray(errBody.usage)) {
      err.usage = errBody.usage
    }
    // Surface usage-cap fields from 429s so the UI can show "12/20 used, resets in 4 days"
    // without a second fetch.
    if (errBody.error === 'usage_limit_exceeded') {
      err.used = errBody.used
      err.limit = errBody.limit
      err.is_trial = errBody.is_trial
      err.period_end = errBody.period_end
      err.upgrade_url = errBody.upgrade_url
    }
    throw err
  }

  const result = await res.json()

  // Round Review is part of the same coaching loop as Road to Champion.
  // Keep analysis success independent: a temporary evidence-sync failure must
  // never hide feedback the player already paid to generate.
  if (context.analysis_type !== 'rank_snapshot' && !result.error) {
    // Processing can finish after logout/reset. That paid attempt may already
    // be consumed, but it must not initiate a new evidence write in an old
    // identity's scope. Recheck both the current session and caller lifecycle.
    if (lifecycle.isCurrent && !lifecycle.isCurrent()) return result
    const evidenceUser = getCurrentUser()
    const evidenceSession = evidenceUser ? await getSession(evidenceUser).catch(() => null) : null
    if (sessionSubject(evidenceSession) !== subject) return result
    if (lifecycle.isCurrent && !lifecycle.isCurrent()) return result
    const event = buildVodCoachingEvent(result, context)
    result.roadmap_retry = { event, subject }
    try {
      result.roadmap_sync = await saveVodEvidence(event, getIdToken(evidenceSession)) ? 'saved' : 'pending'
      if (result.roadmap_sync === 'saved') result.roadmap_retry = undefined
    } catch {
      result.roadmap_sync = 'pending'
    }
  }

  return result
}
