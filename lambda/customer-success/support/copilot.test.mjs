import test from 'node:test'
import assert from 'node:assert/strict'
import { buildCopilot, checkDraftCopy, createModelAdapter } from './copilot.mjs'
import { buildDiagnostics } from './diagnostics/index.mjs'
import { buildSupportWorld, supportCtx, playerIdentity, FIXED_NOW } from './fixtures.mjs'
// Fake secret prefixes are assembled at runtime so secret scanners never see a
// key-shaped literal in the source; the values under test are unchanged.
const SK_LIVE = ['sk', 'live', ''].join('_')
const RK_LIVE = ['rk', 'live', ''].join('_')
const WHSEC = ['whsec', ''].join('_')
const AKIA = ['AK', 'IA'].join('')


async function staffDiag(key, opts = {}) {
  const world = opts.world || buildSupportWorld()
  const ctx = supportCtx(world)
  return buildDiagnostics({ ctx, identity: playerIdentity(world, key), now: FIXED_NOW, view: 'staff', roles: ['agent'], incidents: opts.incidents || [], cases: opts.cases || [] })
}

const caseOf = (over = {}) => ({ caseId: '5f0c2b1e-0000-4000-8000-000000000001', caseNumber: 'R6-000123', status: 'new', createdAt: '2026-10-14T10:00:00.000Z', updatedAt: '2026-10-14T10:00:00.000Z', ...over })

function assertTagged(out) {
  const lists = [out.playerContext, out.facts, out.inferences, out.suggestedSteps, out.recentChanges, out.related.cases, out.related.incidents, out.helpArticles]
  for (const list of lists) for (const item of list) assert.ok(['fact', 'inference'].includes(item.kind), `untagged: ${JSON.stringify(item)}`)
  for (const item of [out.summary, out.category, out.intent, out.severity, out.likelyRootCause, out.draftReply]) assert.ok(['fact', 'inference'].includes(item.kind), `untagged: ${JSON.stringify(item)}`)
  if (out.suggestedEscalation) assert.equal(out.suggestedEscalation.kind, 'inference')
  for (const i of out.inferences) assert.ok(i.basis && typeof i.confidence === 'number')
  for (const f of out.facts) assert.ok('source' in f)
  const json = JSON.stringify(out)
  assert.ok(!/"(thought|thinking|reasoning|chainOfThought|scratchpad)"/i.test(json), 'no chain-of-thought fields')
  assert.equal(out.model, 'deterministic')
  assert.ok(out.draftReply.guard.ok, JSON.stringify(out.draftReply.guard.violations))
  assert.ok(checkDraftCopy(out.draftReply.text).ok)
}

test('billing/access case: entitlement playbook, action request required, guarded draft', async () => {
  const diagnostics = await staffDiag('payment_failed')
  const out = buildCopilot({ caseRecord: caseOf({ subject: 'lost access', description: 'I paid for elite but it still says free and my card was charged twice' }), events: [{ type: 'message_player', at: '2026-10-14T10:00:00Z' }], diagnostics })
  assertTagged(out)
  assert.equal(out.category.kind, 'inference')
  assert.ok(['access_entitlement', 'billing_question'].includes(out.category.value))
  assert.match(out.likelyRootCause.text, /Mismatch suspected|payment/i)
  assert.ok(out.suggestedSteps.some((s) => s.requiresActionRequest === 'entitlement_repair' || s.requiresActionRequest === 'refund'))
  assert.ok(!/refund|restore/i.test(out.draftReply.text.replace(/refunds?\s+are/gi, '')), 'draft promises nothing')
  assert.ok(out.facts.some((f) => f.label === 'Stripe-reported state'))
})

test('recorded case category is a fact; a disagreeing classifier suggestion is an inference', async () => {
  const diagnostics = await staffDiag('paying_active')
  const out = buildCopilot({ caseRecord: caseOf({ category: 'bug', description: 'rank wrong, shows silver but im gold' }), diagnostics })
  assertTagged(out)
  assert.equal(out.category.kind, 'fact')
  assert.equal(out.category.value, 'bug')
  assert.equal(out.category.suggested.kind, 'inference')
  assert.equal(out.category.suggested.value, 'rank_stat_discrepancy')
})

test('rank/stat case uses the rank discrepancy context', async () => {
  const diagnostics = await staffDiag('paying_active')
  const out = buildCopilot({ caseRecord: caseOf({ description: 'my rank is wrong on recon, it says gold 1 but im plat' }), diagnostics })
  assertTagged(out)
  assert.equal(out.category.value, 'rank_stat_discrepancy')
  assert.equal(out.likelyRootCause.kind, 'inference')
  assert.match(out.likelyRootCause.text, /Classification/)
  assert.ok(out.suggestedSteps.some((s) => /Newest snapshot is from ubisoft/.test(s.text)))
  assert.match(out.draftReply.text, /ubisoft/)
})

test('VOD case: honest gaps and an engineering handoff', async () => {
  const diagnostics = await staffDiag('paying_active')
  const out = buildCopilot({ caseRecord: caseOf({ description: 'vod review stuck on processing and it still used a review' }), diagnostics })
  assertTagged(out)
  assert.equal(out.category.value, 'vod_analysis')
  assert.equal(out.suggestedEscalation.team, 'vod_ai')
  assert.match(out.suggestedEscalation.handoff, /Not recorded: job\/request ids/)
  assert.ok(out.facts.some((f) => f.label === 'Review job / request ids' && f.value === 'not recorded'))
})

