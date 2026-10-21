import test from 'node:test'
import assert from 'node:assert/strict'
import { BROWSER_COACH_PILOT as pilot, canShowPilotEntry, canUsePilotControls, isPilotWindowOpen, pilotApiBase, pilotWindowDeadline } from './pilot-release.mjs'
const now = Date.parse('2030-01-01T00:00:00Z')
const ready = { serviceEnabled: true, available: true, kind: 'pilot', endsAt: now + 60 * 60_000, framesRemaining: 3, creditsRemaining: 100_000, shareMinutesRemaining: 0 }

test('pilot build connects only to the approved backend', () => {
  assert.equal(pilotApiBase(`${pilot.apiBaseUrl}/`), pilot.apiBaseUrl)
  for (const value of [undefined, '', 'https://other.invalid', `${pilot.apiBaseUrl}/extra`, 'http://localhost:5599']) assert.throws(() => pilotApiBase(value))
})
test('admin navigation remains discoverable without granting capture access', () => {
  assert.equal(canShowPilotEntry({ isAdmin: true, apiBase: pilot.apiBaseUrl }), true)
  assert.equal(canShowPilotEntry({ isAdmin: false, apiBase: pilot.apiBaseUrl }), false)
  assert.equal(canShowPilotEntry({ isAdmin: true }), false)
  assert.equal(canUsePilotControls({ availability: { serviceEnabled: false }, now }), false)
})
test('only a finite server deadline within the approved hour opens access', () => {
  assert.equal(pilotWindowDeadline(ready, now), ready.endsAt)
  for (const value of [null, {}, { serviceEnabled: true, available: true }, { ...ready, endsAt: now }, { ...ready, endsAt: ready.endsAt + 1 }, { ...ready, endsAt: String(ready.endsAt) }, { ...ready, kind: 'paid' }]) assert.equal(isPilotWindowOpen(value, now), false)
})
test('a funded solo test allows source controls; service-enabled alone does not', () => {
  assert.equal(canUsePilotControls({ availability: { ...ready, available: false }, now }), false)
  assert.equal(canUsePilotControls({ availability: ready, now }), true)
})
test('an active session keeps Stop available at quota exhaustion until expiry', () => {
  const availability = { ...ready, available: false, framesRemaining: 0, creditsRemaining: 0 }
  assert.equal(canUsePilotControls({ availability, activeSession: true, now }), true)
  assert.equal(canUsePilotControls({ availability, activeSession: true, now: ready.endsAt }), false)
})
test('broader or invalid grants cannot unlock the three-image no-sharing test', () => {
  for (const change of [{ framesRemaining: 5 }, { framesRemaining: -1 }, { creditsRemaining: 250000 }, { creditsRemaining: NaN }, { shareMinutesRemaining: 30 }, { serviceEnabled: false }]) assert.equal(canUsePilotControls({ availability: { ...ready, ...change }, now }), false)
})
test('a later explicitly funded window needs no website clock rewrite and never renews itself', () => {
  const later = now + 86400000
  assert.equal(isPilotWindowOpen(ready, later), false)
  assert.equal(isPilotWindowOpen({ ...ready, endsAt: later + 60 * 60_000 }, later), true)
  assert.equal(isPilotWindowOpen({ ...ready, serviceEnabled: false, endsAt: later + 60 * 60_000 }, later), false)
})
