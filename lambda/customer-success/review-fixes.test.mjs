// Regression tests for the independent security/correctness review of the
// customer-success layer. One test (or group) per confirmed finding; all data
// is fictional (fixtures/world.mjs, *.test addresses).
import test from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from './app.mjs'
import { fixtureApp, FIXTURE_NOW as NOW } from './fixtures/app.mjs'
import { buildFixtureWorld } from './fixtures/world.mjs'
import { storeSeedFromWorld } from './fixtures/seed.mjs'
import { createMemoryTables } from './data/memoryTables.mjs'
import { createMemoryStore } from './data/memoryStore.mjs'
import { createDynamoStore, StoreLimitError } from './data/dynamoStore.mjs'
import { ITEM_TYPES, pkFor } from './data/items.mjs'
import { routeModules } from './routes/index.mjs'
import { playerVisible } from './routes/messages.mjs'
import { createCognitoAuthenticator } from './lib/auth.mjs'
import { contactKeyFor, reconPlayerIdFor } from './lib/ids.mjs'
import { resolveBilling } from './domain/plans.mjs'
import { buildFacts } from './domain/facts.mjs'
import { buildHomeView } from './domain/home.mjs'
import { deriveLifecycle } from './domain/lifecycle.mjs'
import { checkEligibility, evaluateOutreach, WORKFLOW_BY_ID, WORKFLOWS } from './domain/outreach.mjs'
import { ingestInboundEmail, parseInboundEmail, senderVerified } from './inbound.mjs'
import { buildLiteHomeView } from '../../src/features/home/liteHome.js'

const DAY = 86400000
const iso = (days) => new Date(NOW + days * DAY).toISOString()
const parse = (res) => JSON.parse(res.body)
const PRICE = { pro: 'price_1TLEtrJNddvjgWcg9iTWJoLS', elite: 'price_1TPtOYJNddvjgWcgfEWjzGnp', eliteLegacy: 'price_1TLEtsJNddvjgWcgYcmiNmW7' }
const PROFILE = { first_name: 'Test', last_name: 'Player', display_name: 'TestPlayer', platform: 'pc' }

const lite = (overrides) => buildLiteHomeView({
  user: { email: 'lite.player@example.test' },
  isAdmin: false,
  plan: 'free',
  profile: PROFILE,
  profileComplete: true,
  vodUsage: null,
  account: { sub_status: 'none', current_period_end: null, stripe_customer_id: null, tier_scope: 'single' },
  recents: [],
  climb: { status: 'ok', data: null },
  player: { status: 'not_connected', data: null },
  now: NOW,
  ...overrides,
})

// ---- H1: lite mode (account API) -------------------------------------------

