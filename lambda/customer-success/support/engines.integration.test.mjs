// The support core wired to the REAL engine modules through engines.mjs
// (whatever is present; missing modules fall back to not_available stubs).
// Shape-level assertions only: the engines' own suites test their content.
// This file proves the service calls each engine with the signature it
// actually has.

import test from 'node:test'
import assert from 'node:assert/strict'
import * as realEngines from './engines.mjs'
import { CATEGORIES } from './items.mjs'
import { FAKE_STRIPE, PLAYERS, supportApp, supportServiceHarness } from './fixtures/world.mjs'

const allLoaded = Object.values(realEngines.ENGINE_STATUS).every((s) => s === 'loaded')
let seq = 0
const rid = () => `real-eng-${String((seq += 1)).padStart(6, '0')}`

test('real engines: triage, create, player and staff views, escalation, help, proactive', { skip: !allLoaded && 'some engine modules are not present yet' }, async () => {
  const app = supportApp({ engines: realEngines, seedCases: false })

  const triage = await app.call('POST', '/cs/me/support/triage', { who: 'd', body: { text: 'I paid for Pro but the features are still locked' } })
  assert.equal(triage.statusCode, 200)
  assert.ok(CATEGORIES.includes(triage.json.suggestedCategory))
  assert.ok(Array.isArray(triage.json.questions))
  assert.ok(triage.json.questions.every((q) => typeof q.prompt === 'string'))
  assert.ok(Array.isArray(triage.json.diagnosticsPreview.panels) && triage.json.diagnosticsPreview.panels.length > 0)
  assert.ok(triage.json.helpArticles.every((a) => a.status === 'reviewed'))
  assert.ok(!triage.body.includes(FAKE_STRIPE.customer))

  const created = await app.call('POST', '/cs/me/support/cases', { who: 'd', body: { text: 'I paid for Pro but the features are still locked', clientRequestId: rid() } })
  assert.equal(created.statusCode, 201)
  const cn = created.json.case.caseNumber
  assert.ok(CATEGORIES.includes(created.json.case.category))

  const mine = await app.call('GET', `/cs/me/support/cases/${cn}`, { who: 'd' })
  assert.equal(mine.statusCode, 200)
  assert.ok(mine.json.diagnostics.panels.length > 0)
  assert.ok(!mine.body.includes('cus_'), 'no Stripe ids in the player view')

  const agent = await app.call('GET', `/cs/admin/support/cases/${cn}`, { who: 'agent' })
  assert.equal(agent.statusCode, 200)
  assert.equal(agent.json.copilot.advisoryOnly, true)
  assert.ok(agent.json.copilot.summary, 'the real copilot produced a summary')
  assert.ok(agent.json.diagnostics.panels.length > 0)
  assert.ok(!agent.body.includes(FAKE_STRIPE.customer), 'agents see masked billing ids')
  const billing = await app.call('GET', `/cs/admin/support/cases/${cn}`, { who: 'billing' })
  assert.ok(billing.body.includes(FAKE_STRIPE.customer), 'billing sees the full reference')

  const esc = await app.call('POST', `/cs/admin/support/cases/${cn}/escalate`, { who: 'agent', body: { team: 'billing', reason: 'Ledger check needed' } })
  assert.equal(esc.statusCode, 200)
  assert.ok(esc.json.handoff.text.includes(cn))
  assert.ok(esc.json.handoff.summary && !esc.json.handoff.summary.includes('[object Object]'))

  const help = await app.call('GET', '/cs/help/articles?q=password reset')
  assert.equal(help.statusCode, 200)
  assert.ok(help.json.articles.every((a) => a.status === 'reviewed'))
  if (help.json.articles.length) assert.equal((await app.call('GET', `/cs/help/articles/${help.json.articles[0].slug}`)).statusCode, 200)

  const pro = await app.call('POST', '/cs/admin/support/proactive/run', { who: 'lead' })
  assert.equal(pro.statusCode, 200)
  assert.equal(pro.json.dryRun, true)
  assert.ok(Array.isArray(pro.json.wouldCreate))
  assert.equal(app.tablesUnchanged(), true)
})

test('the core category list equals the classifier vocabulary', { skip: realEngines.ENGINE_STATUS.classifyIssue !== 'loaded' && 'classifier not present' }, async () => {
  const classify = await import('./classify.mjs')
  assert.deepEqual([...CATEGORIES].sort(), Object.keys(classify.CATEGORIES).sort())
})

test('real email engine: a verified known sender opens a case; an unverified one goes to review', { skip: !allLoaded && 'some engine modules are not present yet' }, async () => {
  const h = supportServiceHarness({ engines: realEngines, seedCases: false })
  const raw = (from, id) => [
    `From: Fixture Player <${from}>`,
    'To: support@r6coaching.com',
    'Subject: VOD review never finished',
    `Message-ID: <${id}@mail.example.test>`,
    'Date: Thu, 25 Sep 2026 14:00:00 +0000',
    'Content-Type: text/plain; charset=utf-8',
    '',
    'My VOD review has been processing since yesterday.',
  ].join('\r\n')
  const pass = { spf: 'PASS', dkim: 'PASS', dmarc: 'PASS' }
  const ok = await h.service.ingestInboundEmail({ raw: raw(PLAYERS.b.email, 'real-1'), verdicts: pass })
  assert.equal(ok.status, 'new_case', JSON.stringify(ok))
  const again = await h.service.ingestInboundEmail({ raw: raw(PLAYERS.b.email, 'real-1'), verdicts: pass })
  assert.ok(['duplicate', 'ignored'].includes(again.status), JSON.stringify(again))
  const unverified = await h.service.ingestInboundEmail({ raw: raw(PLAYERS.c.email, 'real-2'), verdicts: { spf: 'FAIL', dkim: 'FAIL', dmarc: 'FAIL' } })
  assert.equal(unverified.status, 'unmatched')
  const stranger = await h.service.ingestInboundEmail({ raw: raw('stranger@example.com', 'real-3'), verdicts: pass })
  assert.equal(stranger.status, 'unmatched')
  const cases = (await h.store.listAll()).filter((i) => i.type === 'CASE')
  assert.equal(cases.length, 1)
  assert.equal(cases[0].source, 'email')
})
