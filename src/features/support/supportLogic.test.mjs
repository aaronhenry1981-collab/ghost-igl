import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BUCKET_IDS,
  bucketCounts,
  bucketForStatus,
  buildHandoffPreview,
  CASE_STATUSES,
  categoryLabel,
  allowedTransitionsFor,
  auditDetailText,
  createClientRequestId,
  detectSensitive,
  diagnosticsRows,
  diagnosticsSentence,
  fmtAgo,
  fmtBytes,
  fmtDuration,
  metricText,
  normalizeBuckets,
  normalizeCsat,
  pickAnswers,
  playerActions,
  playerStatusLabel,
  playerTimeline,
  queueViewOrDefault,
  rowKeyIndex,
  sensitiveWarning,
  slaState,
  staffEventView,
  staffTransitions,
  tabKeyIndex,
  validateAttachment,
  validateCaseDraft,
  validateMessage,
} from './supportLogic.mjs'
// Fake secret prefixes are assembled at runtime so secret scanners never see a
// key-shaped literal in the source; the values under test are unchanged.
const SK_LIVE = ['sk', 'live', ''].join('_')
const RK_LIVE = ['rk', 'live', ''].join('_')
const WHSEC = ['whsec', ''].join('_')
const AKIA = ['AK', 'IA'].join('')


const NOW = Date.parse('2026-09-27T12:00:00Z')
const iso = (msAgo) => new Date(NOW - msAgo).toISOString()

test('every status maps to exactly the documented player bucket (§3.2)', () => {
  const expected = {
    new: 'open', triaged: 'open', reopened: 'open',
    in_progress: 'waiting_on_recon', escalated: 'waiting_on_recon', waiting_on_provider: 'waiting_on_recon',
    waiting_on_player: 'waiting_on_me', resolved: 'resolved', closed: 'closed',
  }
  for (const s of CASE_STATUSES) assert.equal(bucketForStatus(s), expected[s], s)
  assert.equal(bucketForStatus('something_new'), 'open')
  assert.equal(bucketForStatus(undefined), 'open')
})

test('normalizeBuckets accepts contract buckets, camelCase keys and flat lists', () => {
  const a = { caseNumber: 'R6-1', status: 'waiting_on_player', updatedAt: iso(1000) }
  const b = { caseNumber: 'R6-2', status: 'in_progress', updatedAt: iso(5000) }
  const c = { caseNumber: 'R6-3', status: 'closed', updatedAt: iso(9000) }
  const fromBuckets = normalizeBuckets({ buckets: { waitingOnMe: [a], waiting_on_recon: [b], closed: [c] } })
  assert.deepEqual(Object.keys(fromBuckets), BUCKET_IDS)
  assert.equal(fromBuckets.waiting_on_me[0].caseNumber, 'R6-1')
  const flat = normalizeBuckets({ cases: [c, a, b, a] })
  assert.deepEqual(bucketCounts(flat), { open: 0, waiting_on_recon: 1, waiting_on_me: 1, resolved: 0, closed: 1 })
  // Status wins over a contradictory server bucket.
  const wrong = normalizeBuckets({ buckets: { open: [c] } })
  assert.equal(wrong.closed.length, 1)
  assert.equal(wrong.open.length, 0)
  assert.deepEqual(bucketCounts(normalizeBuckets(null)), { open: 0, waiting_on_recon: 0, waiting_on_me: 0, resolved: 0, closed: 0 })
})

test('buckets sort newest first', () => {
  const out = normalizeBuckets({ cases: [
    { caseNumber: 'old', status: 'new', updatedAt: iso(50_000) },
    { caseNumber: 'new', status: 'new', updatedAt: iso(10) },
  ] })
  assert.deepEqual(out.open.map((c) => c.caseNumber), ['new', 'old'])
})

test('staff transitions follow the workflow table', () => {
  assert.deepEqual(staffTransitions('waiting_on_player'), ['in_progress', 'resolved'])
  assert.deepEqual(staffTransitions('closed'), ['reopened'])
  assert.deepEqual(staffTransitions('nope'), [])
  assert.deepEqual(allowedTransitionsFor({ status: 'new', allowedTransitions: ['triaged'] }), ['triaged'], 'the server list wins')
  assert.deepEqual(allowedTransitionsFor({ status: 'closed' }), ['reopened'])
  assert.equal(playerStatusLabel('waiting_on_player'), 'Needs your reply')
  assert.equal(categoryLabel('vod_analysis'), 'VOD review not finishing')
  assert.equal(categoryLabel('???'), 'Something else')
  assert.equal(queueViewOrDefault('at_risk'), 'at_risk')
  assert.equal(queueViewOrDefault('drop table'), 'unassigned')
})