test('H1 lite: a past-due member is not called "Basic" and the copy names no plan it cannot know', () => {
  const view = lite({ account: { sub_status: 'past_due', current_period_end: iso(28), stripe_customer_id: 'cus_LITE1', tier_scope: 'single' } })
  assert.equal(view.membership.status, 'payment_failed')
  assert.equal(view.membership.planLabel, 'Paid membership')
  assert.doesNotMatch(view.mission.body, /Basic/)
  assert.match(view.mission.body, /Your last payment didn't go through/)
})

test('H1 lite: an admin comp row is complimentary, not "Paid through 2099", and not a paying member', () => {
  const view = lite({ plan: 'pro', vodUsage: { used: 0, limit: 20, remaining: 20, is_trial: false }, account: { sub_status: 'active', current_period_end: '2099-12-31T23:59:59Z', stripe_customer_id: 'comp_lite_player_example_test', tier_scope: 'single' } })
  assert.equal(view.membership.status, 'comp')
  assert.equal(view.membership.statusLabel, 'Complimentary access')
  assert.equal(view.membership.canManageBilling, false)
})

test('H1 lite: production /me reports legacy $29/$39 prices as "elite", so no 1:1 coaching is promised', () => {
  const view = lite({ plan: 'elite', vodUsage: { used: 0, limit: 60, remaining: 60, is_trial: false }, account: { sub_status: 'active', current_period_end: iso(10), stripe_customer_id: 'cus_LITE2', tier_scope: 'single' } })
  assert.equal(view.membership.planLabel, 'Elite')
  assert.ok(!view.membership.features.some((f) => /1:1/.test(f)))
})

test('H1/M2 lite: Stripe says active but /me grants nothing (no paid-through date) -> renewal not confirmed, not "Free account"', () => {
  const view = lite({ account: { sub_status: 'active', current_period_end: null, stripe_customer_id: 'cus_LITE3', tier_scope: 'single' } })
  assert.equal(view.membership.status, 'renewal_unconfirmed')
  assert.equal(view.mission.id, 'confirm_renewal')
  assert.match(view.mission.body, /no paid-through date on record/)
})

// ---- M2 / M3 / L1 / L8: billing truth (webhook ledger) ----------------------

test('M2: a live Stripe row with no paid-through date is flagged (production blocks access; payer may be locked out)', () => {
  const rows = [{ stripe_customer_id: 'cus_NODATE', email: 'nodate@example.test', plan: 'champion', status: 'active', current_period_end: null, created_at: iso(-90), updated_at: iso(-5) }]
  const b = resolveBilling(rows, { now: NOW })
  assert.equal(b.hasAccess, false)
  assert.equal(b.status, 'renewal_unconfirmed')
  assert.equal(b.staleReason, 'missing_period_end')
  const facts = buildFacts({ now: NOW, identity: { email: 'nodate@example.test', signedIn: true }, sources: { account: { status: 'ok', data: { status: 'CONFIRMED', enabled: true } }, billing: { status: 'ok', data: rows } } })
  const risk = deriveLifecycle(facts, NOW).risks.find((r) => r.code === 'renewal_unconfirmed')
  assert.equal(risk?.severity, 'critical')
  assert.match(risk.evidence[0], /no paid-through date/)
})

test('M3: a paying customer who also has a comp row still counts as paying, with the paid plan and amount', () => {
  const rows = [
    { stripe_customer_id: 'cus_PAY', email: 'p@example.test', plan: 'pro', price_id: PRICE.pro, status: 'active', current_period_end: iso(20), updated_at: iso(-10) },
    { stripe_customer_id: 'comp_p_example_test', email: 'p@example.test', plan: 'pro', status: 'active', comp: true, current_period_end: '2099-12-31T23:59:59Z', updated_at: iso(-5) },
  ]
  const b = resolveBilling(rows, { now: NOW })
  assert.equal(b.status, 'comp', 'access follows production: the comp row wins the tie')
  assert.equal(b.isPaidMember, true)
  assert.equal(b.isPaying, true)
  assert.equal(b.paidPlan, 'pro')
  assert.equal(b.paidAmount, 12)
  assert.deepEqual({ plan: b.alsoPaying.plan, amount: b.alsoPaying.amount }, { plan: 'pro', amount: 12 })
})

test('M3 + L1 end to end: overview counts the comped payer under the paid plan and excludes card-up-front trials from paying/MRR', async () => {
  const base = fixtureApp({ extraRoutes: routeModules, config: { directoryCacheMs: 0 } })
  const before = parse(await base.call('GET', '/cs/admin/overview', { token: 'tok-admin' }))
  const { call } = fixtureApp({
    extraRoutes: routeModules,
    config: { directoryCacheMs: 0 },
    mutate(world) {
      world.subscriptions.push({ stripe_customer_id: 'comp_vertical_vex_example_test', email: 'vertical.vex@example.test', plan: 'champion', status: 'active', comp: true, current_period_end: '2099-12-31T23:59:59.000Z', created_at: iso(-3), updated_at: iso(-3) })
      world.subscriptions.push({ stripe_customer_id: 'cus_FIXTURETRIAL', email: 'quiet.anchor@example.test', plan: 'pro', price_id: PRICE.pro, status: 'trialing', current_period_end: iso(5), created_at: iso(-2), updated_at: iso(-2) })
    },
  })
  const after = parse(await call('GET', '/cs/admin/overview', { token: 'tok-admin' }))
  assert.equal(after.payingByPlan.elite, before.payingByPlan.elite, 'comped Elite payer is still a paying Elite member')
  assert.equal(after.payingByPlan.pro, before.payingByPlan.pro, 'a trial is not paying')
  assert.equal(after.ledgerMrr, before.ledgerMrr, 'MRR unchanged by a comp on top of a paid row, and trials add nothing')
  assert.equal(after.billing.stripeTrials, before.billing.stripeTrials + 1)
  assert.equal(after.billing.compAndPaying, 1)
  const queue = parse(await call('GET', '/cs/admin/queue', { token: 'tok-admin' }))
  assert.ok(queue.items.some((i) => i.type === 'comp_with_paid_subscription'))
  const home = parse(await call('GET', '/cs/me/home', { token: 'tok-paying_active' }))
  assert.equal(home.membership.alsoPaying.planLabel, 'Elite')
})

test('L8: a failed payment escalates from the estimated failure date, not the last retry', async () => {
  const b = resolveBilling([{ stripe_customer_id: 'cus_PD', email: 'pd@example.test', plan: 'pro', price_id: PRICE.pro, status: 'past_due', current_period_end: iso(20), updated_at: iso(-0.5) }], { now: NOW })
  assert.equal(b.paymentIssueSinceBasis, 'period_estimate')
  assert.equal(b.paymentIssueSince, iso(-10), 'monthly renewal ~10 days ago, though Stripe retried 12 hours ago')
  const quiet = fixtureApp({ extraRoutes: routeModules, config: { directoryCacheMs: 0 } })
  const q1 = parse(await quiet.call('GET', '/cs/admin/queue', { token: 'tok-admin' }))
  assert.ok(!q1.items.some((i) => i.type === 'payment_failed_persistent'), 'the fixture failed yesterday: still auto-handled')
  const old = fixtureApp({
    extraRoutes: routeModules,
    config: { directoryCacheMs: 0 },
    mutate(world) {
      const row = world.subscriptions.find((r) => r.email === 'card.declined@example.test')
      row.current_period_end = iso(20)
      row.updated_at = iso(-0.5)
    },
  })
  const q2 = parse(await old.call('GET', '/cs/admin/queue', { token: 'tok-admin' }))
  const item = q2.items.find((i) => i.type === 'payment_failed_persistent')
  assert.ok(item)
  assert.match(item.whatHappened, /since about/)
})

// ---- H2: identity ------------------------------------------------------------

test('H2: tokens whose email is not verified are refused', async () => {
  const make = (emailVerified) => createCognitoAuthenticator({ verifier: { async verify() { return { sub: 's1', email: 'Someone@Example.test', email_verified: emailVerified } } }, log: { warn() {} } })
  const req = { headers: { authorization: 'Bearer abc' } }
  assert.equal(await make(false)(req), null)
  assert.equal(await make(undefined)(req), null)
  assert.equal((await make(true)(req)).email, 'someone@example.test')
  assert.equal((await make('true')(req)).email, 'someone@example.test')
})

// ---- H3: bounded reads and writes, fail closed -------------------------------

test('H3: store reads fail closed instead of silently truncating after 40 pages', async () => {
  let page = 0
  const ddb = { async send() { page += 1; return { Items: [{ pk: `C#p${page}`, sk: 'ACT#x' }], LastEvaluatedKey: page < 60 ? { pk: 'k' } : undefined } } }
  await assert.rejects(() => createDynamoStore({ ddb, tableName: 't' }).listAll(), StoreLimitError)
})

test('H3: activity is one record per player, type and day, whatever the client sends', async () => {
  const { call, store, world } = fixtureApp()
  for (let i = 0; i < 25; i += 1) {
    const res = await call('POST', '/cs/me/activity', { token: 'tok-free_activated', body: { type: 'strat_viewed', ref: { mapId: `map-${i}`, siteId: `site-${i}`, side: 'attack' } } })
    assert.equal(res.statusCode, 202)
  }
  const key = contactKeyFor(world.scenarios.free_activated.email)
  const today = (await store.listContact(pkFor(key))).filter((i) => i.type === ITEM_TYPES.ACTIVITY && i.sk.startsWith(`ACT#${new Date(NOW).toISOString().slice(0, 10)}#`))
  assert.equal(today.length, 1)
  assert.equal(today[0].ref.mapId, 'map-24', 'the latest place wins')
})

test('H3: when contact state cannot be read, outreach is blocked for everyone (no default consent)', async () => {
  const world = buildFixtureWorld(NOW)
  const inner = createMemoryStore(storeSeedFromWorld(world))
  const store = { ...inner, async listAll() { throw new Error('throttled') } }
  const app = createApp({ tables: createMemoryTables(world), store, authenticate: async () => ({ email: 'coach.admin@example.test', sub: 'a', isAdmin: true }), clock: () => NOW, config: { features: { messaging: true, feedback: true }, directoryCacheMs: 0, deliveryMode: 'in_app' }, extraRoutes: routeModules, log: { warn() {}, error() {} } })
  const res = parse(await app({ rawPath: '/cs/admin/outreach/run', requestContext: { http: { method: 'POST' } }, headers: { authorization: 'Bearer x' }, body: JSON.stringify({ dryRun: false }) }))
  assert.equal(res.results.length, 0)
  assert.ok(res.blocked.length > 0)
  assert.ok(res.blocked.every((b) => b.blockedBy === 'contact_state_unavailable'))
})

test('H3: consent is re-read at send time; a do-not-contact set after evaluation suppresses delivery', async () => {
  const probe = fixtureApp({ extraRoutes: routeModules, config: { directoryCacheMs: 0, deliveryMode: 'in_app' } })
  const first = parse(await probe.call('POST', '/cs/admin/outreach/run', { token: 'tok-admin', body: { dryRun: true } }))
  const target = first.plan.find((p) => p.eligible)
  assert.ok(target, 'fixture has at least one eligible automatic message')

  const world = buildFixtureWorld(NOW)
  const inner = createMemoryStore(storeSeedFromWorld(world))
  const dnc = { pk: pkFor(target.player), sk: ITEM_TYPES.CONSENT, type: ITEM_TYPES.CONSENT, contactKey: target.player, doNotContact: true, relationship: 'opted_out', marketing: 'opted_out', version: 9 }
  // Stale snapshot: the directory scan does not see the new consent yet.
  const store = { ...inner, async get(pk, sk) { return pk === dnc.pk && sk === ITEM_TYPES.CONSENT ? dnc : inner.get(pk, sk) } }
  const app = createApp({ tables: createMemoryTables(world), store, authenticate: async () => ({ email: 'coach.admin@example.test', sub: 'a', isAdmin: true }), clock: () => NOW, config: { features: { messaging: true, feedback: true }, directoryCacheMs: 0, deliveryMode: 'in_app' }, extraRoutes: routeModules, log: { warn() {}, error() {} } })
  const run = parse(await app({ rawPath: '/cs/admin/outreach/run', requestContext: { http: { method: 'POST' } }, headers: { authorization: 'Bearer x' }, body: JSON.stringify({ dryRun: false }) }))
  const mine = run.results.filter((r) => r.player === target.player)
  assert.ok(mine.length > 0)
  assert.ok(mine.every((r) => r.status === 'suppressed' && r.statusReason === 'do_not_contact'))
})

// ---- M1 / L9: frequency caps --------------------------------------------------

test('M1: one run delivers at most one non-service message per player', async () => {
  const { call } = fixtureApp({
    extraRoutes: routeModules,
    config: { directoryCacheMs: 0, deliveryMode: 'in_app' },
    mutate(world) {
      world.subscriptions.find((r) => r.email === 'fading.roamer@example.test').vod_updated_at = iso(-2)
    },
  })
  const run = parse(await call('POST', '/cs/admin/outreach/run', { token: 'tok-admin', body: { dryRun: false } }))
  const perPlayer = new Map()
  for (const r of run.results) {
    if (WORKFLOW_BY_ID[r.workflowId].category === 'service' || !['delivered', 'delivery_disabled'].includes(r.status)) continue
    perPlayer.set(r.player, (perPlayer.get(r.player) || 0) + 1)
  }
  assert.ok([...perPlayer.values()].every((n) => n <= 1), JSON.stringify([...perPlayer]))
  assert.ok(run.blocked.some((b) => b.blockedBy === 'frequency_cap_72h'))
  const inbox = parse(await call('GET', '/cs/me/messages', { token: 'tok-at_risk' }))
  assert.ok(inbox.messages.filter((m) => m.direction === 'outbound').length <= 1)
})

test('L9: records made while delivery was off do not use up caps or one-shot workflows', () => {
  const world = buildFixtureWorld(NOW)
  const s = world.scenarios.at_risk
  const facts = buildFacts({ now: NOW, identity: { email: s.email, signedIn: true }, sources: { account: { status: 'ok', data: { status: 'CONFIRMED', enabled: true } }, cs: { status: 'ok', data: { consent: null, messages: [], feedback: [], prompts: [], decisions: [], activity: [], audit: [], outreach: [{ workflowId: 'unused_paid_features', instanceKey: 'old', status: 'delivery_disabled', category: 'relationship', createdAt: iso(-1), updatedAt: iso(-1) }] } } } })
  const verdict = checkEligibility(WORKFLOW_BY_ID.unused_paid_features, facts, { now: NOW, instance: 'new' })
  assert.equal(verdict.ok, true, verdict.reason)
})

// ---- M4: queue parity -----------------------------------------------------------

test('M4: desktop/live-coach activity is loaded for paying players, and every listed queue item can be decided', async () => {
  const { call } = fixtureApp({
    extraRoutes: routeModules,
    config: { directoryCacheMs: 0 },
    mutate(world) {
      world.playerEvents.push({ recon_player_id: reconPlayerIdFor('sub-fixture-0006'), event_key: `${iso(-3)}#coaching_session_completed`, event_type: 'coaching_session_completed', occurred_at: iso(-3) })
    },
  })
  const queue = parse(await call('GET', '/cs/admin/queue', { token: 'tok-admin' }))
  const atRiskKey = contactKeyFor('fading.roamer@example.test')
  assert.ok(!queue.items.some((i) => i.type === 'at_risk_checkin' && i.player.key === atRiskKey), 'active in the desktop app 3 days ago: not "gone quiet"')
  for (const item of queue.items) {
    const res = await call('POST', '/cs/admin/queue/decision', { token: 'tok-admin', body: { itemKey: item.key, decision: 'dismiss' } })
    assert.equal(res.statusCode, 200, `${item.key}: ${res.body}`)
  }
  assert.equal(parse(await call('GET', '/cs/admin/queue', { token: 'tok-admin' })).total, 0)
})

// ---- M5 / M6 / L4 / L5: conversations and consent ---------------------------------

test('M5: the admin do-not-contact reason is never returned to the player', async () => {
  const { call } = fixtureApp({ extraRoutes: routeModules, config: { directoryCacheMs: 0 } })
  const email = 'fading.roamer@example.test'
  const set = await call('PUT', `/cs/admin/players/${contactKeyFor(email)}/contact`, { token: 'tok-admin', body: { doNotContact: true, email, reason: 'Internal note: billing dispute' } })
  assert.equal(set.statusCode, 200)
  const mine = parse(await call('GET', '/cs/me/contact-preferences', { token: 'tok-at_risk' }))
  assert.equal(mine.doNotContact, true)
  assert.equal(mine.suppressedReason, undefined)
  assert.ok(!JSON.stringify(mine).includes('billing dispute'))
})

test('M6: a reply recorded while delivery is off does not mark the player message answered', async () => {
  for (const [mode, expectAnswered] of [['disabled', false], ['in_app', true]]) {
    const clock = { now: NOW }
    const { call } = fixtureApp({ extraRoutes: routeModules, clock: () => clock.now, config: { directoryCacheMs: 0, deliveryMode: mode } })
    assert.equal((await call('POST', '/cs/me/messages', { token: 'tok-free_activated', body: { body: 'How do I play Bank CEO?' } })).statusCode, 201)
    clock.now = NOW + 2 * DAY
    const key = contactKeyFor('quiet.anchor@example.test')
    const reply = parse(await call('POST', `/cs/admin/conversations/${key}/reply`, { token: 'tok-admin', body: { body: 'Start from the stairs.', clientId: `test-reply-${mode}` } }))
    assert.equal(reply.answered, expectAnswered, mode)
    const queue = parse(await call('GET', '/cs/admin/queue', { token: 'tok-admin' }))
    assert.equal(queue.items.some((i) => i.type === 'unanswered_message' && i.player.key === key), !expectAnswered, mode)
  }
})

test('L4: the same admin reply (same client id) is never sent twice', async () => {
  const { call } = fixtureApp({ extraRoutes: routeModules, config: { directoryCacheMs: 0, deliveryMode: 'in_app' } })
  await call('POST', '/cs/me/messages', { token: 'tok-free_activated', body: { body: 'Question about Clubhouse' } })
  const key = contactKeyFor('quiet.anchor@example.test')
  const body = { body: 'Answer', clientId: 'dup-check-0001' }
  assert.equal((await call('POST', `/cs/admin/conversations/${key}/reply`, { token: 'tok-admin', body })).statusCode, 201)
  assert.equal((await call('POST', `/cs/admin/conversations/${key}/reply`, { token: 'tok-admin', body })).statusCode, 409)
  const inbox = parse(await call('GET', '/cs/me/messages', { token: 'tok-free_activated' }))
  assert.equal(inbox.messages.filter((m) => m.direction === 'outbound').length, 1)
})

test('L4: review decisions and feedback resolution are conditional writes', async () => {
  const puts = []
  const ddb = { async send(cmd) { puts.push(cmd.input); return { Attributes: {} } } }
  await createDynamoStore({ ddb, tableName: 't' }).update('C#x', 'FB#1', { reviewDecision: { decision: 'approve' } }, { expect: { reviewDecision: null } })
  assert.match(puts[0].ConditionExpression, /attribute_exists\(pk\) AND attribute_not_exists\(#c0\)/)
  const mem = createMemoryStore([{ pk: 'C#x', sk: 'FB#1', reviewDecision: { decision: 'decline' } }])
  await assert.rejects(() => mem.update('C#x', 'FB#1', { reviewDecision: { decision: 'approve' } }, { expect: { reviewDecision: null } }), { name: 'ConditionalCheckFailedException' })
})

test('L5: a STOP message survives a concurrent consent write (retry on version conflict)', async () => {
  const world = buildFixtureWorld(NOW)
  const inner = createMemoryStore(storeSeedFromWorld(world))
  let conflicts = 1
  const store = {
    ...inner,
    async put(item, opts = {}) {
      if (item.type === ITEM_TYPES.CONSENT && opts.expectVersion !== undefined && conflicts > 0) {
        conflicts -= 1
        const err = new Error('version changed')
        err.name = 'ConditionalCheckFailedException'
        throw err
      }
      return inner.put(item, opts)
    },
  }
  const s = world.scenarios.free_activated
  const app = createApp({ tables: createMemoryTables(world), store, authenticate: async () => ({ email: s.email, sub: s.sub, isAdmin: false }), clock: () => NOW, config: { features: { messaging: true, feedback: true } }, extraRoutes: routeModules, log: { warn() {}, error() {} } })
  const res = await app({ rawPath: '/cs/me/messages', requestContext: { http: { method: 'POST' } }, headers: { authorization: 'Bearer x' }, body: JSON.stringify({ body: 'STOP' }) })
  assert.equal(res.statusCode, 201)
  const consent = await inner.get(pkFor(contactKeyFor(s.email)), ITEM_TYPES.CONSENT)
  assert.equal(consent.relationship, 'opted_out')
})

// ---- L3 / L7: outreach eligibility and approvals ---------------------------------

test('L3: suppression recorded by the existing CRM job blocks marketing (and everything non-service after a mirrored do-not-contact)', () => {
  const base = { now: NOW, identity: { email: 'x@example.test', signedIn: true }, sources: { account: { status: 'ok', data: { status: 'CONFIRMED', enabled: true } }, cs: { status: 'ok', data: {} } } }
  const marketing = WORKFLOWS.find((w) => w.category === 'marketing' && w.trigger)
  const relationship = WORKFLOW_BY_ID.unused_paid_features
  const suppressed = buildFacts({ ...base, sources: { ...base.sources, legacyCrm: { status: 'ok', data: { email: 'x@example.test', marketing_suppressed_at: iso(-30), marketing_suppressed_reason: 'unsubscribed' } } } })
  assert.equal(checkEligibility(marketing, { ...suppressed, cs: { ...suppressed.cs, consent: { marketing: 'opted_in' } } }, { now: NOW }).reason, 'suppressed_in_existing_crm')
  const dnc = buildFacts({ ...base, sources: { ...base.sources, legacyCrm: { status: 'ok', data: { email: 'x@example.test', marketing_suppressed_at: iso(-30), marketing_suppressed_reason: 'do_not_contact' } } } })
  assert.equal(checkEligibility(relationship, dnc, { now: NOW }).reason, 'do_not_contact')
})

test('L7: approval-required workflows never run automatically; the coaching recap is approved from the queue', async () => {
  for (const w of WORKFLOWS) {
    if (w.approval === 'required') assert.ok(!w.trigger || w.fromQueue, `${w.id} would create records nothing can approve`)
  }
  const world = buildFixtureWorld(NOW)
  const s = world.scenarios.at_risk
  const facts = buildFacts({ now: NOW, identity: { email: s.email, signedIn: true }, sources: { account: { status: 'ok', data: { status: 'CONFIRMED', enabled: true } } } })
  assert.ok(!evaluateOutreach(facts, deriveLifecycle(facts, NOW), { now: NOW }).some((c) => c.approval === 'required'))

  const { call } = fixtureApp({
    extraRoutes: routeModules,
    config: { directoryCacheMs: 0 },
    mutate(w) {
      w.bookings.push({ slotId: iso(-1).replace(/\.\d{3}Z$/, '.000Z'), status: 'completed', customer: { email: 'fading.roamer@example.test', name: 'Jordan' }, coachingType: 'single', payment: { status: 'credit' } })
    },
  })
  const queue = parse(await call('GET', '/cs/admin/queue', { token: 'tok-admin' }))
  const recap = queue.items.find((i) => i.type === 'coaching_followup')
  assert.ok(recap, 'recap appears in the queue')
  const unedited = await call('POST', '/cs/admin/queue/decision', { token: 'tok-admin', body: { itemKey: recap.key, decision: 'approve' } })
  assert.equal(unedited.statusCode, 400, 'the placeholder must be replaced before approval')
  const edited = await call('POST', '/cs/admin/queue/decision', { token: 'tok-admin', body: { itemKey: recap.key, decision: 'approve', message: { subject: 'Your session recap', body: 'Hey Jordan, drill the Bank basement retake timing before next session.' } } })
  assert.equal(edited.statusCode, 200, edited.body)
  assert.equal(parse(edited).effects[0].outreach, 'delivery_disabled')
})

// ---- L2: inbound email hardening --------------------------------------------------

test('L2: malformed or future Date headers fall back to the receipt time; no throw', async () => {
  const store = createMemoryStore()
  const bad = await ingestInboundEmail({ raw: 'From: a@example.test\r\nDate: not a date\r\nMessage-ID: <d1@x>\r\n\r\nhello\r\n', store, now: NOW })
  assert.equal(bad.ok, true)
  const future = await ingestInboundEmail({ raw: 'From: b@example.test\r\nDate: Tue, 01 Jan 2036 00:00:00 +0000\r\nMessage-ID: <d2@x>\r\n\r\nhello\r\n', store, now: NOW })
  assert.equal(future.ok, true)
  const msg = (await store.listAll()).find((i) => i.email === 'b@example.test')
  assert.equal(msg.createdAt, new Date(NOW).toISOString())
})

test('L2: From parsing is linear on hostile input', () => {
  const raw = `From: ${'<'.repeat(200000)}\r\nSubject: x\r\n\r\nhello\r\n`
  const t = process.hrtime.bigint()
  parseInboundEmail(raw)
  assert.ok(Number(process.hrtime.bigint() - t) / 1e6 < 250)
})

test('L2: unauthenticated senders are kept for admins but never shown as the player, and STOP only turns marketing off', async () => {
  assert.equal(senderVerified(null), false)
  assert.equal(senderVerified({ dmarc: 'PASS' }), true)
  assert.equal(senderVerified({ spf: 'PASS', dkim: 'PASS', dmarc: 'FAIL' }), false)
  const store = createMemoryStore()
  const res = await ingestInboundEmail({ raw: 'From: victim@example.test\r\nMessage-ID: <sp1@evil>\r\n\r\nSTOP\r\n', store, now: NOW })
  assert.equal(res.senderVerified, false)
  assert.equal(res.suppressedScope, 'marketing')
  const items = await store.listAll()
  const consent = items.find((i) => i.type === ITEM_TYPES.CONSENT)
  assert.equal(consent.marketing, 'opted_out')
  assert.notEqual(consent.relationship, 'opted_out')
  const msg = items.find((i) => i.type === ITEM_TYPES.MESSAGE)
  assert.equal(playerVisible(msg), false)
})

// ---- L6: legacy mixed-case logins -----------------------------------------------------

test('L6: a paying member whose login has a mixed-case email is not reported as "no site login"', async () => {
  const { call } = fixtureApp({
    extraRoutes: routeModules,
    config: { directoryCacheMs: 0 },
    mutate(world) {
      const user = world.cognitoUsers.find((u) => u.email === 'vertical.vex@example.test')
      user.email = 'Vertical.Vex@Example.test'
    },
  })
  const record = parse(await call('GET', `/cs/admin/players/${contactKeyFor('vertical.vex@example.test')}`, { token: 'tok-admin' }))
  const codes = (record.lifecycle?.risks || record.risks || []).map((r) => r.code)
  assert.ok(!codes.includes('paid_no_account'), JSON.stringify(codes))
})

// ---- home stays honest about a comped payer ---------------------------------------

test('home: complimentary access with a live paid subscription says so', () => {
  const rows = [
    { stripe_customer_id: 'cus_PAY2', email: 'q@example.test', plan: 'elite', price_id: PRICE.elite, status: 'active', current_period_end: iso(20), updated_at: iso(-10) },
    { stripe_customer_id: 'comp_q_example_test', email: 'q@example.test', plan: 'champion', status: 'active', comp: true, current_period_end: '2099-12-31T23:59:59Z', updated_at: iso(-5) },
  ]
  const facts = buildFacts({ now: NOW, identity: { email: 'q@example.test', signedIn: true }, sources: { account: { status: 'ok', data: { status: 'CONFIRMED', enabled: true } }, billing: { status: 'ok', data: rows } } })
  const view = buildHomeView(facts)
  assert.equal(view.membership.status, 'comp')
  assert.deepEqual(view.membership.alsoPaying, { planLabel: 'Elite', amount: 39, interval: 'month' })
})
