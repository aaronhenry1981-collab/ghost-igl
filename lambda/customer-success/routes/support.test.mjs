import test from 'node:test'
import assert from 'node:assert/strict'
import { defaultConfig } from '../app.mjs'
import { contactKeyFor } from '../lib/ids.mjs'
import { COPILOT_MARKER, FAKE_STRIPE, PLAYERS, STAFF, STAFF_ONLY_MARKER, stubEngines, supportApp } from '../support/fixtures/world.mjs'

const DAY = 86400000
let seq = 0
const rid = () => `route-req-${String((seq += 1)).padStart(6, '0')}`

function seeded(app, status, owner = null) {
  const [category, v] = Object.entries(app.support.caseByCategory).find(([, x]) => x.status === status && (!owner || x.owner === owner))
  return { category, ...v }
}
const create = (app, who, text, extra = {}) => app.call('POST', '/cs/me/support/cases', { who, body: { text, clientRequestId: rid(), ...extra } })

// Every staff route with a representative body.
function adminRoutes(caseNumber) {
  return [
    ['GET', '/cs/admin/support/queue'],
    ['GET', '/cs/admin/support/queue?view=critical'],
    ['GET', `/cs/admin/support/cases/${caseNumber}`],
    ['POST', `/cs/admin/support/cases/${caseNumber}/messages`, { text: 'hi' }],
    ['POST', `/cs/admin/support/cases/${caseNumber}/notes`, { text: 'note' }],
    ['POST', `/cs/admin/support/cases/${caseNumber}/status`, { status: 'triaged' }],
    ['POST', `/cs/admin/support/cases/${caseNumber}/assign`, { assignee: 'me' }],
    ['POST', `/cs/admin/support/cases/${caseNumber}/escalate`, { team: 'billing', reason: 'x' }],
    ['POST', `/cs/admin/support/cases/${caseNumber}/link-incident`, { incidentId: 'inc_fixture0001' }],
    ['POST', `/cs/admin/support/cases/${caseNumber}/resolve`, { summary: 'x', code: 'answered' }],
    ['POST', `/cs/admin/support/cases/${caseNumber}/action-requests`, { kind: 'data_export', reason: 'x' }],
    ['POST', `/cs/admin/support/cases/${caseNumber}/action-requests/ar_00000000f1f1f1f1/decision`, { decision: 'authorize' }],
    ['GET', '/cs/admin/support/incidents'],
    ['POST', '/cs/admin/support/incidents', { title: 'x', service: 'auth' }],
    ['GET', '/cs/admin/support/incidents/inc_fixture0001'],
    ['PATCH', '/cs/admin/support/incidents/inc_fixture0001', { status: 'identified' }],
    ['PUT', '/cs/admin/support/incidents/inc_fixture0001', { status: 'identified' }],
    ['POST', '/cs/admin/support/incidents/inc_fixture0001/timeline', { text: 'x' }],
    ['GET', '/cs/admin/support/metrics'],
    ['GET', '/cs/admin/support/email/unmatched'],
    ['POST', '/cs/admin/support/email/unmatched/um_0000000000000000/assign', { caseNumber }],
    ['GET', '/cs/admin/support/kb/proposals'],
    ['POST', '/cs/admin/support/kb/proposals/kbp_0000000000000000/decision', { decision: 'reject' }],
    ['POST', '/cs/admin/support/proactive/run'],
  ]
}
const PLAYER_ROUTES = (cn) => [
  ['POST', '/cs/me/support/triage', { text: 'help me' }],
  ['POST', '/cs/me/support/cases', { text: 'help me', clientRequestId: 'flag-off-0001' }],
  ['GET', '/cs/me/support/cases'],
  ['GET', `/cs/me/support/cases/${cn}`],
  ['POST', `/cs/me/support/cases/${cn}/messages`, { text: 'x', clientRequestId: 'flag-off-0002' }],
  ['POST', `/cs/me/support/cases/${cn}/attachments`, { name: 'a.png', mime: 'image/png', size: 10 }],
  ['POST', `/cs/me/support/cases/${cn}/resolve-confirm`],
  ['POST', `/cs/me/support/cases/${cn}/reopen`, {}],
  ['POST', `/cs/me/support/cases/${cn}/csat`, { rating: 5 }],
  ['GET', '/cs/help/articles?q=password'],
  ['GET', '/cs/help/articles/reset-password'],
]

// ---- flag, config ------------------------------------------------------------------------

test('config defaults: support flag and every support switch are off', () => {
  const c = defaultConfig()
  assert.equal(c.features.support, false)
  assert.deepEqual(c.support, { attachments: false, proactive: false, copilotModel: false, emailTokenSecret: null }, 'no plus-address secret by default')
  assert.deepEqual(defaultConfig({ support: { attachments: true } }).support, { attachments: true, proactive: false, copilotModel: false, emailTokenSecret: null })
})

test('flag off: every support route is a 404, even for admins, and nothing is written', async () => {
  const app = supportApp({ supportFlag: false })
  const before = JSON.stringify(await app.store.listAll())
  for (const [method, path, body] of [...adminRoutes('R6-000001'), ...PLAYER_ROUTES('R6-000001')]) {
    for (const who of [undefined, 'a', 'admin']) {
      assert.equal((await app.call(method, path, { who, body })).statusCode, 404, `${who}: ${method} ${path}`)
    }
  }
  assert.equal(JSON.stringify(await app.store.listAll()), before)
})

// ---- authorization -----------------------------------------------------------------------

