// Public release metadata only. Identity, funding and all provider limits are
// enforced by the existing pilot backend; no account subject or credential is bundled.
export const BROWSER_COACH_PILOT = Object.freeze({
  apiBaseUrl: 'https://gc3tzbeeoi.execute-api.us-east-1.amazonaws.com/prod',
  startsAt: '2026-10-20T03:01:21Z',
  endsAt: '2026-10-21T03:01:21Z',
})
const normalize = value => typeof value === 'string' ? value.trim().replace(/\/+$/, '') : ''
export const isPilotBuildConfigured = value => normalize(value) === BROWSER_COACH_PILOT.apiBaseUrl
export const isPilotWindowOpen = (now = Date.now()) => now >= Date.parse(BROWSER_COACH_PILOT.startsAt) && now < Date.parse(BROWSER_COACH_PILOT.endsAt)
export function pilotApiBase(value) {
  if (!isPilotBuildConfigured(value)) throw new Error('This website build is not connected to the approved browser coaching pilot.')
  return BROWSER_COACH_PILOT.apiBaseUrl
}
export const canShowPilotEntry = ({ isAdmin, apiBase, now = Date.now() }) => isAdmin === true && isPilotBuildConfigured(apiBase) && isPilotWindowOpen(now)
export const canUsePilotControls = ({ availability, activeSession = false, now = Date.now() }) => isPilotWindowOpen(now) && availability?.serviceEnabled === true && (availability.available === true || activeSession)
