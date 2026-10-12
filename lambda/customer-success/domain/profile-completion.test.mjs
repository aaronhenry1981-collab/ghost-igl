import test from 'node:test'
import assert from 'node:assert/strict'
import { buildFixtureWorld } from '../fixtures/world.mjs'
import { storeSeedFromWorld } from '../fixtures/seed.mjs'
import { createMemoryTables } from '../data/memoryTables.mjs'
import { createMemoryStore } from '../data/memoryStore.mjs'
import { assembleOne } from '../data/assemble.mjs'
import { buildFacts, isProfileComplete } from './facts.mjs'
import { deriveLifecycle } from './lifecycle.mjs'
import { deriveActivation } from './activation.mjs'
import { deriveMission } from './mission.mjs'

const now = Date.parse('2026-09-25T15:00:00Z')
test('optional real names do not block a valid player profile; gamertag and platform remain required', () => {
  assert.equal(isProfileComplete({ display_name: 'QuietAnchor', platform: 'ps5' }), true)
  for (const profile of [null, {}, { display_name: 'QuietAnchor' }, { platform: 'ps5' }, { first_name: 'Test', last_name: 'Player' }]) {
    assert.equal(isProfileComplete(profile), false)
  }
})

test('gamertag-only customer remains activated and gets a useful mission in the full projection', async () => {
  const world = buildFixtureWorld(now)
  const player = world.scenarios.free_activated
  const profile = world.profiles.find(row => row.email === player.email)
  delete profile.first_name; delete profile.last_name
  const one = await assembleOne({ tables: createMemoryTables(world), store: createMemoryStore(storeSeedFromWorld(world)), email: player.email, sub: player.sub, signedIn: true })
  const facts = buildFacts({ now, identity: { ...one.identity, signedIn: true }, sources: one.sources })
  assert.equal(facts.account.profileComplete, true)
  assert.equal(deriveLifecycle(facts, now).stage, 'activated')
  assert.equal(deriveActivation(facts).steps.find(step => step.id === 'profile').done, true)
  assert.equal(deriveMission(facts, now).id, 'continue_climb')
})

test('lite /me projection accepts the same nameless profile and advances past finish-profile', () => {
  const facts = buildFacts({ now, identity: { email: 'fictional@example.test', signedIn: true }, sources: {
    me: { status: 'ok', data: { plan: 'free', profile_complete: true, profile: { display_name: 'QuietAnchor', platform: 'ps5' } } },
  } })
  assert.equal(facts.account.profileComplete, true)
  assert.equal(deriveActivation(facts).steps.find(step => step.id === 'profile').done, true)
  assert.notEqual(deriveMission(facts, now).id, 'complete_profile')
})