test('staff routes: anonymous 401, players 403 on every one', async () => {
  const app = supportApp()
  for (const [method, path, body] of adminRoutes('R6-000001')) {
    assert.equal((await app.call(method, path, { body })).statusCode, 401, `anon ${method} ${path}`)
    assert.equal((await app.call(method, path, { who: 'a', body })).statusCode, 403, `player ${method} ${path}`)
  }
  for (const [method, path, body] of PLAYER_ROUTES('R6-000001').filter(([, p]) => !p.startsWith('/cs/help'))) {
    assert.equal((await app.call(method, path, { body })).statusCode, 401, `anon ${method} ${path}`)
  }
})

test('staff role matrix: lead-only and billing-only routes refuse lower roles', async () => {
  const app = supportApp()
  const cn = seeded(app, 'in_progress').caseNumber
  const expect403 = {
    agent: [
      ['GET', '/cs/admin/support/metrics'],
      ['POST', '/cs/admin/support/incidents', { title: 'x', service: 'auth' }],
      ['PATCH', '/cs/admin/support/incidents/inc_fixture0001', { status: 'identified' }],
      ['POST', '/cs/admin/support/incidents/inc_fixture0001/timeline', { text: 'x' }],
      ['POST', '/cs/admin/support/kb/proposals/kbp_0000000000000000/decision', { decision: 'reject' }],
      ['POST', '/cs/admin/support/proactive/run'],
      ['POST', `/cs/admin/support/cases/${cn}/action-requests`, { kind: 'refund', reason: 'x' }],
      ['POST', `/cs/admin/support/cases/${cn}/action-requests/ar_00000000f1f1f1f1/decision`, { decision: 'authorize' }],
    ],
    engineering: [['POST', `/cs/admin/support/cases/${cn}/action-requests`, { kind: 'cancellation', reason: 'x' }], ['GET', '/cs/admin/support/metrics']],
    billing: [['POST', `/cs/admin/support/cases/${cn}/action-requests/ar_00000000f1f1f1f1/decision`, { decision: 'authorize' }], ['POST', '/cs/admin/support/proactive/run']],
  }
  for (const [who, routes] of Object.entries(expect403)) {
    for (const [method, path, body] of routes) assert.equal((await app.call(method, path, { who, body })).statusCode, 403, `${who}: ${method} ${path}`)
  }
  for (const who of ['lead', 'admin']) {
    assert.equal((await app.call('GET', '/cs/admin/support/metrics', { who })).statusCode, 200, who)
  }
  for (const who of ['agent', 'billing', 'engineering', 'lead', 'admin']) {
    assert.equal((await app.call('GET', '/cs/admin/support/queue', { who })).statusCode, 200, who)
  }
})

test('ownership: another player\'s case is a 404 identical to a missing one, on every player route', async () => {
  const app = supportApp()
  const theirs = seeded(app, 'resolved')
  const intruder = Object.keys(PLAYERS).find((k) => k !== theirs.owner)
  const missing = await app.call('GET', '/cs/me/support/cases/R6-999999', { who: intruder })
  assert.equal(missing.statusCode, 404)
  const before = JSON.stringify(await app.store.listAll())
  for (const [method, path, body] of PLAYER_ROUTES(theirs.caseNumber).filter(([, p]) => p.includes(theirs.caseNumber))) {
    const res = await app.call(method, path, { who: intruder, body })
    assert.equal(res.statusCode, 404, `${method} ${path}`)
    assert.deepEqual(res.json, missing.json, 'no hint that the case exists')
  }
  assert.equal(JSON.stringify(await app.store.listAll()), before, 'nothing written for the intruder')
  assert.equal((await app.call('GET', `/cs/me/support/cases/${theirs.caseNumber}`, { who: theirs.owner })).statusCode, 200, 'the owner can read it')
  assert.equal((await app.call('GET', '/cs/me/support/cases/r6-1', { who: intruder })).statusCode, 400, 'case-number format is validated')
  // Nobody can name a partition: unknown fields are refused.
  assert.equal((await create(app, intruder, 'help', { contactKey: contactKeyFor(PLAYERS[theirs.owner].email) })).statusCode, 400)
  assert.equal((await create(app, intruder, 'help', { email: PLAYERS[theirs.owner].email })).statusCode, 400)
  const list = (await app.call('GET', '/cs/me/support/cases', { who: intruder })).json
  const numbers = Object.values(list.buckets).flat().map((c) => c.caseNumber)
  assert.ok(!numbers.includes(theirs.caseNumber))
})

// ---- creation ----------------------------------------------------------------------------------

