import test from 'node:test'
import assert from 'node:assert/strict'
import { fixtureApp } from '../fixtures/app.mjs'
import { routeModules } from './index.mjs'
import { contactKeyFor } from '../lib/ids.mjs'
import { buildFacts } from '../domain/facts.mjs'
import { checkEligibility, WORKFLOW_BY_ID } from '../domain/outreach.mjs'

const parse = (res) => JSON.parse(res.body)
const app = (config = {}) => fixtureApp({ extraRoutes: routeModules, config: { directoryCacheMs: 0, ...config } })

async function queueItem(call, type) {
  const q = parse(await call('GET', '/cs/admin/queue', { token: 'tok-admin' }))
  return q.items.find((i) => i.type === type)
}

test('delivery is disabled by default: approved outreach is recorded, nothing reaches the player', async () => {
  const { call, store } = app()
  const item = await queueItem(call, 'at_risk_checkin')
  assert.ok(item.draft && item.draft.body, 'approvable items carry their draft')
  const res = await call('POST', '/cs/admin/queue/decision', { token: 'tok-admin', body: { itemKey: item.key, decision: 'approve' } })
  assert.equal(res.statusCode, 200)
  assert.equal(parse(res).effects[0].outreach, 'delivery_disabled')
  const records = (await store.listAll()).filter((i) => i.type === 'OUT')
  assert.equal(records.length, 1)
  assert.equal(records[0].status, 'delivery_disabled')
  const messages = parse(await call('GET', '/cs/me/messages', { token: 'tok-at_risk' }))
  assert.equal(messages.messages.length, 0, 'player sees nothing while delivery is disabled')
})

