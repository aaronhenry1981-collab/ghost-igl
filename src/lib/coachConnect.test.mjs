import test from 'node:test'
import assert from 'node:assert/strict'
import { coachSessionEntries } from './coachConnect.js'

const session = {
  isValid: () => true,
  getIdToken: () => ({ getJwtToken: () => 'test-id' }),
  getAccessToken: () => ({ getJwtToken: () => 'test-access' }),
  getRefreshToken: () => ({ getToken: () => 'test-refresh' }),
  getClockDrift: () => 2,
}
test('handoff includes only current session allowlisted keys', () => {
  const entries = coachSessionEntries('client', 'alice', session)
  assert.equal(Object.keys(entries).length, 5)
  assert.equal(entries['CognitoIdentityServiceProvider.client.LastAuthUser'], 'alice')
  assert.equal(entries['CognitoIdentityServiceProvider.client.alice.clockDrift'], '2')
  assert.ok(Object.keys(entries).every(key => key.endsWith('.LastAuthUser') || key.includes('.alice.')))
})
test('signed out, invalid and incomplete sessions cannot be handed off', () => {
  assert.equal(coachSessionEntries('client', '', session), null)
  assert.equal(coachSessionEntries('client', 'alice', null), null)
  assert.equal(coachSessionEntries('client', 'alice', {...session,isValid:()=>false}), null)
  assert.equal(coachSessionEntries('client', 'alice', {...session,getRefreshToken:()=>null}), null)
})