test('create: idempotent on clientRequestId, classified by the engine, initial status new', async () => {
  const app = supportApp()
  const body = { text: 'I was charged twice this month', clientRequestId: 'same-request-01' }
  const first = await app.call('POST', '/cs/me/support/cases', { who: 'b', body })
  assert.equal(first.statusCode, 201)
  const again = await app.call('POST', '/cs/me/support/cases', { who: 'b', body })
  assert.equal(again.statusCode, 200)
  assert.equal(again.json.replayed, true)
  assert.equal(again.json.case.caseNumber, first.json.case.caseNumber)
  const mine = (await app.store.listAll()).filter((i) => i.type === 'CASE' && i.contactKey === contactKeyFor(PLAYERS.b.email) && i.createdAt === new Date(app.clockRef.now).toISOString())
  assert.equal(mine.length, 1, 'one case for two submissions')
  assert.equal(first.json.case.category, 'billing_question')
  assert.equal(first.json.case.status, 'new')
  assert.match(first.json.case.caseNumber, /^R6-\d{6}$/)
  const stored = mine[0]
  assert.equal(stored.priority, 'p2', 'routing from category defaults when categoryInfo has none')
  assert.ok(stored.sla.firstResponseDueAt, 'internal SLA recorded')
  assert.equal(app.engineCalls.classifyIssue.at(-1).opts.signals.signedIn, true, 'diagnostic signals feed the classifier')
  // A player-chosen category wins over the classifier; bad input is refused.
  assert.equal((await create(app, 'b', 'something else', { category: 'coaching_session' })).json.case.category, 'coaching_session')
  for (const bad of [
    { text: 'x'.repeat(10), clientRequestId: 'short' },
    { text: 'no id here' },
    { text: 'bad cat', category: 'refunds', clientRequestId: rid() },
    { text: 'bad ctx', context: { platform: 'switch' }, clientRequestId: rid() },
    { text: 'bad ctx', context: { cookie: 'x' }, clientRequestId: rid() },
    { text: 'x'.repeat(4001), clientRequestId: rid() },
    { text: '  ', clientRequestId: rid() },
    { text: 'answers', answers: { 'Bad Key': 'x' }, clientRequestId: rid() },
  ]) {
    const res = await app.call('POST', '/cs/me/support/cases', { who: 'b', body: bad })
    assert.ok([400, 413].includes(res.statusCode), `${JSON.stringify(bad).slice(0, 60)} -> ${res.statusCode}`)
  }
})

test('create: secrets and card numbers are redacted BEFORE storage and before the classifier sees them', async () => {
  const app = supportApp()
  const card = '4242 4242 4242 4242'
  const key = `sk_live_${'FAKEFAKE'.repeat(3)}`
  const res = await create(app, 'a', `Refund please, card ${card}, my password: Fixture!Pass9 and ${key}`, { answers: { card_used: '4242424242424242' } })
  assert.equal(res.statusCode, 201)
  const all = JSON.stringify(await app.store.listAll())
  for (const secret of [card, '4242424242424242', 'Fixture!Pass9', key]) assert.ok(!all.includes(secret), `not stored: ${secret}`)
  assert.ok(!JSON.stringify(app.engineCalls.classifyIssue).includes('4242'), 'the classifier never sees the card')
  const stored = (await app.store.listAll()).find((i) => i.type === 'CASE' && i.caseNumber === res.json.case.caseNumber)
  assert.deepEqual([...new Set(stored.redactions.map((r) => r.kind))].sort(), ['card_number', 'password', 'stripe_secret'])
})

test('rate limits: 5 new cases and 30 messages per rolling day, counted from stored items', async () => {
  const app = supportApp({ seedCases: false })
  for (let i = 0; i < 5; i += 1) assert.equal((await create(app, 'c', `case number ${i}`)).statusCode, 201)
  const sixth = await create(app, 'c', 'one too many')
  assert.equal(sixth.statusCode, 429)
  assert.equal((await create(app, 'a', 'another player is unaffected')).statusCode, 201)
  app.clockRef.now += DAY + 1000
  const later = await create(app, 'c', 'next day is fine')
  assert.equal(later.statusCode, 201)
  const cn = later.json.case.caseNumber
  for (let i = 0; i < 29; i += 1) assert.equal((await app.call('POST', `/cs/me/support/cases/${cn}/messages`, { who: 'c', body: { text: `m${i}`, clientRequestId: rid() } })).statusCode, 201, `message ${i}`)
  // 29 messages + the opening message = 30 today.
  assert.equal((await app.call('POST', `/cs/me/support/cases/${cn}/messages`, { who: 'c', body: { text: 'too many', clientRequestId: rid() } })).statusCode, 429)
})

// ---- messages, notes, projections ---------------------------------------------------------

test('messages: waiting_on_player -> in_progress; idempotent on clientRequestId; other statuses unchanged', async () => {
  const app = supportApp()
  const w = seeded(app, 'waiting_on_player')
  const body = { text: 'Here is the info', clientRequestId: 'msg-idem-000001' }
  const res = await app.call('POST', `/cs/me/support/cases/${w.caseNumber}/messages`, { who: w.owner, body })
  assert.equal(res.statusCode, 201)
  assert.equal(res.json.status, 'in_progress')
  const again = await app.call('POST', `/cs/me/support/cases/${w.caseNumber}/messages`, { who: w.owner, body })
  assert.equal(again.json.replayed, true)
  const view = (await app.call('GET', `/cs/me/support/cases/${w.caseNumber}`, { who: w.owner })).json
  assert.equal(view.bucket, 'waiting_on_recon')
  assert.equal(view.timeline.filter((e) => e.body === 'Here is the info').length, 1)
  assert.ok(view.timeline.some((e) => e.kind === 'status_change' && e.status === 'in_progress'))
  const t = seeded(app, 'triaged')
  const r2 = await app.call('POST', `/cs/me/support/cases/${t.caseNumber}/messages`, { who: t.owner, body: { text: 'bump', clientRequestId: rid() } })
  assert.equal(r2.json.status, 'triaged')
})

