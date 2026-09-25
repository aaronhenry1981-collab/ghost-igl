import test from 'node:test'
import assert from 'node:assert/strict'
import { buildFixtureWorld } from '../fixtures/world.mjs'
import { storeSeedFromWorld } from '../fixtures/seed.mjs'
import { createMemoryTables } from '../data/memoryTables.mjs'
import { createMemoryStore } from '../data/memoryStore.mjs'
import { assembleOne } from '../data/assemble.mjs'
import { buildFacts } from './facts.mjs'
import { deriveLifecycle } from './lifecycle.mjs'
import { deriveActivation } from './activation.mjs'
import { deriveMission } from './mission.mjs'
import { buildHomeView } from './home.mjs'

const NOW = Date.parse('2026-09-25T15:00:00.000Z')
const CONFIG = { features: { messaging: true }, activityTrackingSince: '2026-09-01T00:00:00.000Z' }

async function adminView(key, { failures = {} } = {}) {
  const world = buildFixtureWorld(NOW)
  const tables = createMemoryTables(world, { failures })
  const store = createMemoryStore(storeSeedFromWorld(world))
  const s = world.scenarios[key]
  const one = await assembleOne({ tables, store, email: s.email, withCognito: true })
  const facts = buildFacts({ now: NOW, config: CONFIG, identity: one.identity, sources: one.sources })
  return { facts, lifecycle: deriveLifecycle(facts, NOW) }
}

async function customerView(key) {
  const world = buildFixtureWorld(NOW)
  const tables = createMemoryTables(world)
  const store = createMemoryStore(storeSeedFromWorld(world))
  const s = world.scenarios[key]
  const one = await assembleOne({ tables, store, email: s.email, sub: s.sub, signedIn: true })
  const facts = buildFacts({ now: NOW, config: CONFIG, identity: { ...one.identity, signedIn: true }, sources: one.sources })
  return { facts, lifecycle: deriveLifecycle(facts, NOW), mission: deriveMission(facts, NOW), activation: deriveActivation(facts), view: buildHomeView(facts) }
}

const codes = (lifecycle) => lifecycle.risks.map((r) => r.code)

test('new customer: signed up, healthy, mission is to finish the profile', async () => {
  const { lifecycle } = await adminView('new')
  assert.equal(lifecycle.stage, 'signed_up')
  assert.equal(lifecycle.health, 'healthy')
  const { mission, activation, view } = await customerView('new')
  assert.equal(mission.id, 'complete_profile')
  assert.equal(activation.done, 0)
  assert.equal(view.membership.planLabel, 'Basic')
  assert.equal(view.roadToChampion, null, 'no fabricated 0% progress')
})

test('activated free player: activated (not engaged), healthy, continues Road to Champion', async () => {
  const { lifecycle, facts } = await adminView('free_activated')
  assert.equal(facts.activity.activeDays14, 2)
  assert.equal(lifecycle.stage, 'activated')
  assert.equal(lifecycle.health, 'healthy')
  const { mission } = await customerView('free_activated')
  assert.equal(mission.id, 'continue_climb')
  assert.equal(mission.title, 'Sound is free intel', 'next unchecked Silver habit (player rank tier)')
})

test('paying active player: Elite, paid, healthy, VOD fix is the mission', async () => {
  const { lifecycle, facts } = await adminView('paying_active')
  assert.equal(facts.billing.plan, 'elite')
  assert.equal(facts.billing.planLabel, 'Elite')
  assert.equal(lifecycle.stage, 'paid')
  assert.equal(lifecycle.health, 'healthy')
  assert.deepEqual(codes(lifecycle), [])
  const { mission, view } = await customerView('paying_active')
  assert.equal(mission.id, 'apply_vod_fix')
  assert.match(mission.body, /Peeking the same angle twice/)
  assert.equal(view.vod.usage.limit, 60)
  assert.equal(view.vod.usage.used, 7)
  assert.equal(view.skills.gaps.length, 2)
})

test('paying player who cannot access the product: critical access risk, never "healthy"', async () => {
  const { lifecycle, facts } = await adminView('paying_locked_out')
  assert.equal(facts.account.status, 'force_change_password')
  assert.equal(lifecycle.stage, 'at_risk')
  assert.equal(lifecycle.health, 'critical')
  assert.ok(codes(lifecycle).includes('account_setup_incomplete'))
})

