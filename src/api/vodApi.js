import { VOD_STREAM_URL } from './vodStreamConfig.mjs'
import { pollVodJob, readPendingJob, savePendingJob, clearPendingJob, jobPending } from './vodJobPolling.mjs'
import { API_URL, getCurrentUser, getSession, getIdToken } from '../lib/cognito'
import { buildVodCoachingEvent } from './vodEvidence'
import { preflightVodUpload, serializeVodRequest } from './vodUploadSize.mjs'

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
  if (files !== null && (!Array.isArray(files) || files.length === 0)) {
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

  // Browser receipts contain only job ID/context, never credentials or image bytes.
  const pending = typeof readPendingJob === 'function' ? readPendingJob(subject) : null
  if (pending) return resumeVodReviewApi(lifecycle)
  if (files === null) throw Object.assign(new Error('No pending review found for this account.'), { code: 'review_not_found' })

  // Reject the whole batch before allocating any base64 image strings.
  const body = preflightVodUpload(files, context)

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

  body.images = images
  const streamUrl = typeof VOD_STREAM_URL === 'string' ? VOD_STREAM_URL : ''
  const requestId = streamUrl ? globalThis.crypto?.randomUUID?.() : null
  if (streamUrl && !requestId) throw Object.assign(new Error('A secure review receipt could not be created. No review was submitted.'), {code:'review_receipt_unavailable'})
  if (requestId) body.request_id = requestId
  const serializedBody = serializeVodRequest(body)
  if (requestId && !savePendingJob({ subject, jobId: requestId, context, createdAt: Date.now() })) throw Object.assign(new Error('This browser cannot retain the review receipt. Enable session storage before submitting. No review was started.'), {code:'review_receipt_unavailable'})

  const admissionAbort = requestId ? new AbortController() : null
  const admissionTimer = requestId ? setTimeout(() => admissionAbort.abort(), 35000) : null
  let res
  try { res = await fetch(`${streamUrl || API_URL}/vod/analyze`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: serializedBody,
    ...(admissionAbort ? {signal:admissionAbort.signal} : {}),
  }) } catch (error) {
    if (requestId) throw jobPending()
    throw error
  } finally { if (admissionTimer) clearTimeout(admissionTimer) }
  if (streamUrl && res.ok) {
    // HTTP headers are emitted only after durable admission. We deliberately use
    // owner-bound GET polling as the single result path. Disconnecting this stream
    // does not stop the awaited Lambda execution; never replay the POST.
    try { await res.body?.cancel() } catch { /* Check the original receipt. */ }
    return resumeVodReviewApi(lifecycle)
  }
  if (res.status === 202) {
    const receipt = await res.json()
    if (!receipt.jobId || (requestId && receipt.jobId !== requestId)) throw jobPending()
    savePendingJob({subject,jobId:receipt.jobId,context,createdAt:Date.now()})
    return resumeVodReviewApi(lifecycle)
  }
  if (requestId && res.status >= 500) {
    const problem = await res.json().catch(() => null)
    if (!problem || problem.error === 'review_status_unavailable') throw jobPending()
    res = {ok:false,status:res.status,json:async()=>problem}
  }
  if (requestId) clearPendingJob(subject)

  return finishVodResponse(res, context, lifecycle, subject)
}

async function finishVodResponse(res, context, lifecycle, subject, jobId = null, createdAt = null) {
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
    const event = buildVodCoachingEvent(result, context, jobId ? { sessionId: `vod-job-${jobId}`, now: new Date(createdAt).toISOString() } : {})
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

export async function resumeVodReviewApi(lifecycle = {}) {
  const user = getCurrentUser()
  const session = user ? await getSession(user) : null
  const subject = sessionSubject(session)
  if (!subject) throw signInAgain()
  const pending = readPendingJob(subject)
  if (!pending) throw Object.assign(new Error('No pending review found for this account.'), {code:'review_not_found'})
  if (Date.now() - pending.createdAt >= 3600000) { clearPendingJob(subject); throw Object.assign(new Error('The saved review receipt expired. No automatic paid retry was made.'), {code:'review_failed'}) }
  let res
  try { res = await pollVodJob({jobId:pending.jobId,isCurrent:()=>!lifecycle.isCurrent || lifecycle.isCurrent(),
    fetchStatus: async jobId => {
      const currentUser=getCurrentUser()
      const currentSession=currentUser?await getSession(currentUser):null
      if(sessionSubject(currentSession)!==subject) throw signInAgain()
      if(lifecycle.isCurrent && !lifecycle.isCurrent()) throw Object.assign(new Error('Review cancelled'),{code:'review_cancelled'})
      const controller=new AbortController()
      const timer=setTimeout(()=>controller.abort(),10000)
      try { return await fetch(        API_URL+'/vod/jobs/'+encodeURIComponent(jobId),{headers:{Authorization:'Bearer '+getIdToken(currentSession)},signal:controller.signal}) }
      finally {clearTimeout(timer)}
    }}) } catch(error) { if(error.code==='review_failed') clearPendingJob(subject); throw error }
  const finalUser=getCurrentUser()
  const finalSession=finalUser?await getSession(finalUser):null
  if(sessionSubject(finalSession)!==subject || (lifecycle.isCurrent && !lifecycle.isCurrent())) throw signInAgain()
  clearPendingJob(subject)
  const result=await finishVodResponse(res,pending.context||{},lifecycle,subject,pending.jobId,pending.createdAt)
  clearPendingJob(subject)
  return result
}
