import test from 'node:test'
import assert from 'node:assert/strict'
import { INCIDENT_SERVICES, INCIDENT_SEVERITIES, INCIDENT_STATUSES, IncidentValidationError, newIncident, patchIncident, validateIncidentInput } from './incidents.mjs'

test('incident enums match §9', () => {
  assert.deepEqual(INCIDENT_SERVICES, ['identity_ubisoft', 'identity_psn', 'identity_xbox', 'trn', 'vod_processing', 'auth', 'payment_access', 'desktop_client', 'other'])
  assert.deepEqual(INCIDENT_STATUSES, ['investigating', 'identified', 'monitoring', 'resolved'])
  assert.deepEqual(INCIDENT_SEVERITIES, ['sev1', 'sev2', 'sev3', 'sev4'])
})

test('validation: strict enums, unknown fields refused, affectedCount unknown stays null', () => {
  const ok = validateIncidentInput({ title: 'VOD reviews stuck', service: 'vod_processing' })
  assert.equal(ok.status, 'investigating')
  assert.equal(ok.severity, 'sev3')
  const bad = [
    {},
    { title: 'x', service: 'stripe' },
    { title: 'x', service: 'auth', status: 'fixed' },
    { title: 'x', service: 'auth', severity: 'critical' },
    { title: 'x', service: 'auth', publish: true },
    { title: 'x', service: 'auth', affectedCount: -1 },
    { title: 'x'.repeat(161), service: 'auth' },
  ]
  for (const b of bad) assert.throws(() => validateIncidentInput(b), IncidentValidationError, JSON.stringify(b).slice(0, 60))
  assert.throws(() => validateIncidentInput({}, { partial: true }), /nothing to update/)
  assert.deepEqual(validateIncidentInput({ affectedCount: null }, { partial: true }), { affectedCount: null })
})

test('a customer-safe update is only ever a draft', () => {
  const at = '2026-09-25T15:00:00.000Z'
  const inc = newIncident({ incidentId: 'inc_abcdef0123', input: validateIncidentInput({ title: 'Auth delays', service: 'auth', customerUpdateDraft: 'We are looking into it.' }), at, by: 'lead@example.test' })
  assert.equal(inc.customerUpdate.published, false)
  assert.equal(inc.affectedCount, null)
  const patched = patchIncident(inc, { status: 'resolved', customerUpdateDraft: 'Fixed.' }, { at, by: 'lead@example.test' })
  assert.equal(patched.customerUpdate.published, false)
  assert.equal(patched.resolvedAt, at)
  assert.equal(patched.version, 2)
})
