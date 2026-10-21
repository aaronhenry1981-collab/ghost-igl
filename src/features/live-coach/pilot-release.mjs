// Public release metadata only. Identity, funding and all provider limits are
// enforced by the existing pilot backend; no account subject or credential is bundled.
export const BROWSER_COACH_PILOT = Object.freeze({
  apiBaseUrl: 'https://gc3tzbeeoi.execute-api.us-east-1.amazonaws.com/prod',
  maxWindowMs: 60 * 60_000,
  maxFrames: 3,
  maxSpendMicros: 100_000,
})
const normalize = value => typeof value === 'string' ? value.trim().replace(/\/+$/, '') : ''
export const isPilotBuildConfigured = value => normalize(value) === BROWSER_COACH_PILOT.apiBaseUrl
// An authenticated funded response supplies the deadline. Deploying this page
// cannot activate, renew or fund a test window.
export function pilotWindowDeadline(availability, now = Date.now()) {
  const end = availability?.endsAt
  return availability?.serviceEnabled === true && availability.kind === 'pilot' &&
    Number.isSafeInteger(end) && end > now && end - now <= BROWSER_COACH_PILOT.maxWindowMs &&
    Number.isSafeInteger(availability.framesRemaining) && availability.framesRemaining >= 0 && availability.framesRemaining <= BROWSER_COACH_PILOT.maxFrames &&
    Number.isSafeInteger(availability.creditsRemaining) && availability.creditsRemaining >= 0 && availability.creditsRemaining <= BROWSER_COACH_PILOT.maxSpendMicros &&
    availability.shareMinutesRemaining === 0 ? end : 0
}
export const isPilotWindowOpen = (availability, now = Date.now()) => pilotWindowDeadline(availability, now) > 0
export function pilotApiBase(value) {
  if (!isPilotBuildConfigured(value)) throw new Error('This website build is not connected to the approved browser coaching pilot.')
  return BROWSER_COACH_PILOT.apiBaseUrl
}
export const canShowPilotEntry = ({ isAdmin, apiBase }) => isAdmin === true && isPilotBuildConfigured(apiBase)
export const canUsePilotControls = ({ availability, activeSession = false, now = Date.now() }) => isPilotWindowOpen(availability, now) && (availability.available === true || activeSession)