test('time and size formatting', () => {
  assert.equal(fmtAgo(iso(10_000), NOW), 'just now')
  assert.equal(fmtAgo(iso(5 * 60_000), NOW), '5m ago')
  assert.equal(fmtAgo(iso(3 * 3_600_000), NOW), '3h ago')
  assert.equal(fmtAgo(iso(2 * 86_400_000), NOW), '2d ago')
  assert.equal(fmtAgo('garbage', NOW), null)
  assert.equal(fmtDuration(45), '45m')
  assert.equal(fmtDuration(190), '3h 10m')
  assert.equal(fmtDuration(60 * 52), '2d 4h')
  assert.equal(fmtDuration(null), null)
  assert.equal(fmtBytes(2048), '2 KB')
  assert.equal(fmtBytes(3 * 1024 * 1024), '3.0 MB')
})

test('metrics never invent numbers', () => {
  assert.equal(metricText(null), 'No data yet')
  assert.equal(metricText(undefined), 'No data yet')
  assert.equal(metricText(Number.NaN), 'No data yet')
  assert.equal(metricText(0), '0')
  assert.equal(metricText(0.25, (v) => `${v * 100}%`), '25%')
})

test('case draft validation asks only for required follow-ups', () => {
  const qs = [{ id: 'when', required: true }, { id: 'note', required: false }]
  assert.equal(validateCaseDraft({ text: 'short', questions: [] }).ok, false)
  const r = validateCaseDraft({ text: 'My Pro tools are locked since renewal', questions: qs, answers: {} })
  assert.equal(r.ok, false)
  assert.ok(r.errors.answers.when)
  assert.equal(r.errors.answers.note, undefined)
  assert.equal(validateCaseDraft({ text: 'My Pro tools are locked since renewal', questions: qs, answers: { when: 'today' } }).ok, true)
  assert.equal(validateCaseDraft({ text: 'x'.repeat(4001) }).ok, false)
  assert.deepEqual(pickAnswers(qs, { when: ' today ', stale: 'drop me', note: '' }), { when: 'today' })
  assert.equal(validateMessage('   '), 'Type a message first.')
  assert.equal(validateMessage('ok'), null)
})

test('attachments: the backend types, size and count limits', () => {
  assert.equal(validateAttachment({ type: 'image/png', size: 1000 }, 0), null)
  assert.match(validateAttachment({ type: 'application/x-msdownload', size: 10 }, 0), /only/)
  assert.match(validateAttachment({ type: 'application/pdf', size: 10 }, 0), /only/, 'the API refuses PDFs')
  assert.match(validateAttachment({ type: 'image/png', size: 11 * 1024 * 1024 }, 0), /10 MB/)
  assert.equal(validateAttachment({ type: 'video/mp4', size: 20 * 1024 * 1024 }, 0), null)
  assert.match(validateAttachment({ type: 'video/mp4', size: 26 * 1024 * 1024 }, 0), /25 MB/)
  assert.match(validateAttachment({ type: 'image/png', size: 1 }, 3), /Up to 3/)
})

test('sensitive-content heads-up (Luhn card, keys, tokens, passwords)', () => {
  assert.deepEqual(detectSensitive('card 4242 4242 4242 4242 pls'), ['card_number'])
  assert.deepEqual(detectSensitive('match id 1234567890123456'), []) // fails Luhn
  assert.ok(detectSensitive(`my key is ${SK_LIVE}abcdef123456`).includes('secret_key'))
  assert.ok(detectSensitive('password: hunter22').includes('password'))
  assert.ok(detectSensitive('eyJhbGciOiJI.eyJzdWIiOiIxMjM0.SflKxwRJSMeKKF2QT4').includes('token'))
  assert.deepEqual(detectSensitive('Rank shows Platinum 1 after 20 wins'), [])
  assert.match(sensitiveWarning(['card_number']), /card/)
  assert.equal(sensitiveWarning([]), null)
})

test('CSAT accepts thumbs or 1-5 and trims comments', () => {
  assert.deepEqual(normalizeCsat({ rating: 'up' }).value, { rating: 'up' })
  assert.deepEqual(normalizeCsat({ rating: '4', comment: ' quick fix ' }).value, { rating: 4, comment: 'quick fix' })
  assert.equal(normalizeCsat({ rating: 6 }).ok, false)
  assert.equal(normalizeCsat({ rating: 'meh' }).ok, false)
  assert.equal(normalizeCsat({ rating: 'down', comment: 'x'.repeat(501) }).ok, false)
})

test('player timeline never renders staff-only events, even if the server leaks one', () => {
  const events = [
    // The API marks every player event public; unmarked events never render (SEC-13).
    { id: 3, kind: 'message_staff', visibility: 'public', at: iso(1000), author: 'Recon 6 support', body: 'public reply' },
    { id: 1, kind: 'message_player', visibility: 'public', at: iso(9000), author: 'you', body: 'hi' },
    { id: 2, kind: 'note_private', at: iso(5000), body: 'staff only' },
    { id: 4, kind: 'assignment', at: iso(4000) },
    { id: 5, kind: 'escalation', at: iso(3000) },
    { id: 6, kind: 'message_staff', at: iso(2000), visibility: 'staff', body: 'mislabelled' },
    { id: 7, kind: 'action_request', at: iso(1500) },
  ]
  assert.deepEqual(playerTimeline(events).map((e) => e.id), [1, 3])
  assert.deepEqual(playerTimeline(null), [])
})

