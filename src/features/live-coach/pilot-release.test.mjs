import test from 'node:test'
import assert from 'node:assert/strict'
import { BROWSER_COACH_PILOT as pilot, canShowPilotEntry, canUsePilotControls, isPilotWindowOpen, pilotApiBase } from './pilot-release.mjs'
const now = Date.parse('2026-10-21T00:00:00Z')
test('pilot build connects only to the exact approved backend and fails closed', () => {
  assert.equal(pilotApiBase(`${pilot.apiBaseUrl}/`), pilot.apiBaseUrl)
  for (const value of [undefined, '', 'https://other.invalid', `${pilot.apiBaseUrl}/extra`, 'http://localhost:5599']) assert.throws(() => pilotApiBase(value))
})
test('pilot navigation needs the configured build, existing admin role and original window', () => {
  assert.equal(canShowPilotEntry({ isAdmin: true, apiBase: pilot.apiBaseUrl, now }), true)
  assert.equal(canShowPilotEntry({ isAdmin: false, apiBase: pilot.apiBaseUrl, now }), false)
  assert.equal(canShowPilotEntry({ isAdmin: true, now }), false)
  assert.equal(canShowPilotEntry({ isAdmin: true, apiBase: pilot.apiBaseUrl, now: Date.parse(pilot.endsAt) }), false)
})
test('client window preserves the exact original start and end; backend remains authoritative', () => {
  assert.equal(isPilotWindowOpen(Date.parse(pilot.startsAt) - 1), false)
  assert.equal(isPilotWindowOpen(Date.parse(pilot.startsAt)), true)
  assert.equal(isPilotWindowOpen(Date.parse(pilot.endsAt) - 1), true)
  assert.equal(isPilotWindowOpen(Date.parse(pilot.endsAt)), false)
})
test('service enabled does not grant an unfunded account source controls', () => {
  assert.equal(canUsePilotControls({ availability: { serviceEnabled: true, available: false }, now }), false)
  assert.equal(canUsePilotControls({ availability: { serviceEnabled: true, available: true }, now }), true)
})
test('an active funded session keeps Stop available at quota exhaustion, but never beyond expiry', () => {
  const availability = { serviceEnabled: true, available: false }
  assert.equal(canUsePilotControls({ availability, activeSession: true, now }), true)
  assert.equal(canUsePilotControls({ availability, activeSession: true, now: Date.parse(pilot.endsAt) }), false)
})