test('player projection never contains private notes, staff events, assignee, team, SLA, copilot, staff diagnostics, action requests, learning or billing refs', async () => {
  const app = supportApp()
  const created = await create(app, 'd', 'Paid but locked out of pro features', { category: 'access_entitlement' })
  const cn = created.json.case.caseNumber
  await app.call('POST', `/cs/admin/support/cases/${cn}/notes`, { who: 'agent', body: { text: 'PRIVATE_NOTE_MARKER suspect webhook' } })
  await app.call('POST', `/cs/admin/support/cases/${cn}/assign`, { who: 'agent', body: { assignee: 'me', team: 'billing' } })
  await app.call('GET', `/cs/admin/support/cases/${cn}`, { who: 'agent' })
  await app.call('POST', `/cs/admin/support/cases/${cn}/action-requests`, { who: 'billing', body: { kind: 'entitlement_repair', reason: 'ACTION_REASON_MARKER' } })
  await app.call('POST', `/cs/admin/support/cases/${cn}/escalate`, { who: 'agent', body: { team: 'billing', reason: 'ESCALATION_MARKER' } })
  await app.call('POST', `/cs/admin/support/cases/${cn}/resolve`, { who: 'agent', body: { summary: 'Access restored', code: 'external_action', learning: { productArea: 'checkout', avoidable: true } } })
  const view = await app.call('GET', `/cs/me/support/cases/${cn}`, { who: 'd' })
  assert.equal(view.statusCode, 200)
  const text = JSON.stringify(view.json)
  for (const marker of ['PRIVATE_NOTE_MARKER', 'ACTION_REASON_MARKER', 'ESCALATION_MARKER', STAFF_ONLY_MARKER, COPILOT_MARKER, 'LEAKED_RECON_ACTION', 'LEAKED_CONTEXT', FAKE_STRIPE.customer, 'cus_', STAFF.agent.email, STAFF.billing.email, 'checkout', 'firstResponseDueAt']) {
    assert.ok(!text.includes(marker), `player view leaks ${marker}`)
  }
  for (const key of ['assignee', 'team', 'sla', 'copilot', 'escalation', 'learning', 'refs', 'actionRequests', 'priority', 'severity', 'rootCause', 'email', 'contactKey']) {
    assert.ok(!(key in view.json), `player view has ${key}`)
  }
  assert.deepEqual(view.json.resolution, { summary: 'Access restored', at: view.json.resolvedAt })
  assert.ok(view.json.timeline.every((e) => ['you', 'Recon 6', 'Recon 6 support'].includes(e.author)))
  assert.ok(view.json.diagnostics.panels.every((p) => !('context' in p) && !('recon' in p.actions)))
  assert.ok(view.json.diagnostics.panels[0].facts.every((f) => f.label !== 'Stripe customer'), 'a non-player fact from the engine is dropped')
  // The seeded private notes are equally invisible on every own case.
  for (const who of ['a', 'b', 'c']) {
    const list = (await app.call('GET', '/cs/me/support/cases', { who })).json
    for (const c of Object.values(list.buckets).flat()) {
      const one = await app.call('GET', `/cs/me/support/cases/${c.caseNumber}`, { who })
      assert.ok(!one.body.includes('PRIVATE_FIXTURE_NOTE'), `${who} ${c.caseNumber}`)
    }
  }
})

test('billing references: full for billing/lead/admin, masked for agent/engineering, absent for the player', async () => {
  const app = supportApp()
  const cn = (await create(app, 'd', 'Paid but locked out', { category: 'access_entitlement' })).json.case.caseNumber
  const full = { billing: true, lead: true, admin: true, agent: false, engineering: false }
  for (const [who, sees] of Object.entries(full)) {
    const res = await app.call('GET', `/cs/admin/support/cases/${cn}`, { who })
    assert.equal(res.statusCode, 200, who)
    assert.equal(res.body.includes(FAKE_STRIPE.customer), sees, `${who} full customer id`)
    assert.equal(res.body.includes(FAKE_STRIPE.subscription), sees, `${who} full subscription id`)
    if (!sees) assert.equal(res.json.case.refs.subscription.stripeCustomerId, `cus_…${FAKE_STRIPE.customer.slice(-4)}`)
    assert.equal(res.json.permissions['billing.refs.full'], sees)
  }
  const mine = await app.call('GET', `/cs/me/support/cases/${cn}`, { who: 'd' })
  assert.ok(!mine.body.includes('cus_') && !mine.body.includes('sub_FIXTURE'))
})

test('attachments: disabled path writes nothing; enabled path validates the allowlist and sizes and stores a manifest only', async () => {
  const off = supportApp()
  const w = seeded(off, 'in_progress')
  const before = JSON.stringify(await off.store.listAll())
  const disabled = await off.call('POST', `/cs/me/support/cases/${w.caseNumber}/attachments`, { who: w.owner, body: { name: 'clip.mp4', mime: 'video/mp4', size: 1000 } })
  assert.deepEqual([disabled.statusCode, disabled.json], [200, { status: 'upload_disabled' }])
  assert.equal(JSON.stringify(await off.store.listAll()), before)

  const on = supportApp({ config: { support: { attachments: true } } })
  const path = `/cs/me/support/cases/${w.caseNumber}/attachments`
  const cases = [
    [{ name: 'shot.png', mime: 'image/png', size: 10 * 1024 * 1024 }, 200],
    [{ name: 'shot.png', mime: 'image/png', size: 10 * 1024 * 1024 + 1 }, 413],
    [{ name: 'clip.mp4', mime: 'video/mp4', size: 25 * 1024 * 1024 }, 200],
    [{ name: 'clip.mp4', mime: 'video/mp4', size: 25 * 1024 * 1024 + 1 }, 413],
    [{ name: 'log.txt', mime: 'text/plain', size: 100 }, 200],
    [{ name: 'a.jpg', mime: 'image/jpeg', size: 100 }, 200],
    [{ name: 'a.webp', mime: 'image/webp', size: 100 }, 200],
    [{ name: 'logs.zip', mime: 'application/zip', size: 100 }, 200],
    [{ name: 'a.gif', mime: 'image/gif', size: 100 }, 400],
    [{ name: 'setup.exe', mime: 'application/x-msdownload', size: 100 }, 400],
    [{ name: 'page.html', mime: 'text/html', size: 100 }, 400],
    [{ name: 'x.png', mime: 'image/png', size: 0 }, 400],
    [{ name: '../../etc/passwd', mime: 'text/plain', size: 10 }, 400],
    [{ name: 'x.png', mime: 'image/png', size: 10, url: 'http://example.com' }, 400],
  ]
  for (const [body, status] of cases) assert.equal((await on.call('POST', path, { who: w.owner, body })).statusCode, status, JSON.stringify(body))
  const manifests = (await on.store.listAll()).filter((i) => i.type === 'ATT')
  assert.equal(manifests.length, 6)
  assert.ok(manifests.every((m) => m.scanState === 'not_uploaded' && !('bytes' in m) && !('data' in m)))
  const other = Object.keys(PLAYERS).find((k) => k !== w.owner)
  assert.equal((await on.call('POST', path, { who: other, body: { name: 'x.png', mime: 'image/png', size: 10 } })).statusCode, 404)
})

