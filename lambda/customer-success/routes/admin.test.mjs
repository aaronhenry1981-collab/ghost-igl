import test from 'node:test'
import assert from 'node:assert/strict'
import { fixtureApp } from '../app.test.mjs'
import { routeModules } from './index.mjs'
import { contactKeyFor } from '../lib/ids.mjs'

const app = (opts = {}) => fixtureApp({ extraRoutes: routeModules, config: { directoryCacheMs: 0 }, ...opts })
const parse = (res) => JSON.parse(res.body)

const ADMIN_GETS = ['/cs/admin/overview', '/cs/admin/players', '/cs/admin/queue', `/cs/admin/players/${contactKeyFor('vertical.vex@example.test')}`, `/cs/admin/players/${contactKeyFor('vertical.vex@example.test')}/home-preview`]

test('every admin route rejects anonymous (401) and non-admin players (403)', async () => {
  const { call } = app()
  for (const path of ADMIN_GETS) {
    assert.equal((await call('GET', path)).statusCode, 401, path)
    assert.equal((await call('GET', path, { token: 'tok-paying_active' })).statusCode, 403, path)
  }
  const res = await call('POST', '/cs/admin/queue/decision', { token: 'tok-at_risk', body: { itemKey: 'x', decision: 'approve' } })
  assert.equal(res.statusCode, 403)
})

test('overview: stage and health counts come from facts; admin excluded', async () => {
  const { call } = app()
  const res = await call('GET', '/cs/admin/overview', { token: 'tok-admin' })
  assert.equal(res.statusCode, 200)
  const o = parse(res)
  const stage = Object.fromEntries(o.stages.map((s) => [s.stage, s.count]))
  assert.deepEqual(stage, { signed_up: 2, activating: 0, activated: 2, engaged: 0, paid: 1, at_risk: 4, churned: 1 })
  assert.equal(o.totals.players, 10)
  assert.deepEqual(o.payingByPlan, { pro: 1, elite: 1, champion: 1 })
  assert.equal(o.ledgerMrr, 12 + 39 + 70)
  assert.ok(o.stages.every((s) => s.definition), 'each stage carries its definition')
})

test('queue: only human decisions, each explained; routine signals are counted as auto-handled', async () => {
  const { call } = app()
  const q = parse(await call('GET', '/cs/admin/queue', { token: 'tok-admin' }))
  const types = q.items.map((i) => i.type).sort()
  assert.deepEqual(types, ['account_setup_incomplete', 'at_risk_checkin', 'negative_feedback', 'renewal_unconfirmed'])
  for (const item of q.items) {
    assert.ok(item.whatHappened && item.recommended && item.whyFlagged.length && item.controls.length, `${item.type} is fully explained`)
  }
  const auto = Object.fromEntries(q.autoHandled.map((a) => [a.code, a.count]))
  assert.equal(auto.payment_failed, 1, 'a fresh failed payment is automated, not queued')
  assert.equal(auto.email_unconfirmed, 1)
})

test('queue decisions: validated against live items, idempotent, audited, and remove the item', async () => {
  const { call, store } = app()
  const q = parse(await call('GET', '/cs/admin/queue', { token: 'tok-admin' }))
  const checkin = q.items.find((i) => i.type === 'at_risk_checkin')
  const renewal = q.items.find((i) => i.type === 'renewal_unconfirmed')

  const bad = await call('POST', '/cs/admin/queue/decision', { token: 'tok-admin', body: { itemKey: renewal.key, decision: 'approve' } })
  assert.equal(bad.statusCode, 400, 'approve is not a control for renewal_unconfirmed')
  assert.equal((await call('POST', '/cs/admin/queue/decision', { token: 'tok-admin', body: { itemKey: checkin.key, decision: 'nuke' } })).statusCode, 400)
  assert.equal((await call('POST', '/cs/admin/queue/decision', { token: 'tok-admin', body: { itemKey: 'x:y', decision: 'fix' } })).statusCode, 400)
  const fake = `at_risk_checkin:${contactKeyFor('quiet.anchor@example.test')}:2026-01-01`
  assert.equal((await call('POST', '/cs/admin/queue/decision', { token: 'tok-admin', body: { itemKey: fake, decision: 'deny' } })).statusCode, 404)

  const ok = await call('POST', '/cs/admin/queue/decision', { token: 'tok-admin', body: { itemKey: checkin.key, decision: 'approve', note: 'Sending a check-in tonight' } })
  assert.equal(ok.statusCode, 200)
  const again = await call('POST', '/cs/admin/queue/decision', { token: 'tok-admin', body: { itemKey: checkin.key, decision: 'approve' } })
  assert.ok([404, 409].includes(again.statusCode), 'a decided item cannot be decided twice')

  const after = parse(await call('GET', '/cs/admin/queue', { token: 'tok-admin' }))
  assert.equal(after.items.some((i) => i.key === checkin.key), false)
  const all = await store.listAll()
  assert.ok(all.some((i) => i.type === 'DEC' && i.itemKey === checkin.key && i.actor === 'coach.admin@example.test'))
  assert.ok(all.some((i) => i.type === 'AUDIT' && i.action === 'queue.approve'))
})