test('stale renewal: paying player locked out by the ledger is critical, not churned', async () => {
  const { lifecycle, facts } = await adminView('paying_renewal_stale')
  assert.equal(facts.billing.status, 'renewal_unconfirmed')
  assert.equal(lifecycle.stage, 'at_risk')
  assert.equal(lifecycle.health, 'critical')
  assert.ok(codes(lifecycle).includes('renewal_unconfirmed'))
  const { mission, view } = await customerView('paying_renewal_stale')
  assert.equal(mission.id, 'confirm_renewal')
  assert.equal(view.membership.upgrade, null, 'no upsell while access is broken')
})

test('at-risk Champion: inactive, unused sessions, unhappy feedback -> at_risk with explained reasons', async () => {
  const { lifecycle, facts } = await adminView('at_risk')
  assert.equal(facts.billing.plan, 'champion')
  assert.equal(lifecycle.stage, 'at_risk')
  assert.equal(lifecycle.health, 'at_risk')
  const c = codes(lifecycle)
  assert.ok(c.includes('inactive_14d'))
  assert.ok(c.includes('unused_paid_features'))
  assert.ok(c.includes('negative_feedback'))
  for (const r of lifecycle.risks) assert.ok(r.reason && r.evidence.length >= 1, `${r.code} explains itself`)
})

test('failed payment on legacy $29 Elite: plan paused, lastPaidPlan elite, mission fixes payment', async () => {
  const { lifecycle, facts } = await adminView('payment_failed')
  assert.equal(facts.billing.hasAccess, false)
  assert.equal(facts.billing.lastPaidPlan, 'elite')
  assert.equal(lifecycle.health, 'critical')
  const { mission } = await customerView('payment_failed')
  assert.equal(mission.id, 'fix_payment')
  assert.equal(mission.cta.action, 'billing_portal')
})

test('churned and dormant players are labelled from facts', async () => {
  assert.equal((await adminView('churned')).lifecycle.stage, 'churned')
  const dormant = await adminView('dormant_free')
  assert.equal(dormant.lifecycle.stage, 'activated')
  assert.equal(dormant.lifecycle.health, 'dormant')
})

test('unconfirmed signup is routine: low-severity signal, not a human-review item', async () => {
  const { lifecycle } = await adminView('unconfirmed')
  assert.equal(lifecycle.stage, 'signed_up')
  assert.deepEqual(codes(lifecycle), ['email_unconfirmed'])
  assert.equal(lifecycle.health, 'healthy')
})

test('billing source failure yields unknown health, never Basic or churned', async () => {
  const { lifecycle, facts } = await adminView('paying_active', { failures: { subscriptions: true } })
  assert.equal(facts.sources.billing, 'unavailable')
  assert.equal(facts.billing.status, 'unknown')
  assert.equal(lifecycle.health, 'unknown')
  assert.notEqual(lifecycle.stage, 'churned')
})

test('customer view model never exposes internal lifecycle or health labels', async () => {
  const { view } = await customerView('at_risk')
  assert.equal(view.lifecycle, null)
  const text = JSON.stringify(view)
  assert.doesNotMatch(text, /at_risk|at risk|critical|negative_feedback|inactive_14d/i)
})

test('paused access still shows the plan the player pays for, never "Basic"', async () => {
  const stale = await customerView('paying_renewal_stale')
  assert.equal(stale.view.membership.planLabel, 'Pro')
  assert.equal(stale.view.membership.accessPlan, 'free')
  assert.equal(stale.view.membership.paused, true)
  assert.match(stale.view.membership.statusLabel, /paused/)
  const failed = await customerView('payment_failed')
  assert.equal(failed.view.membership.planLabel, 'Elite')
  assert.equal(failed.view.membership.upgrade, null)
})

test('Champion who has not booked this month is sent to book the included session first', async () => {
  const { mission } = await customerView('at_risk')
  assert.equal(mission.id, 'book_included_session')
  assert.match(mission.body, /two live 1:1 sessions/)
})