// ---- staff workflow -------------------------------------------------------------------------

test('staff status changes follow the table: allowed 200, refused 409, resolve/escalate need their own routes', async () => {
  const app = supportApp({ seedCases: false })
  const cn = (await create(app, 'a', 'Something is broken')).json.case.caseNumber
  const set = (status) => app.call('POST', `/cs/admin/support/cases/${cn}/status`, { who: 'agent', body: { status } })
  assert.equal((await set('closed')).statusCode, 409, 'new -> closed refused')
  assert.equal((await set('waiting_on_player')).statusCode, 409, 'new -> waiting refused')
  assert.equal((await set('resolved')).statusCode, 400)
  assert.equal((await set('escalated')).statusCode, 400)
  assert.equal((await set('bogus')).statusCode, 400)
  assert.equal((await set('triaged')).statusCode, 200)
  assert.equal((await set('waiting_on_player')).statusCode, 200)
  assert.equal((await set('waiting_on_provider')).statusCode, 409)
  assert.equal((await set('in_progress')).statusCode, 200)
  const reply = await app.call('POST', `/cs/admin/support/cases/${cn}/messages`, { who: 'agent', body: { text: 'Can you send a screenshot?', thenStatus: 'waiting_on_player' } })
  assert.equal(reply.json.status, 'waiting_on_player')
  assert.equal(reply.json.delivery, 'case_timeline_only', 'nothing is emailed')
  const res = await app.call('POST', `/cs/admin/support/cases/${cn}/resolve`, { who: 'agent', body: { summary: 'Fixed', code: 'nope' } })
  assert.equal(res.statusCode, 400)
  assert.equal((await app.call('POST', `/cs/admin/support/cases/${cn}/resolve`, { who: 'agent', body: { summary: 'Fixed', code: 'fixed' } })).statusCode, 200)
  assert.equal((await set('in_progress')).statusCode, 409, 'resolved -> in_progress is not in the table')
  assert.equal((await set('closed')).statusCode, 200)
  assert.equal((await set('reopened')).statusCode, 200, 'staff can reopen a closed case')
})

test('escalation writes a concise handoff from the case, diagnostics and copilot; it is staff-only', async () => {
  const app = supportApp({ seedCases: false })
  const cn = (await create(app, 'a', 'My VOD review is stuck after two uploads')).json.case.caseNumber
  await app.call('POST', `/cs/admin/support/cases/${cn}/notes`, { who: 'agent', body: { text: 'Usage counter shows 7 of 10' } })
  await app.call('POST', `/cs/admin/support/cases/${cn}/status`, { who: 'agent', body: { status: 'triaged' } })
  const res = await app.call('POST', `/cs/admin/support/cases/${cn}/escalate`, { who: 'agent', body: { team: 'vod_ai', reason: 'Needs job inspection' } })
  assert.equal(res.statusCode, 200)
  const h = res.json.handoff
  for (const needle of [cn, 'vod_ai', 'Needs job inspection', COPILOT_MARKER, 'entitlement: degraded', 'Usage counter shows 7 of 10', 'VOD review is stuck', 'Do not ask the player to repeat']) {
    assert.ok(h.text.includes(needle), needle)
  }
  assert.equal(res.json.case.status, 'escalated')
  assert.equal(res.json.case.team, 'vod_ai')
  const staffView = (await app.call('GET', `/cs/admin/support/cases/${cn}`, { who: 'agent' })).json
  const esc = staffView.timeline.find((e) => e.kind === 'escalation')
  assert.equal(esc.visibleToPlayer, false)
  const player = (await app.call('GET', `/cs/me/support/cases/${cn}`, { who: 'a' })).json
  assert.ok(!JSON.stringify(player).includes('Needs job inspection'))
  assert.equal(player.bucket, 'waiting_on_recon')
  // Re-escalating to another team is allowed; escalating from waiting_on_player is not.
  assert.equal((await app.call('POST', `/cs/admin/support/cases/${cn}/escalate`, { who: 'agent', body: { team: 'leadership', reason: 'Second opinion' } })).statusCode, 200)
  assert.equal((await app.call('POST', `/cs/admin/support/cases/${cn}/escalate`, { who: 'agent', body: { team: 'accounts', reason: 'x' } })).statusCode, 400)
  const w = (await create(app, 'b', 'Another issue')).json.case.caseNumber
  await app.call('POST', `/cs/admin/support/cases/${w}/status`, { who: 'agent', body: { status: 'triaged' } })
  await app.call('POST', `/cs/admin/support/cases/${w}/status`, { who: 'agent', body: { status: 'waiting_on_player' } })
  assert.equal((await app.call('POST', `/cs/admin/support/cases/${w}/escalate`, { who: 'agent', body: { team: 'billing', reason: 'x' } })).statusCode, 409)
})