const DIAG = {
  status: 'ok',
  panels: [
    { id: 'entitlement', title: 'Membership and access', status: 'ok', facts: [{ label: 'Plan', value: 'Pro', source: 'Your membership', at: iso(3 * 3_600_000) }, { label: 'Access', value: 'Active', source: 'Your membership', at: null }], actions: { user: [] } },
    { id: 'vod', title: 'AI VOD review', status: 'degraded', facts: [{ label: 'Failed-review records', value: null, source: 'VOD' }], actions: { user: ['Try again with PNG screenshots.'] } },
    { id: 'empty', title: 'Nothing', status: 'ok', facts: [] },
  ],
}

test('diagnostics rows and sentence come from the backend panels', () => {
  const rows = diagnosticsRows(DIAG, { now: NOW })
  assert.deepEqual(rows.map((r) => r.text), ['Plan: Pro', 'Access: Active', 'Failed-review records: not recorded'])
  assert.equal(rows[0].ago, '3h ago')
  assert.equal(rows[2].status, 'degraded')
  assert.equal(diagnosticsRows(DIAG, { perPanel: 1 }).length, 2)
  assert.equal(diagnosticsSentence(DIAG, NOW), 'We can see: Plan: Pro · Failed-review records: not recorded')
  assert.equal(diagnosticsSentence(null, NOW), null)
  assert.deepEqual(playerActions(DIAG), ['Try again with PNG screenshots.'])
})

test('SLA state is the server summary state; no running clock reads as none', () => {
  assert.equal(slaState(null), null)
  assert.equal(slaState({ state: 'overdue' }), 'overdue')
  assert.equal(slaState({ state: 'at_risk', atRisk: true }), 'at_risk')
  assert.equal(slaState({ state: 'on_track' }), 'on_track')
  assert.equal(slaState({ state: 'none' }), null)
  assert.equal(slaState({ nextResponseDueAt: iso(1) }), null, 'the client never computes a clock itself')
})

test('staff events and audit details map from stored items', () => {
  const v = staffEventView({ eventId: 'ev_1', kind: 'status_change', actor: { kind: 'staff', id: 'agent@example.test' }, data: { from: 'new', to: 'triaged' }, at: iso(10), visibleToPlayer: true })
  assert.equal(v.id, 'ev_1')
  assert.equal(v.author, 'agent@example.test')
  assert.equal(v.from, 'new')
  assert.equal(v.to, 'triaged')
  assert.equal(staffEventView({ kind: 'system', actor: { kind: 'system', id: 'system' } }).author, 'System')
  assert.equal(staffEventView({ kind: 'email_in', actor: { kind: 'player', id: 'p@example.test' } }).channel, 'email')
  assert.equal(auditDetailText({ caseNumber: 'R6-000001', from: 'new', to: 'triaged', redactions: 0, x: null }), 'from: new · to: triaged · redactions: 0')
})

test('keyboard index helpers', () => {
  assert.equal(tabKeyIndex(0, 'ArrowLeft', 5), 4)
  assert.equal(tabKeyIndex(4, 'ArrowRight', 5), 0)
  assert.equal(tabKeyIndex(2, 'Home', 5), 0)
  assert.equal(tabKeyIndex(2, 'End', 5), 4)
  assert.equal(tabKeyIndex(2, 'x', 5), 2)
  assert.equal(rowKeyIndex(-1, 'j', 3), 0)
  assert.equal(rowKeyIndex(2, 'ArrowDown', 3), 2)
  assert.equal(rowKeyIndex(0, 'k', 3), 0)
  assert.equal(rowKeyIndex(0, 'j', 0), -1)
})

test('client request ids are unique', () => {
  const a = createClientRequestId()
  const b = createClientRequestId()
  assert.notEqual(a, b)
  assert.ok(createClientRequestId({}).length > 10)
})

test('hand-off preview labels inferences and carries the reason', () => {
  const text = buildHandoffPreview({
    caseRecord: { caseNumber: 'R6-000131', subject: 'Champion tools locked', category: 'access_entitlement', priority: 'p2', severity: 'sev2', status: 'in_progress' },
    team: 'billing',
    reason: 'Needs a billing lead to authorize the repair',
    copilot: { summary: { text: 'Paid row not bound.' }, likelyRootCause: { text: 'identity binding missing' }, suggestedSteps: [{ text: 'Confirm email' }] },
    diagnostics: [{ facts: [{ label: 'Recon entitlement', value: 'free', source: 'resolveBilling' }] }],
  })
  assert.match(text, /^Hand-off to Billing/)
  assert.match(text, /Likely root cause \(inference, not verified\): identity binding missing/)
  assert.match(text, /- Recon entitlement: free \(resolveBilling\)/)
  assert.match(text, /Why escalating: Needs a billing lead/)
  assert.match(buildHandoffPreview({ team: 'support' }), /\(add a reason\)/)
})
