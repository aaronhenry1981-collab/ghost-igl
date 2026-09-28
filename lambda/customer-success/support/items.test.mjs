import test from 'node:test'
import assert from 'node:assert/strict'
import { CATEGORIES, CATEGORY_DEFAULTS, CATEGORY_GROUPS, EVENT_KINDS, caseEventItem, formatCaseNumber, supportAuditItem, uniqueSuffix } from './items.mjs'
import { STATUSES } from './workflow.mjs'
import { INCIDENT_STATUSES } from './incidents.mjs'
import { buildSupportCaseWorld, PLAYERS, STAFF } from './fixtures/world.mjs'
import * as engines from './engines.mjs'

const AT = '2026-09-25T15:00:00.000Z'
const caseRecord = { caseId: 'c-1', caseNumber: 'R6-000001', contactKey: 'pl_aaaaaaaaaaaaaaaaaaaa' }

test('same-millisecond burst: event and audit sort keys never collide', () => {
  const events = Array.from({ length: 500 }, () => caseEventItem({ caseRecord, kind: 'message_player', visibility: 'public', actor: { kind: 'player', id: 'x' }, at: AT }))
  assert.equal(new Set(events.map((e) => e.sk)).size, 500)
  assert.equal(new Set(events.map((e) => e.eventId)).size, 500)
  assert.ok(events.every((e) => e.sk.startsWith(`CEV#c-1#${AT}#`)))
  const audits = Array.from({ length: 500 }, () => supportAuditItem({ contactKey: caseRecord.contactKey, action: 'x', actor: 'y', at: AT }))
  assert.equal(new Set(audits.map((a) => a.sk)).size, 500)
  assert.ok(audits.every((a) => a.type === 'AUDIT' && a.sk.startsWith(`AUDIT#${AT}#`)), 'reuses the PR #24 AUDIT type')
  const suffixes = Array.from({ length: 50 }, uniqueSuffix)
  assert.deepEqual([...suffixes].sort(), suffixes, 'the sequence part keeps generation order')
  assert.equal(new Set(suffixes).size, 50)
})

test('staff-only kinds are forced to staff visibility whatever the caller asks', () => {
  for (const kind of ['note_private', 'assignment', 'escalation', 'incident_link', 'action_request']) {
    const e = caseEventItem({ caseRecord, kind, visibility: 'public', actor: { kind: 'staff', id: 's' }, at: AT })
    assert.equal(e.visibility, 'staff', kind)
  }
  assert.equal(caseEventItem({ caseRecord, kind: 'message_player', visibility: 'weird', actor: { kind: 'player' }, at: AT }).visibility, 'staff', 'unknown visibility fails closed')
  assert.throws(() => caseEventItem({ caseRecord, kind: 'stripe_refund', actor: { kind: 'staff' }, at: AT }))
  assert.equal(formatCaseNumber(123), 'R6-000123')
})

test('category tables are complete and consistent', () => {
  assert.deepEqual(Object.keys(CATEGORY_DEFAULTS).sort(), [...CATEGORIES].sort())
  for (const [group, list] of Object.entries(CATEGORY_GROUPS)) for (const c of list) assert.ok(CATEGORIES.includes(c), `${group}: ${c}`)
})

test('fixture world: fictional people only; every category, status, event kind and incident state covered', () => {
  const w = buildSupportCaseWorld()
  const cases = w.items.filter((i) => i.type === 'CASE')
  assert.deepEqual([...new Set(cases.map((c) => c.category))].sort(), [...CATEGORIES].sort())
  assert.deepEqual([...new Set(cases.map((c) => c.status))].sort(), [...STATUSES].sort())
  const kinds = new Set(w.items.filter((i) => i.type === 'CEV').map((e) => e.kind))
  for (const k of EVENT_KINDS) assert.ok(kinds.has(k), `event kind ${k} seeded`)
  assert.deepEqual([...new Set(w.incidents.map((i) => i.status))].sort(), [...INCIDENT_STATUSES].sort())
  const emails = [...Object.values(PLAYERS), ...Object.values(STAFF)].map((p) => p.email)
  assert.ok(emails.every((e) => e.endsWith('@example.test')))
  const all = JSON.stringify(w.items)
  for (const m of all.match(/[\w.+-]+@[\w.-]+/g) || []) assert.ok(/@example\.(test|com)$/.test(m), `only reserved domains: ${m}`)
  assert.ok(!/sk_live|whsec_|AKIA/.test(all))
})

test('engines.mjs exports every engine (real module or not_available stub)', () => {
  for (const name of ['classifyIssue', 'categoryInfo', 'buildDiagnostics', 'buildCopilot', 'searchHelp', 'getArticle', 'evaluateProactive', 'decideInboundEmail']) {
    assert.equal(typeof engines[name], 'function', name)
    assert.ok(['loaded', 'not_available'].includes(engines.ENGINE_STATUS[name]), name)
  }
  assert.equal(engines.ENGINE_STUBS.decideInboundEmail().action, 'unmatched', 'the email stub never attaches or creates')
  assert.equal(engines.ENGINE_STUBS.buildCopilot().status, 'not_available')
})