test('incidents: create, link many cases, draft-only customer update, timeline', async () => {
  const app = supportApp({ seedCases: false })
  const inc = await app.call('POST', '/cs/admin/support/incidents', { who: 'lead', body: { title: 'VOD processing delayed', service: 'vod_processing', severity: 'sev2', customerUpdateDraft: 'Reviews are delayed; no need to re-upload.' } })
  assert.equal(inc.statusCode, 201)
  const id = inc.json.incidentId
  assert.equal(inc.json.customerUpdate.published, false)
  const c1 = (await create(app, 'a', 'VOD stuck')).json.case.caseNumber
  const c2 = (await create(app, 'b', 'VOD also stuck')).json.case.caseNumber
  for (const cn of [c1, c2]) assert.equal((await app.call('POST', `/cs/admin/support/cases/${cn}/link-incident`, { who: 'agent', body: { incidentId: id } })).statusCode, 200)
  assert.equal((await app.call('POST', `/cs/admin/support/cases/${c1}/link-incident`, { who: 'agent', body: { incidentId: 'inc_doesnotexist0' } })).statusCode, 404)
  assert.equal((await app.call('POST', `/cs/admin/support/cases/${c1}/link-incident`, { who: 'agent', body: { incidentId: '../x' } })).statusCode, 400)
  const got = (await app.call('GET', `/cs/admin/support/incidents/${id}`, { who: 'agent' })).json
  assert.deepEqual(got.linkedCases.map((c) => c.caseNumber).sort(), [c1, c2].sort())
  const patched = await app.call('PATCH', `/cs/admin/support/incidents/${id}`, { who: 'lead', body: { status: 'identified', affectedCount: 2, customerUpdateDraft: 'Found the cause.' } })
  assert.equal(patched.statusCode, 200)
  assert.equal(patched.json.customerUpdate.published, false)
  assert.equal((await app.call('PATCH', `/cs/admin/support/incidents/${id}`, { who: 'lead', body: { published: true } })).statusCode, 400, 'there is no publish switch')
  const tl = await app.call('POST', `/cs/admin/support/incidents/${id}/timeline`, { who: 'lead', body: { kind: 'customer_update_draft', text: 'Fixed; reviews are flowing.' } })
  assert.equal(tl.statusCode, 201)
  assert.equal(tl.json.data.published, false)
  const after = (await app.call('GET', `/cs/admin/support/incidents/${id}`, { who: 'agent' })).json
  assert.deepEqual(after.timeline.map((e) => e.kind), ['update', 'status_change', 'customer_update_draft', 'customer_update_draft'])
  assert.equal(after.incident.customerUpdate.draft, 'Fixed; reviews are flowing.')
  const queue = (await app.call('GET', '/cs/admin/support/queue?view=incidents', { who: 'agent' })).json
  assert.deepEqual(queue.cases.map((c) => c.caseNumber).sort(), [c1, c2].sort())
  assert.ok(queue.incidents.some((i) => i.incidentId === id))
  const player = await app.call('GET', `/cs/me/support/cases/${c1}`, { who: 'a' })
  assert.ok(!player.body.includes(id), 'players never see incident ids')
})

// ---- reopen, CSAT -------------------------------------------------------------------------------

test('reopen: resolved <= 14 days reopens; later or closed opens a NEW linked case; CSAT once per resolution', async () => {
  const app = supportApp({ seedCases: false })
  const cn = (await create(app, 'a', 'Coaching session booking failed')).json.case.caseNumber
  const resolve = () => app.call('POST', `/cs/admin/support/cases/${cn}/resolve`, { who: 'agent', body: { summary: 'Rebooked', code: 'fixed' } })
  const csat = (rating) => app.call('POST', `/cs/me/support/cases/${cn}/csat`, { who: 'a', body: { rating } })

  assert.equal((await csat(5)).statusCode, 409, 'no rating before resolution')
  assert.equal((await resolve()).statusCode, 200)
  assert.equal((await csat(9)).statusCode, 400)
  assert.equal((await csat('up')).statusCode, 201)
  assert.equal((await csat(4)).statusCode, 409, 'asked once per resolution')

  app.clockRef.now += 3 * DAY
  const reopened = await app.call('POST', `/cs/me/support/cases/${cn}/reopen`, { who: 'a', body: { text: 'It failed again' } })
  assert.equal(reopened.statusCode, 200)
  assert.equal(reopened.json.reopened, true)
  assert.equal(reopened.json.case.status, 'reopened')
  assert.equal(reopened.json.case.reopenCount, 1)
  assert.equal((await app.call('POST', `/cs/me/support/cases/${cn}/reopen`, { who: 'a', body: {} })).statusCode, 409, 'only a resolved case can be reopened')

  await app.call('POST', `/cs/admin/support/cases/${cn}/status`, { who: 'agent', body: { status: 'in_progress' } })
  assert.equal((await resolve()).statusCode, 200)
  assert.equal((await csat(3)).statusCode, 201, 'a new resolution can be rated again')

  app.clockRef.now += 15 * DAY
  assert.equal((await app.call('POST', `/cs/me/support/cases/${cn}/reopen`, { who: 'a', body: {} })).statusCode, 400, 'past the window a reason is required')
  const linked = await app.call('POST', `/cs/me/support/cases/${cn}/reopen`, { who: 'a', body: { text: 'Still broken weeks later' } })
  assert.equal(linked.statusCode, 200)
  assert.equal(linked.json.reopened, false)
  assert.notEqual(linked.json.linkedCaseNumber, cn)
  assert.equal(linked.json.case.linkedFromCaseNumber, cn)
  const old = (await app.call('GET', `/cs/me/support/cases/${cn}`, { who: 'a' })).json
  assert.equal(old.status, 'resolved', 'the old case is not reopened')
  assert.deepEqual(old.linkedCaseNumbers, [linked.json.linkedCaseNumber])

  // Closed case: a player message opens a linked case too.
  const confirm = await app.call('POST', `/cs/me/support/cases/${linked.json.linkedCaseNumber}/resolve-confirm`, { who: 'a' })
  assert.equal(confirm.statusCode, 409, 'cannot confirm a case that is not resolved')
  await app.call('POST', `/cs/admin/support/cases/${linked.json.linkedCaseNumber}/resolve`, { who: 'agent', body: { summary: 'Done', code: 'fixed' } })
  const closed = await app.call('POST', `/cs/me/support/cases/${linked.json.linkedCaseNumber}/resolve-confirm`, { who: 'a' })
  assert.equal(closed.json.status, 'closed')
  const msg = await app.call('POST', `/cs/me/support/cases/${linked.json.linkedCaseNumber}/messages`, { who: 'a', body: { text: 'New problem on a closed case', clientRequestId: rid() } })
  assert.equal(msg.statusCode, 201)
  assert.ok(msg.json.linkedCaseNumber && msg.json.linkedCaseNumber !== linked.json.linkedCaseNumber)
})

