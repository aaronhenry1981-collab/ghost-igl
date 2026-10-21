import { getCurrentUser, getIdToken, getSession } from '../../lib/cognito'
import { pilotApiBase } from './pilot-release.mjs'

export const liveRequestId = () => crypto.randomUUID()
export async function liveRequest(path, body, signal) {
  const user = getCurrentUser()
  if (!user) throw new Error('Sign in to Recon 6 first.')
  const token = getIdToken(await getSession(user))
  if (getCurrentUser()?.getUsername() !== user.getUsername()) throw new Error('Your account changed. Start again from your current account.')
  const base = pilotApiBase(import.meta.env.VITE_LIVE_COACH_API_BASE_URL)
  const response = await fetch(`${base}/live-coach${path}`, {
    method: body === undefined ? 'GET' : 'POST', signal, cache: 'no-store',
    headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(liveErrorText(data.error || (response.status === 404 ? 'not_activated' : 'request_failed')))
    error.code = data.error; throw error
  }
  return data
}
function liveErrorText(code) {
  const messages = {
    not_activated: 'Hosted coaching is not activated yet. Your existing coach and round guide are available.',
    credits_exhausted: 'Your coaching credits are used up. No overage will be charged.',
    finite_credit_grant_required: 'This account has no funded coaching credits for this period.',
    paid_period_not_funded: 'This billing period is not funded for hosted coaching.',
    operational_budget_exhausted: 'Hosted coaching has reached its operating limit. No new paid work will start.',
    coaching_paused: 'Hosted coaching is paused.',
    private_invitation_required: 'This private invitation requires the invited coach’s verified Recon account. It may have expired.',
    participant_already_joined: 'This participant already joined. Stop the session before opening a new connection.',
    one_active_session_per_account: 'You already have an active session. Stop it in session history first.',
    session_not_active: 'The session has ended or expired.',
    provider_failed: 'Analysis did not return. It will not retry automatically; the reserved credit may have been used.',
    analysis_unavailable: 'AI frame analysis is not available for this release.',
    analysis_rate_limit: 'Wait before requesting another gameplay frame.',
    request_failed: 'The request could not be completed. Check your connection and try again.',
  }
  return messages[code] || String(code).replaceAll('_', ' ')
}