test('admin "view as player" is read-only: it never changes customer state', async () => {
  const { call, store } = app()
  const before = JSON.stringify(await store.listAll())
  const key = contactKeyFor('fading.roamer@example.test')
  const res = await call('GET', `/cs/admin/players/${key}/home-preview`, { token: 'tok-admin' })
  assert.equal(res.statusCode, 200)
  const view = parse(res)
  assert.equal(view.mode, 'preview')
  assert.equal(view.lifecycle, null)
  assert.equal(JSON.stringify(await store.listAll()), before, 'no writes during preview')
})

test('player record: one canonical record with timeline, billing rows, legacy outreach, no credentials', async () => {
  const { call } = app()
  const churned = parse(await call('GET', `/cs/admin/players/${contactKeyFor('gone.gold@example.test')}`, { token: 'tok-admin' }))
  assert.equal(churned.summary.stage, 'churned')
  assert.equal(churned.billing.rows.length, 1)
  assert.ok(churned.timeline.some((t) => t.source === 'Legacy CRM' && /Welcome email/.test(t.title)))
  const atRisk = await call('GET', `/cs/admin/players/${contactKeyFor('fading.roamer@example.test')}`, { token: 'tok-admin' })
  assert.doesNotMatch(atRisk.body, /manageToken|holdToken|password/i)
  const record = parse(atRisk)
  assert.equal(record.summary.nextAction.code, 'inactive_14d')
  assert.ok(record.queue.length >= 1)
  assert.equal((await call('GET', '/cs/admin/players/not-a-key', { token: 'tok-admin' })).statusCode, 400)
  assert.equal((await call('GET', `/cs/admin/players/pl_${'0'.repeat(20)}`, { token: 'tok-admin' })).statusCode, 404)
})

test('players list: search, views and filters; admins never listed as customers', async () => {
  const { call } = app()
  const all = parse(await call('GET', '/cs/admin/players', { token: 'tok-admin' }))
  assert.equal(all.total, 10)
  assert.equal(all.players.some((p) => p.isAdmin), false)
  const search = parse(await call('GET', '/cs/admin/players?q=theo', { token: 'tok-admin' }))
  assert.deepEqual(search.players.map((p) => p.displayName), ['VerticalVex'])
  const atRisk = parse(await call('GET', '/cs/admin/players?stage=at_risk', { token: 'tok-admin' }))
  assert.equal(atRisk.total, 4)
  const onboarding = parse(await call('GET', '/cs/admin/players?view=onboarding', { token: 'tok-admin' }))
  assert.ok(onboarding.players.every((p) => ['signed_up', 'activating'].includes(p.stage) || (p.plan !== 'free')))
})

test('partial source outage: CRM still loads and reports which source failed', async () => {
  const { call } = app({ failures: { bookings: true, cognito: true } })
  const o = parse(await call('GET', '/cs/admin/overview', { token: 'tok-admin' }))
  assert.equal(o.sourceStatus.bookings, 'unavailable')
  assert.equal(o.sourceStatus.cognito, 'unavailable')
  assert.equal(o.totals.players > 0, true)
})