test('player reply within 14 days of resolve reopens automatically', async () => {
  const app = supportApp({ seedCases: false })
  const cn = (await create(app, 'b', 'Stats look wrong on my profile')).json.case.caseNumber
  await app.call('POST', `/cs/admin/support/cases/${cn}/resolve`, { who: 'agent', body: { summary: 'Refreshed', code: 'fixed' } })
  app.clockRef.now += 14 * DAY
  const res = await app.call('POST', `/cs/me/support/cases/${cn}/messages`, { who: 'b', body: { text: 'Wrong again', clientRequestId: rid() } })
  assert.equal(res.json.status, 'reopened')
  assert.equal(res.json.linkedCaseNumber, null)
})

// ---- copilot, sensitive actions, tables -------------------------------------------------------

test('copilot output is staff-only and cannot trigger writes; no route executes a sensitive action', async () => {
  const app = supportApp()
  const w = seeded(app, 'in_progress')
  const before = JSON.stringify(await app.store.listAll())
  const staff = await app.call('GET', `/cs/admin/support/cases/${w.caseNumber}`, { who: 'agent' })
  assert.ok(staff.body.includes(COPILOT_MARKER))
  assert.equal(staff.json.copilot.advisoryOnly, true)
  assert.equal(JSON.stringify(await app.store.listAll()), before, 'viewing + copilot wrote nothing, despite its execute suggestions')
  const player = await app.call('GET', `/cs/me/support/cases/${w.caseNumber}`, { who: w.owner })
  assert.ok(!player.body.includes(COPILOT_MARKER))
  for (const path of ['/cs/admin/support/copilot/execute', `/cs/admin/support/cases/${w.caseNumber}/copilot`, `/cs/admin/support/cases/${w.caseNumber}/refund`, `/cs/admin/support/cases/${w.caseNumber}/entitlement`]) {
    assert.equal((await app.call('POST', path, { who: 'admin', body: {} })).statusCode, 404, path)
  }
  assert.equal(app.tablesUnchanged(), true)
  assert.ok(app.tableCalls.every((c) => !c.write))
})

test('entitlement repair end to end over HTTP never touches the tables', async () => {
  const app = supportApp()
  const cn = (await create(app, 'd', 'Paid but locked out', { category: 'access_entitlement' })).json.case.caseNumber
  const ar = await app.call('POST', `/cs/admin/support/cases/${cn}/action-requests`, { who: 'billing', body: { kind: 'entitlement_repair', reason: 'Ledger row canceled' } })
  assert.equal(ar.statusCode, 201)
  const path = `/cs/admin/support/cases/${cn}/action-requests/${ar.json.requestId}/decision`
  assert.equal((await app.call('POST', path, { who: 'lead', body: { decision: 'authorize' } })).statusCode, 200)
  assert.equal((await app.call('POST', path, { who: 'billing', body: { decision: 'done_externally', note: 'Fixed in Stripe' } })).json.status, 'done_externally')
  assert.equal((await app.call('POST', path, { who: 'admin', body: { decision: 'reject' } })).statusCode, 409, 'a finished request cannot change')
  assert.equal(app.tablesUnchanged(), true)
  assert.ok(app.tableCalls.every((c) => !c.write))
  const staff = (await app.call('GET', `/cs/admin/support/cases/${cn}`, { who: 'billing' })).json
  assert.equal(staff.actionRequests[0].status, 'done_externally')
})

// ---- queue, metrics, help, email review, KB, proactive ---------------------------------------