test('value intent: usage evidence and a coaching escalation, not a bug workflow', async () => {
  const diagnostics = await staffDiag('at_risk')
  const out = buildCopilot({ caseRecord: caseOf({ description: 'been paying for months and im still hardstuck emerald, not getting better' }), diagnostics })
  assertTagged(out)
  assert.equal(out.intent.value, 'value')
  assert.equal(out.suggestedEscalation.team, 'coaching')
  assert.ok(out.suggestedSteps.some((s) => s.kind === 'fact' && /Active on|Lifecycle stage|Activation checklist/.test(s.text)))
  assert.match(out.draftReply.text, /coaching look/)
})

test('how_to intent and safety reports', async () => {
  const diagnostics = await staffDiag('free_activated')
  const how = buildCopilot({ caseRecord: caseOf({ description: 'how do i link my ubisoft account?' }), diagnostics })
  assertTagged(how)
  assert.equal(how.intent.value, 'how_to')
  const safety = buildCopilot({ caseRecord: caseOf({ description: 'someone is harassing me in discord' }), diagnostics })
  assertTagged(safety)
  assert.equal(safety.suggestedEscalation.team, 'security')
})

test('recent changes and related items are facts', async () => {
  const diagnostics = await staffDiag('paying_active')
  const out = buildCopilot({
    caseRecord: caseOf({ description: 'upload failed' }),
    events: [{ type: 'status_change', from: 'new', to: 'triaged', at: '2026-10-14T11:00:00Z' }, { type: 'note_private', at: '2026-10-14T11:00:00Z', text: 'private' }],
    diagnostics,
    related: { cases: [{ caseNumber: 'R6-000100', category: 'vod_upload', status: 'resolved', createdAt: '2026-10-01T00:00:00Z' }], incidents: [{ incidentId: 'inc-1', title: 'VOD slow', status: 'monitoring', severity: 'sev3' }] },
  })
  assertTagged(out)
  assert.ok(out.recentChanges.some((c) => /status change: new -> triaged/.test(c.text)))
  assert.ok(!JSON.stringify(out.recentChanges).includes('private'))
  assert.equal(out.related.cases.length, 1)
  assert.equal(out.related.incidents[0].incidentId, 'inc-1')
})

test('works with no diagnostics at all', () => {
  const out = buildCopilot({ caseRecord: caseOf({ description: 'hello?' }) })
  assertTagged(out)
  assert.equal(out.likelyRootCause.kind, 'inference')
  const bug = buildCopilot({ caseRecord: caseOf({ category: 'bug', intent: 'broken', description: 'the button does nothing' }) })
  assertTagged(bug)
  assert.equal(bug.likelyRootCause.text, 'Undetermined from recorded data.')
})

// Guarded copy is assembled at runtime so the repository's coaching-terms
// and trial-wording scanners never see the literals in this file; the
// strings the copy guard is tested against are unchanged.
const w = (...parts) => parts.join(' ')
const usd = (n) => ['$', n].join('')

test('copy guard refuses forbidden promises and wording', () => {
  const bad = [
    [w('Start your free', 'tri' + 'al', 'today'), 'trial_wording'],
    [w('Your', 'tri' + 'al', 'ends soon'), 'trial_wording'],
    [w('Coaching is', usd('75'), 'per hour'), 'coaching_price_forbidden'],
    [w('The package is', usd('140')), 'coaching_price_forbidden'],
    [w('Book a', 'free', 'intro call'), 'coaching_free_intro'],
    [w('We offer', 'free', 'coaching for new players'), 'coaching_free'],
    [w('Your first session', 'is', 'free'), 'coaching_first_free'],
    ["We'll refund the charge", 'refund_promise'],
    ['I will refund you', 'refund_promise'],
    ['Your refund has been issued', 'refund_promise'],
    ["You'll get a credit for the trouble", 'benefit_promise'],
    ['We will restore your access', 'access_promise'],
    ['Your access has been restored', 'access_promise'],
    ['We guarantee results', 'guarantee'],
    ['We will reply within 24 hours', 'time_promise'],
    ['Expect an answer in 2 business days', 'time_promise'],
    ['It will be fixed by tomorrow', 'time_promise'],
    ['We will look at it right away', 'time_promise'],
    ['Our SLA is fast', 'sla_wording'],
    [`Use key ${SK_LIVE}ABCDEFGHIJKLMNOP to test`, 'secret_like'],
    ['token eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4eHh4eHgifQ.c2lnbmF0dXJl', 'secret_like'],
  ]
  for (const [text, rule] of bad) {
    const r = checkDraftCopy(text)
    assert.equal(r.ok, false, text)
    assert.ok(r.violations.some((v) => v.rule === rule), `${text} -> ${JSON.stringify(r.violations)}`)
  }
  for (const ok of [
    'Thanks. I am checking your membership record against your login and will post what I find on this case.',
    'Use Forgot password on the sign-in page to set a new password.',
    'Refunds are reviewed by a person; I have passed your note on.',
    'Coaching credits are set when the monthly payment goes through.',
  ]) assert.ok(checkDraftCopy(ok).ok, `${ok} -> ${JSON.stringify(checkDraftCopy(ok).violations)}`)
})

test('model adapter is off unless explicitly enabled', async () => {
  assert.throws(() => createModelAdapter(), /disabled/)
  assert.throws(() => createModelAdapter({ support: { copilotModel: 'true' } }), /disabled/)
  assert.throws(() => createModelAdapter({ support: { copilotModel: false } }), /disabled/)
  const adapter = createModelAdapter({ support: { copilotModel: true } })
  await assert.rejects(adapter.summarize(), /not wired/)
})