test('a draft with [placeholder] text is refused and NO decision is recorded', async () => {
  const { call, store } = app()
  const item = await queueItem(call, 'negative_feedback')
  assert.match(item.draft.body, /\[Aaron adds/)
  const res = await call('POST', '/cs/admin/queue/decision', { token: 'tok-admin', body: { itemKey: item.key, decision: 'approve' } })
  assert.equal(res.statusCode, 400)
  assert.equal((await store.listAll()).some((i) => i.type === 'DEC'), false, 'refused approval leaves no decision behind')
  assert.ok(await queueItem(call, 'negative_feedback'), 'item stays in the queue')
  const edited = { subject: 'About your feedback', body: 'Thanks for the honest rating. Duo setups for Kafe are being written this week; I will send them to you first.' }
  const ok = await call('POST', '/cs/admin/queue/decision', { token: 'tok-admin', body: { itemKey: item.key, decision: 'approve', message: edited } })
  assert.equal(ok.statusCode, 200)
  const out = (await store.listAll()).find((i) => i.type === 'OUT')
  assert.equal(out.body, edited.body, 'the approved (edited) text is what gets recorded')
})

test('outreach run: dry run writes nothing; real runs are idempotent', async () => {
  const { call, store } = app()
  const before = (await store.listAll()).length
  const dry = parse(await call('POST', '/cs/admin/outreach/run', { token: 'tok-admin', body: { dryRun: true } }))
  assert.equal(dry.dryRun, true)
  assert.ok(dry.plan.length > 0)
  assert.equal((await store.listAll()).length, before, 'dry run is read-only')

  const first = parse(await call('POST', '/cs/admin/outreach/run', { token: 'tok-admin', body: { dryRun: false } }))
  const created = first.results.filter((r) => r.status)
  assert.ok(created.length > 0)
  assert.ok(created.every((r) => ['delivery_disabled', 'pending_approval'].includes(r.status)))
  const afterFirst = (await store.listAll()).filter((i) => i.type === 'OUT').length

  const second = parse(await call('POST', '/cs/admin/outreach/run', { token: 'tok-admin', body: { dryRun: false } }))
  assert.equal(second.results.filter((r) => r.status).length, 0, 'second run creates nothing new')
  assert.equal((await store.listAll()).filter((i) => i.type === 'OUT').length, afterFirst)
})

test('marketing needs explicit opt-in; the player can opt in and out', async () => {
  const { call } = app()
  const plan = parse(await call('POST', '/cs/admin/outreach/run', { token: 'tok-admin', body: { dryRun: true } })).plan
  const dormant = plan.find((p) => p.workflowId === 'dormant_reengage')
  assert.equal(dormant.eligible, false)
  assert.equal(dormant.blockedBy, 'no_marketing_consent')

  assert.equal((await call('PUT', '/cs/me/contact-preferences', { token: 'tok-dormant_free', body: { marketing: 'yes please' } })).statusCode, 400)
  const opted = parse(await call('PUT', '/cs/me/contact-preferences', { token: 'tok-dormant_free', body: { marketing: 'opted_in' } }))
  assert.equal(opted.marketing, 'opted_in')
  const after = parse(await call('POST', '/cs/admin/outreach/run', { token: 'tok-admin', body: { dryRun: true } })).plan.find((p) => p.workflowId === 'dormant_reengage')
  assert.equal(after.eligible, true)

  await call('PUT', '/cs/me/contact-preferences', { token: 'tok-dormant_free', body: { marketing: 'opted_out' } })
  const out = parse(await call('POST', '/cs/admin/outreach/run', { token: 'tok-admin', body: { dryRun: true } })).plan.find((p) => p.workflowId === 'dormant_reengage')
  assert.equal(out.blockedBy, 'opted_out')
})

test('do-not-contact blocks approvals and replies, and is audited', async () => {
  const { call, store } = app()
  const key = contactKeyFor('fading.roamer@example.test')
  const bad = await call('PUT', `/cs/admin/players/${key}/contact`, { token: 'tok-admin', body: { doNotContact: true, email: 'someone.else@example.test' } })
  assert.equal(bad.statusCode, 400, 'email must match the player key')
  const on = await call('PUT', `/cs/admin/players/${key}/contact`, { token: 'tok-admin', body: { doNotContact: true, email: 'fading.roamer@example.test', reason: 'Asked not to be contacted' } })
  assert.equal(on.statusCode, 200)
  const item = await queueItem(call, 'at_risk_checkin')
  assert.equal(item.approveBlockedBy, 'do_not_contact')
  const res = await call('POST', '/cs/admin/queue/decision', { token: 'tok-admin', body: { itemKey: item.key, decision: 'approve' } })
  assert.equal(res.statusCode, 409)
  assert.ok((await store.listAll()).some((i) => i.type === 'AUDIT' && i.action === 'contact.dnc_on'))
})

test('frequency caps count sends from the existing daily CRM job too', () => {
  const now = Date.parse('2026-09-25T12:00:00Z')
  const facts = buildFacts({
    now,
    identity: { email: 'quiet.anchor@example.test' },
    sources: {
      profile: { status: 'ok', data: { first_name: 'A', last_name: 'B', display_name: 'C', platform: 'pc', created_at: '2026-09-20T00:00:00Z' } },
      billing: { status: 'ok', data: [] },
      legacyCrm: { status: 'ok', data: { welcome_sent_at: '2026-09-24T12:00:00Z' } },
      cs: { status: 'ok', data: { messages: [], outreach: [], feedback: [], prompts: [], decisions: [], activity: [] } },
    },
  })
  const verdict = checkEligibility(WORKFLOW_BY_ID.activation_nudge, facts, { now, instance: 'n1' })
  assert.deepEqual(verdict, { ok: false, reason: 'frequency_cap_72h' })
  assert.equal(checkEligibility(WORKFLOW_BY_ID.welcome, facts, { now }).reason, 'owned_by_existing_crm_job')
})

test('open conversation: automated relationship messages wait while the player is talking to us', async () => {
  const { call } = app()
  const sent = await call('POST', '/cs/me/messages', { token: 'tok-free_activated', body: { body: 'Which site should I learn first on Bank?' } })
  assert.equal(sent.statusCode, 201)
  const now = Date.parse('2026-09-25T15:00:00.000Z')
  const facts = buildFacts({
    now,
    identity: { email: 'quiet.anchor@example.test' },
    sources: { cs: { status: 'ok', data: { messages: [{ direction: 'inbound', createdAt: new Date(now - 3600000).toISOString() }], outreach: [], feedback: [], prompts: [], decisions: [], activity: [] } } },
  })
  assert.equal(checkEligibility(WORKFLOW_BY_ID.activation_nudge, facts, { now, instance: 'n1' }).reason, 'open_conversation')
})

test('in_app delivery: player sees the reply; only the player can mark it read; admin viewing changes nothing for the player', async () => {
  const { call, store } = app({ deliveryMode: 'in_app' })
  const key = contactKeyFor('quiet.anchor@example.test')
  await call('POST', '/cs/me/messages', { token: 'tok-free_activated', body: { body: 'Is Bank CEO worth learning first?' } })

  const reply = await call('POST', `/cs/admin/conversations/${key}/reply`, { token: 'tok-admin', body: { body: 'Yes. Start with CEO defense: it teaches the stairs and the skylight.' } })
  assert.equal(reply.statusCode, 201)
  assert.equal(parse(reply).status, 'delivered')

  // Admin opens the thread and previews the player's home: player's unread stays 1.
  await call('GET', `/cs/admin/conversations/${key}`, { token: 'tok-admin' })
  await call('GET', `/cs/admin/players/${key}/home-preview`, { token: 'tok-admin' })
  let mine = parse(await call('GET', '/cs/me/messages', { token: 'tok-free_activated' }))
  assert.equal(mine.unread, 1)
  const outbound = (await store.listAll()).find((i) => i.type === 'MSG' && i.direction === 'outbound')
  assert.equal(outbound.readByPlayerAt, undefined, 'admin views never set the player read marker')
  const inbound = (await store.listAll()).find((i) => i.type === 'MSG' && i.direction === 'inbound')
  assert.ok(inbound.readByAdminAt && inbound.answeredAt)

  const home = parse(await call('GET', '/cs/me/home', { token: 'tok-free_activated' }))
  assert.equal(home.messages.unread, 1)
  await call('POST', '/cs/me/messages/read', { token: 'tok-free_activated' })
  mine = parse(await call('GET', '/cs/me/messages', { token: 'tok-free_activated' }))
  assert.equal(mine.unread, 0)
})

test('email replies from the CRM are recorded but never sent (no email transport exists)', async () => {
  const { call, store } = app({ deliveryMode: 'in_app' })
  const key = contactKeyFor('quiet.anchor@example.test')
  await call('POST', '/cs/me/messages', { token: 'tok-free_activated', body: { body: 'Hello?' } })
  const res = await call('POST', `/cs/admin/conversations/${key}/reply`, { token: 'tok-admin', body: { body: 'Hi there', channel: 'email' } })
  assert.equal(parse(res).status, 'delivery_disabled')
  assert.equal(parse(res).statusReason, 'email_not_enabled')
  const outbound = (await store.listAll()).find((i) => i.type === 'MSG' && i.direction === 'outbound')
  assert.equal(outbound.status, 'delivery_disabled')
})

test('player messages: STOP suppresses, rate limit applies, feature flag respected, admin-only routes protected', async () => {
  const { call } = app()
  const stop = parse(await call('POST', '/cs/me/messages', { token: 'tok-paying_active', body: { body: 'STOP sending me stuff' } }))
  assert.equal(stop.suppressed, true)
  const prefs = parse(await call('GET', '/cs/me/contact-preferences', { token: 'tok-paying_active' }))
  assert.equal(prefs.relationship, 'opted_out')
  assert.equal(prefs.marketing, 'opted_out')

  for (let i = 0; i < 9; i += 1) await call('POST', '/cs/me/messages', { token: 'tok-paying_active', body: { body: `question ${i}` } })
  assert.equal((await call('POST', '/cs/me/messages', { token: 'tok-paying_active', body: { body: 'one more' } })).statusCode, 429)

  const off = fixtureApp({ extraRoutes: routeModules, config: { features: { messaging: false } } })
  assert.equal((await off.call('GET', '/cs/me/messages', { token: 'tok-new' })).statusCode, 404)

  for (const [method, path] of [['GET', '/cs/admin/conversations'], ['GET', '/cs/admin/outreach'], ['POST', '/cs/admin/outreach/run']]) {
    assert.equal((await call(method, path, { token: 'tok-paying_active', body: {} })).statusCode, 403, path)
  }
})