test('queue views, metrics window validation, help articles (reviewed only), KB and unmatched lists', async () => {
  const app = supportApp()
  for (const view of ['unassigned', 'mine', 'critical', 'billing', 'identity', 'vod', 'coaching', 'bugs', 'waiting', 'at_risk', 'incidents', 'all_open']) {
    const res = await app.call('GET', `/cs/admin/support/queue?view=${view}`, { who: 'agent' })
    assert.equal(res.statusCode, 200, view)
    assert.ok(res.json.cases.every((c) => !['resolved', 'closed'].includes(c.status)), `${view} shows open cases only`)
  }
  assert.equal((await app.call('GET', '/cs/admin/support/queue?view=everything', { who: 'agent' })).statusCode, 400)
  const mine = (await app.call('GET', '/cs/admin/support/queue?view=mine', { who: 'agent' })).json
  assert.ok(mine.cases.length > 0 && mine.cases.every((c) => c.assignee === STAFF.agent.email))
  const critical = (await app.call('GET', '/cs/admin/support/queue?view=critical', { who: 'agent' })).json
  assert.ok(critical.cases.every((c) => c.priority === 'p1' || c.severity === 'sev1'))

  const m = await app.call('GET', '/cs/admin/support/metrics?from=2026-08-01T00:00:00.000Z&to=2026-09-25T15:00:00.000Z', { who: 'lead' })
  assert.equal(m.statusCode, 200)
  assert.equal(m.json.created, 24)
  assert.ok(Number.isFinite(m.json.volumePerActiveMember))
  assert.equal((await app.call('GET', '/cs/admin/support/metrics?from=nope', { who: 'lead' })).statusCode, 400)
  assert.equal((await app.call('GET', '/cs/admin/support/metrics?from=2026-09-25T00:00:00.000Z&to=2026-09-01T00:00:00.000Z', { who: 'lead' })).statusCode, 400)
  assert.equal((await app.call('GET', '/cs/admin/support/metrics?from=2024-01-01T00:00:00.000Z&to=2026-09-01T00:00:00.000Z', { who: 'lead' })).statusCode, 400)

  const help = await app.call('GET', '/cs/help/articles?q=password')
  assert.equal(help.statusCode, 200, 'public: no token needed')
  assert.deepEqual(help.json.articles.map((a) => a.slug), ['reset-password'], 'drafts are never served')
  assert.equal((await app.call('GET', '/cs/help/articles/reset-password')).statusCode, 200)
  assert.equal((await app.call('GET', '/cs/help/articles/unreviewed-draft')).statusCode, 404)
  assert.equal((await app.call('GET', '/cs/help/articles/missing-one')).statusCode, 404)
  assert.equal((await app.call('GET', '/cs/help/articles/..%2Fsecrets')).statusCode, 400)

  assert.deepEqual((await app.call('GET', '/cs/admin/support/email/unmatched', { who: 'agent' })).json, { items: [] })
  assert.deepEqual((await app.call('GET', '/cs/admin/support/kb/proposals', { who: 'agent' })).json, { proposals: [], trendProposals: [] }, 'stub engine: no trend proposals')
  assert.equal((await app.call('POST', '/cs/admin/support/kb/proposals/kbp_0000000000000000/decision', { who: 'lead', body: { decision: 'accept' } })).statusCode, 404)
  assert.equal((await app.call('POST', '/cs/admin/support/email/unmatched/um_0000000000000000/assign', { who: 'agent', body: { caseNumber: 'R6-000001' } })).statusCode, 404)
})

test('proactive route: dry run unless dryRun=0, and creation needs the support.proactive flag', async () => {
  // The window must be the ISO week of the clock (SUPPORT_NOW = 2026-09-25 -> 2026-W39).
  const finding = { ruleId: 'past_due', email: PLAYERS.d.email, window: '2026-W39', category: 'billing_question', subject: 'Payment past due' }
  const { engines } = stubEngines({ evaluateProactive: () => ({ findings: [finding] }) })
  const off = supportApp({ engines, seedCases: false })
  const dry = await off.call('POST', '/cs/admin/support/proactive/run', { who: 'lead' })
  assert.equal(dry.statusCode, 200)
  assert.equal(dry.json.dryRun, true)
  assert.equal(dry.json.wouldCreate.length, 1)
  assert.equal((await off.call('POST', '/cs/admin/support/proactive/run?dryRun=0', { who: 'lead' })).statusCode, 409)
  const on = supportApp({ engines, seedCases: false, config: { support: { proactive: true } } })
  const run = await on.call('POST', '/cs/admin/support/proactive/run?dryRun=0', { who: 'admin' })
  assert.equal(run.json.created.length, 1)
  assert.equal((await on.call('POST', '/cs/admin/support/proactive/run?dryRun=0', { who: 'admin' })).json.duplicates.length, 1)
  assert.equal((await on.call('GET', '/cs/me/support/cases', { who: 'd' })).json.total, 0, 'the player is never told')
})

test('triage returns suggestions without creating anything', async () => {
  const app = supportApp()
  const before = JSON.stringify(await app.store.listAll())
  const res = await app.call('POST', '/cs/me/support/triage', { who: 'a', body: { text: 'my ubisoft account will not link', context: { page: '/account', platform: 'pc' } } })
  assert.equal(res.statusCode, 200)
  assert.equal(res.json.suggestedCategory, 'ubisoft_connection')
  assert.ok(res.json.questions.length > 0)
  assert.deepEqual(res.json.helpArticles.map((a) => a.slug), ['reset-password'])
  assert.ok(!res.body.includes(STAFF_ONLY_MARKER))
  assert.equal(JSON.stringify(await app.store.listAll()), before)
  assert.equal((await app.call('POST', '/cs/me/support/triage', { who: 'a', body: { text: 'x', extra: 1 } })).statusCode, 400)
})
